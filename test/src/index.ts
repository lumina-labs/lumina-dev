import express from 'express';
import cors from 'cors';
import zod from 'zod';
import launchEditor from 'react-dev-utils/launchEditor';
import { nanoid } from 'nanoid';
import patch from './patch';

export { IdlMap, Source, SourceMap } from './patch';

export default function lumina() {
  process.stdout.write(
    `\n⬜ Lumina: View local debug info at \x1b[34mhttps://lumina.fyi/debug\x1b[0m`,
  );

  const id = nanoid();
  const { idlMap, sourceMap, signatures } = patch();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/id', (req, res) => {
    return res.json({ id });
  });

  app.get('/idl_map/:id', (req, res) => {
    if (req.params.id !== id) {
      return res.sendStatus(404);
    }

    return res.json({ idlMap });
  });

  app.get('/source_map/:id', (req, res) => {
    if (req.params.id !== id) {
      return res.sendStatus(404);
    }

    return res.json({ sourceMap });
  });

  app.get('/signatures/:id', (req, res) => {
    if (req.params.id !== id) {
      return res.sendStatus(404);
    }

    const schema = zod.object({ since: zod.string().optional() });
    const { since } = schema.parse(req.query);

    if (!since) {
      return res.json({ signatures });
    }

    const sinceIndex = signatures.findIndex((signature) => signature === since);

    if (sinceIndex === -1) {
      return res.sendStatus(404);
    }

    return res.json({ signatures: signatures.slice(0, sinceIndex) });
  });

  app.post('/launch_editor', (req, res) => {
    const schema = zod.object({
      fileName: zod.string(),
      lineNumber: zod.number().int().nonnegative(),
      colNumber: zod.number().int().nonnegative(),
    });

    const { fileName, lineNumber, colNumber } = schema.parse(req.body);

    launchEditor(fileName, lineNumber, colNumber);
  });

  app.listen(8799);
}
