import { Router, Request, Response } from 'express';
import { LANGUAGES } from '../languages';

const router = Router();

// ─── GET /api/languages ───────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const languages = Object.values(LANGUAGES).map((lang) => ({
    id: lang.id,
    name: lang.name,
    extension: lang.extension,
    monacoId: lang.monacoId,
    defaultCode: lang.defaultCode,
  }));

  res.json(languages);
});

export default router;
