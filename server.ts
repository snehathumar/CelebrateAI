import express, { Express } from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './src/server/routes/api';
import { errorHandler } from './src/server/middleware/errorHandler';
import {
  DEFAULT_PORT,
  JSON_PAYLOAD_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_GENERAL_MAX,
  IMMUTABLE_CACHE_CONTROL,
} from './src/server/constants';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app: Express = express();
const PORT = process.env.PORT || DEFAULT_PORT;

// Security headers with Helmet
// Configured to permit embedding in the AI Studio preview environment
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

// High-efficiency gzip/brotli response compression
app.use(compression());

// Strict JSON request body payload limit (100kb)
app.use(express.json({ limit: JSON_PAYLOAD_LIMIT }));

// General rate limiter for all /api endpoints: 30 requests/minute per IP
export const generalApiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_GENERAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please wait a minute before trying again (limit: 30 req/min).',
  },
});

app.use('/api', generalApiLimiter);

// Mount modular API routes
app.use('/api', apiRouter);

// Centralized error handling middleware
app.use(errorHandler);

// Full-stack Vite & static assets handling
export async function startServer(): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(path.join(__dirname, 'dist'), {
        maxAge: '1h',
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', IMMUTABLE_CACHE_CONTROL);
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Only listen when executed directly rather than imported in tests
  if (!isTestEnv) {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Celebration & Event Planner server running on http://0.0.0.0:${PORT}`);
    });
  }
}

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

// Auto-start server in non-test environments
if (!isTestEnv) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
