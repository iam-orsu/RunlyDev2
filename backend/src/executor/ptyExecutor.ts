import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import * as pty from 'node-pty';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { LanguageId, getFilename } from '../languages';

const MAX_OUTPUT_BYTES = 65536;
const EXECUTION_TIMEOUT_MS = 30000;

export interface FileEntry {
  name: string;
  content: string;
}

export interface LanguageConfig {
  memory: string;
  pidsLimit: number;
  extraTmpfs: string[][];
  envVars: string[];
  user?: string;
  timeout?: number;
}

function getLanguageConfig(language: LanguageId): LanguageConfig {
  switch (language) {
    case 'python':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'node':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'c':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'cpp':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'java':
      return {
        memory: '512m', pidsLimit: 128,
        extraTmpfs: [['/tmp', 'size=100m,exec'], ['/home', 'size=10m']],
        envVars: ['_JAVA_OPTIONS=-Duser.home=/tmp', 'HOME=/tmp']
      };
    case 'go':
      return {
        memory: '512m', pidsLimit: 512,
        timeout: 60000,
        extraTmpfs: [
          ['/tmp', 'size=200m,exec'],
          ['/.cache', 'size=200m'],
          ['/tmp/go', 'size=200m'],
          ['/home', 'size=10m']
        ],
        envVars: [
          'HOME=/tmp',
          'GOCACHE=/tmp/.cache',
          'GOPATH=/tmp/go',
          'GOFLAGS=-mod=mod'
        ]
      };
    case 'rust':
      return {
        memory: '512m', pidsLimit: 128,
        user: 'root',
        extraTmpfs: [
          ['/tmp', 'size=200m,exec'],
          ['/.cargo', 'size=200m'],
          ['/.rustup', 'size=100m'],
          ['/home', 'size=10m']
        ],
        envVars: [
          'HOME=/root',
          'RUSTUP_HOME=/.rustup',
          'CARGO_HOME=/.cargo'
        ]
      };
    case 'php':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'ruby':
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
    case 'csharp':
      return {
        memory: '512m', pidsLimit: 256,
        user: 'root',
        extraTmpfs: [
          ['/tmp', 'size=200m,exec'],
          ['/tmp/nuget', 'size=200m'],
          ['/.cache', 'size=200m'],
          ['/root', 'size=200m'],
          ['/home', 'size=10m']
        ],
        envVars: [
          'HOME=/root',
          'NUGET_PACKAGES=/tmp/nuget',
          'DOTNET_CLI_HOME=/root/.dotnet',
          'DOTNET_ROOT=/usr/local/dotnet',
          'DOTNET_NOLOGO=1',
          'DOTNET_CLI_TELEMETRY_OPTOUT=1'
        ]
      };
    default:
      return {
        memory: '256m', pidsLimit: 64,
        extraTmpfs: [['/tmp', 'size=50m,exec'], ['/home', 'size=10m']],
        envVars: ['HOME=/tmp']
      };
  }
}

