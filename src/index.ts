import express, { type Application, type Request, type Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { globalErrorHandler, AppError } from './middlewares/errorHandler';
import fs from 'node:fs';
import https from 'node:https';
import { buildSuccessResponse, buildErrorResponse, buildPaginatedResponse } from './utils/responseBuilder';
import { sanitizeInputMiddleware } from './middlewares/sanitizeInput';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. Configuración de Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// 2. Configuración de Swagger
const swaggerPath = path.join(__dirname, '../docs/openapi.yaml');
let swaggerDocument;
try {
  swaggerDocument = YAML.load(swaggerPath);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  console.warn('No se pudo cargar el archivo openapi.yaml. La documentación no estará disponible.');
}

// 3. Middlewares Base
app.use(express.json());
app.use(sanitizeInputMiddleware);
app.use(cors());

// 4. Rutas de Documentación
if (swaggerDocument) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/docs/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
}

// 5. Definición de API v1 (Router)
const apiV1Router = Router();

// Endpoint base de verificación
apiV1Router.get('/', (req: Request, res: Response) => {
  res.status(200).json(buildSuccessResponse({
    message: 'API v1 funcionando correctamente',
    environment: isProduction ? 'Production' : 'Development'
  }));
});

// Endpoint de prueba para errores (puedes borrarlo luego)
apiV1Router.get('/test-error', (req: Request, res: Response, next) => {
  next(new AppError('Simulación de error controlado', 400));
});

async function getItems(page: number, pageSize: number) {
  const allItems = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = allItems.slice(startIndex, endIndex);
  const totalItems = allItems.length;
  return { items, totalItems };
}

apiV1Router.get('/items', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (page < 1 || pageSize < 1) {
      return res.status(400).json(buildErrorResponse(
        "INVALID_PARAMETERS",
        "Los parámetros 'page' y 'pageSize' deben ser números positivos."
      ));
    }

    const { items, totalItems } = await getItems(page, pageSize);

    res.status(200).json(buildPaginatedResponse(items, totalItems, page, pageSize));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    res.status(500).json(buildErrorResponse("INTERNAL_SERVER_ERROR", error.message));
  }
});

// Montar el router en /api/v1
app.use('/api/v1', apiV1Router);

// 6. Manejo de Rutas No Encontradas (404)
app.all('*path', (req: Request, res: Response, next) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl}`, 404));
});

// 7. Middleware Global de Errores
app.use(globalErrorHandler);

// 8. Validación de Conexión y Arranque del Servidor
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a Base de Datos exitosa');

    if (isProduction) {
      const keyPath = process.env.SSL_KEY_PATH;
      const certPath = process.env.SSL_CERT_PATH;

      if (!keyPath || !certPath || !fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        throw new Error('Certificados SSL no encontrados en las rutas especificadas del .env');
      }

      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`Servidor Seguro corriendo en https://localhost:${PORT}`);
      });

    } else {
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Documentación: http://localhost:${PORT}/docs`);
      });
    }

  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();