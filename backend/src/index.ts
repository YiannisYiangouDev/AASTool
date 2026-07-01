import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// ── Environment ──────────────────────────────────────────────────
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '4000', 10);
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const TRUST_PROXY = process.env.TRUST_PROXY || 'false';
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || '1mb';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 min
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

// ── Logger ────────────────────────────────────────────────────────
const logger = {
  info: (...args: any[]) => { if (LOG_LEVEL !== 'silent') console.log(`[${new Date().toISOString()}] [INFO]`, ...args); },
  warn: (...args: any[]) => console.warn(`[${new Date().toISOString()}] [WARN]`, ...args),
  error: (...args: any[]) => console.error(`[${new Date().toISOString()}] [ERROR]`, ...args),
  debug: (...args: any[]) => { if (LOG_LEVEL === 'debug') console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args); },
};

// ── App Setup ─────────────────────────────────────────────────────
const app = express();

// Trust proxy (for Azure App Service, load balancers)
if (TRUST_PROXY === 'true' || TRUST_PROXY === '1') {
  app.set('trust proxy', true);
  logger.info('Trust proxy enabled');
}

// Security headers
app.use(helmet());

// CORS — allow only configured origins
const allowedOrigins = CORS_ORIGIN
  ? CORS_ORIGIN.split(',').map((s: string) => s.trim()).filter(Boolean)
  : [];
if (allowedOrigins.length > 0) {
  app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
} else {
  // In development, allow all origins
  app.use(cors());
  logger.warn('CORS: no CORS_ORIGIN set — allowing all origins (development mode)');
}

// Compression
app.use(compression());

// Request size limit
app.use(express.json({ limit: REQUEST_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_LIMIT }));

// Rate limiting (only in production)
if (NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);
  logger.info(`Rate limiting: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`);
}

// ── JSON parse error middleware ──────────────────────────────────
app.use((err: any, _req: any, res: any, next: any) => {
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }
    if (err && err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ ok: false, error: 'Malformed JSON' });
    }
    return next(err);
});

const startTime = Date.now();
let ready = false;

// ── Imports ───────────────────────────────────────────────────────
import evaluateController from './controllers/evaluateController';
import { getCriteria, getBuildingTypes, getCriterionByCode, getNebThresholds, getConfig, getDisabilityTypes, getAssessmentDimensions, createCriterion } from './controllers/dataController';
import { getBuildings, getBuilding } from './controllers/buildingsController';
import { createAssessment, getAssessment } from './controllers/assessmentsController';
import { getReports } from './controllers/reportsController';
import { login } from './controllers/authController';
import AppDataSource from './data-source';

// ── Start Sequence ────────────────────────────────────────────────
async function start() {
  logger.info(`Starting AASTool Backend v${APP_VERSION} (${NODE_ENV})`);

  try {
    await AppDataSource.initialize();
    logger.info('DataSource initialized');

    // Dynamic import for metadata validation
    const meta = await import('./services/metadataService');
    await meta.default.validateMetadata();
    logger.info('Metadata validation passed');
    ready = true;
  } catch (err) {
    logger.error('Startup failed:', err);
    // In production, exit so the orchestrator can restart
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
    // In development, start anyway for debugging
    logger.warn('Starting with degraded functionality (DB may be unavailable)');
  }
}

// ── Routes ────────────────────────────────────────────────────────

// Liveness probe — lightweight, no DB check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe — checks DB
app.get('/ready', async (_req, res) => {
  if (!ready) {
    return res.status(503).json({ status: 'not ready', uptime: Math.floor((Date.now() - startTime) / 1000) });
  }
  try {
    const dbConnected = AppDataSource.isInitialized;
    let dbLatency: number | null = null;
    if (dbConnected) {
      const t0 = Date.now();
      await AppDataSource.query('SELECT 1');
      dbLatency = Date.now() - t0;
    }
    if (!dbConnected) {
      return res.status(503).json({ status: 'degraded', database: 'disconnected', uptime: Math.floor((Date.now() - startTime) / 1000) });
    }
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: 'connected',
      dbLatencyMs: dbLatency,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: 'disconnected',
      dbLatencyMs: null,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    });
  }
});

// Old /health endpoint for backward compatibility
app.get('/api/v1/health', async (_req, res) => {
  try {
    const dbConnected = AppDataSource.isInitialized;
    let dbLatency: number | null = null;
    if (dbConnected) {
      const t0 = Date.now();
      await AppDataSource.query('SELECT 1');
      dbLatency = Date.now() - t0;
    }
    res.json({
      ok: true,
      data: {
        status: 'ok',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: dbConnected ? 'connected' : 'disconnected',
        dbLatencyMs: dbLatency,
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    res.json({
      ok: true,
      data: {
        status: 'degraded',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: 'disconnected',
        dbLatencyMs: null,
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// API routes
app.post('/api/v1/evaluate', evaluateController);
app.get('/api/v1/criteria', getCriteria);
app.post('/api/v1/criteria', createCriterion);
app.get('/api/v1/criteria/:code', getCriterionByCode);
app.get('/api/v1/building-types', getBuildingTypes);
app.get('/api/v1/neb-thresholds', getNebThresholds);
app.get('/api/v1/config', getConfig);
app.get('/api/v1/disability-types', getDisabilityTypes);
app.get('/api/v1/assessment-dimensions', getAssessmentDimensions);
app.get('/api/v1/buildings', getBuildings);
app.get('/api/v1/buildings/:id', getBuilding);
app.post('/api/v1/assessments', createAssessment);
app.get('/api/v1/assessments/:id', getAssessment);
app.get('/api/v1/reports', getReports);
app.post('/api/v1/login', login);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error('Unhandled error:', err?.message || err);
  res.status(500).json({ ok: false, error: NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal error' });
});

// ── Start Server ──────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`Backend listening on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`Version: ${APP_VERSION}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────
function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
        logger.info('Database connection closed');
      } catch (err) {
        logger.error('Error closing database:', err);
      }
    }
    process.exit(0);
  });
  // Force shutdown after 30s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Start ─────────────────────────────────────────────────────────
start();