export async function executePty(
  ws: WebSocket,
  languageId: LanguageId,
  files: FileEntry[],
  submissionId: string
): Promise<void> {
  let isDone = false;
  let timeoutHandle: NodeJS.Timeout;
  let cleanupHandle: NodeJS.Timeout;
  
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const hostCodeDir = `/tmp/runly-code/runly-${submissionId}-${randomSuffix}`;
  let ptyProcess: pty.IPty | null = null;
  let bytesSent = 0;
  let outputCapped = false;

  const cleanup = async () => {
    isDone = true;
    clearTimeout(timeoutHandle);
    
    if (ptyProcess) {
      try {
        ptyProcess.kill('SIGKILL');
      } catch (err) {
        // process likely already dead
      }
      ptyProcess = null;
    }

    // Schedule delayed directory cleanup (5s after process dies)
    clearTimeout(cleanupHandle);
    cleanupHandle = setTimeout(async () => {
      try {
        await fs.rm(hostCodeDir, { recursive: true, force: true });
      } catch (err) {
        logger.error({ submissionId, err }, 'Failed to cleanup tmp directory');
      }
    }, 5000);
  };

  try {
    // 1. Write source files
    await fs.mkdir(hostCodeDir, { recursive: true });
    if (files.length > 0) {
      for (const file of files) {
        const filePath = path.join(hostCodeDir, file.name);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content, 'utf8');
      }
    } else {
      // Create empty main file if nothing provided
      await fs.writeFile(path.join(hostCodeDir, getFilename(languageId)), '', 'utf8');
    }

    // 2. Spawn PTY Docker process
    const config = getLanguageConfig(languageId);
    
    const tmpfsFlags = config.extraTmpfs.flatMap(([path, opts]) => ['--tmpfs', `${path}:${opts}`]);
    const envFlags = config.envVars.flatMap(e => ['-e', e]);
    const userFlags = config.user ? ['--user', config.user] : [];

    const dockerArgs = [
      'run', '--rm', '-i',
      '--network=none',
      '--read-only',
      `--memory=${config.memory}`,
      '--cpus=0.5',
      `--pids-limit=${config.pidsLimit}`,
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      ...tmpfsFlags,
      ...envFlags,
      ...userFlags,
      '-v', `${hostCodeDir}:/code:ro`,
      'runly-sandbox',
      languageId
    ];

    ptyProcess = pty.spawn('docker', dockerArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: hostCodeDir,
      env: process.env as any
    });

    // 3. Pipe PTY stdout -> WebSocket
    ptyProcess.onData((data: string) => {
      // Filter Java noise
      const filtered = data
        .split('\n')
        .filter(line => 
          !line.includes('Picked up JAVA_TOOL_OPTIONS') &&
          !line.includes('Picked up _JAVA_OPTIONS')
        )
        .join('\n');
      
      if (!filtered.trim() && data.trim()) return;

      if (outputCapped) return;

      const chunkBytes = Buffer.byteLength(filtered, 'utf8');
      if (bytesSent + chunkBytes > MAX_OUTPUT_BYTES) {
        outputCapped = true;
        const remaining = MAX_OUTPUT_BYTES - bytesSent;
        if (remaining > 0) {
          const trunc = Buffer.from(filtered, 'utf8').subarray(0, remaining).toString('utf8');
          try { ws.send(JSON.stringify({ type: 'output', data: trunc })); } catch {}
        }
        try { 
          ws.send(JSON.stringify({ 
            type: 'output', 
            data: '\r\n\x1b[33m[Output truncated at 64KB limit]\x1b[0m\r\n' 
          })); 
        } catch {}
      } else {
        bytesSent += chunkBytes;
        try {
          ws.send(JSON.stringify({ type: 'output', data: filtered }));
        } catch (err) {
          // If WS is closed, ignore mapping errors
        }
      }
    });

    // 4. Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
      if (isDone) return;
      isDone = true;
      try {
        ws.send(JSON.stringify({ type: 'exit', exitCode, timedOut: false }));
      } catch {}
      cleanup();
    });

    // 5. Per-language timeout
    const timeoutMs = config.timeout || EXECUTION_TIMEOUT_MS;
    timeoutHandle = setTimeout(() => {
      if (isDone) return;
      isDone = true;
      try {
        ws.send(JSON.stringify({ type: 'exit', exitCode: null, timedOut: true }));
      } catch {}
      logger.warn({ submissionId, languageId }, `PTY execution timed out after ${timeoutMs}ms`);
      cleanup();
    }, timeoutMs);

    // 6. Handle incoming client messages
    ws.on('message', (raw) => {
      if (isDone) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'input' && typeof msg.data === 'string' && ptyProcess) {
          ptyProcess.write(msg.data);
        } else if (msg.type === 'resize' && ptyProcess) {
          const cols = Math.max(1, parseInt(msg.cols, 10) || 80);
          const rows = Math.max(1, parseInt(msg.rows, 10) || 24);
          ptyProcess.resize(cols, rows);
        }
      } catch (e) {
        // malformed message
      }
    });

    // 7. Client disconnected early
    ws.on('close', () => {
      if (!isDone) {
        logger.info({ submissionId }, 'WebSocket closed inside PTY logic, cleaning up');
        cleanup();
      }
    });

    ws.on('error', () => {
      if (!isDone) cleanup();
    });

  } catch (err) {
    logger.error({ submissionId, err }, 'Failed to initialize PTY execution');
    try {
      ws.send(JSON.stringify({ type: 'output', data: `\r\n\x1b[31mInternal Engine Error: ${(err as Error).message}\x1b[0m\r\n` }));
      ws.send(JSON.stringify({ type: 'exit', exitCode: -1, timedOut: false }));
    } catch {}
    cleanup();
  }
}
