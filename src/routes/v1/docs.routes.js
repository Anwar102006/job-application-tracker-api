import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../docs/swagger.json'), 'utf8')
);

// Serve raw OpenAPI JSON specification
router.get('/swagger.json', (_req, res) => {
  res.status(200).json(swaggerSpec);
});

// Serve interactive Swagger UI
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
