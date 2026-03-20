#!/bin/bash
set -eo pipefail

# ─────────────────────────────────────────────────────────────────
# Runly.dev Sandbox Entrypoint
# Usage: /entrypoint.sh <language>
# Expects: /code/main.{ext} (source code, read-only mount)
#          /code/stdin.txt   (optional stdin, read-only mount)
# Outputs: stdout/stderr to container logs
#          /tmp/meta.json    (execution metadata for worker)
# ─────────────────────────────────────────────────────────────────

LANGUAGE=$1

# ─── Safe stdin handling ────────────────────────────────────────
# Never crash if stdin.txt is missing — fall back to /dev/null
if [ -f /code/stdin.txt ]; then
  STDIN_FILE=/code/stdin.txt
else
  STDIN_FILE=/dev/null
fi

# ─── Output cap (64KB) ─────────────────────────────────────────
MAX_OUTPUT=65536

# ─── Compile function ──────────────────────────────────────────
# Runs the compile command. On failure, writes compile error to
# stderr and meta.json, then exits with code 1.
compile() {
  local compile_cmd=$1
  eval "$compile_cmd" 2>/tmp/compile.err
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    cat /tmp/compile.err >&2
    echo "{\"exit_code\": 1, \"timed_out\": false, \"status\": \"compile_error\"}" > /tmp/meta.json
    exit 1
  fi
  # Prevent exit code 126 — ensure binary is executable
  if [ -f /tmp/main ]; then
    chmod +x /tmp/main
  fi
}

# ─── Run function ──────────────────────────────────────────────
# Runs the code with stdin piped in, caps output at 64KB.
# Uses PIPESTATUS to capture the actual program exit code
# (not the exit code of head).
run_code() {
  local run_cmd=$1
  eval "$run_cmd" < "$STDIN_FILE" 2>&1 | head -c $MAX_OUTPUT
  EXIT_CODE=${PIPESTATUS[0]}
  echo "{\"exit_code\": $EXIT_CODE, \"timed_out\": false, \"status\": \"done\"}" > /tmp/meta.json
}

# ─── Language dispatch ──────────────────────────────────────────
case $LANGUAGE in

  python)
    run_code "python3 /code/main.py"
    ;;

  node)
    run_code "node /code/main.js"
    ;;

  c)
    compile "gcc /code/main.c -o /tmp/main -lm"
    run_code "/tmp/main"
    ;;

  cpp)
    compile "g++ /code/main.cpp -o /tmp/main -std=c++17 -lm"
    run_code "/tmp/main"
    ;;

  java)
    # Java class MUST be named Main, file MUST be Main.java
    compile "javac -d /tmp /code/Main.java"
    run_code "java -cp /tmp Main"
    ;;

  go)
    # Go needs writable dirs for build cache — copy source to /tmp
    mkdir -p /tmp/go-build
    cp /code/main.go /tmp/go-build/main.go
    compile "cd /tmp/go-build && go build -o /tmp/main /tmp/go-build/main.go"
    run_code "/tmp/main"
    ;;

  rust)
    compile "rustc /code/main.rs -o /tmp/main"
    run_code "/tmp/main"
    ;;

  php)
    run_code "php /code/main.php"
    ;;

  ruby)
    run_code "ruby /code/main.rb"
    ;;

  *)
    echo "Unsupported language: $LANGUAGE" >&2
    echo "{\"exit_code\": 1, \"timed_out\": false, \"status\": \"error\"}" > /tmp/meta.json
    exit 1
    ;;

esac
