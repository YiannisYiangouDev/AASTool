import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const APP_VERSION = process.env.APP_VERSION ?? '1.0.0';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

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

app.get('/health', async (_req, res) => {
  try {
    const dbConnected = AppDataSource.isInitialized;
    let dbLatency: number | null = null;
    if (dbConnected) {
      const t0 = Date.now();
      await AppDataSource.query('SELECT 1');
      dbLatency = Date.now() - t0;
    }
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: dbConnected ? 'connected' : 'disconnected',
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

import evaluateController from './controllers/evaluateController';
import { getCriteria, getBuildingTypes, getCriterionByCode, getNebThresholds, getConfig, getDisabilityTypes, getAssessmentDimensions, createCriterion } from './controllers/dataController';
import { getBuildings, getBuilding } from './controllers/buildingsController';
import { createAssessment, getAssessment } from './controllers/assessmentsController';
import { getReports } from './controllers/reportsController';
import { login } from './controllers/authController';
import AppDataSource from './data-source';

AppDataSource.initialize()
        .then(async () => {
            console.log('DataSource initialized');
            try {
                const meta = await import('./services/metadataService');
                await meta.default.validateMetadata();
                console.log('Metadata validation passed');
            } catch (err) { 
                console.error('Metadata validation failed', err);
                process.exit(1);
            }
        })
        .catch((err) => {
            console.warn('DataSource init failed', err);
            process.exit(1);
        });

app.post('/api/v1/evaluate', evaluateController);
app.get('/api/v1/criteria', getCriteria);
app.post('/api/v1/criteria', createCriterion);
app.get('/api/v1/criteria/:code', getCriterionByCode);
app.get('/api/v1/building-types', getBuildingTypes);
app.get('/api/v1/neb-thresholds', getNebThresholds);
app.get('/api/v1/config', getConfig);
app.get('/api/v1/disability-types', getDisabilityTypes);
app.get('/api/v1/assessment-dimensions', getAssessmentDimensions);

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

app.get('/api/v1/buildings', getBuildings);
app.post('/api/v1/assessments', createAssessment);
app.get('/api/v1/assessments/:id', getAssessment);
app.get('/api/v1/reports', getReports);
app.post('/api/v1/auth/login', login);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend listening on ${port}`));
