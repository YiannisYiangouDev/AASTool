import { Request, Response } from 'express';
import calc from '../services/calculationService';

export default async function evaluateController(req: Request, res: Response) {
  try {
    console.log('Evaluate request body:', JSON.stringify(req.body));
    const payload = req.body as unknown;
    if (typeof payload !== 'object' || payload === null) {
      return res.status(400).json({ ok: false, error: 'Request body must be a JSON object' });
    }
    const { buildingType, scores } = payload as { buildingType?: any; scores?: any };
    if (!buildingType || typeof buildingType !== 'string') {
      return res.status(400).json({ ok: false, error: 'buildingType is required and must be a string' });
    }
    if (scores !== undefined && (typeof scores !== 'object' || Array.isArray(scores))) {
      return res.status(400).json({ ok: false, error: 'scores must be an object mapping codes to numbers' });
    }
    const result = await calc.evaluate(buildingType, scores as Record<string, number> | undefined);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error('Evaluate error', err);
    const msg = err?.message || 'Internal error';
    if (msg.includes('Missing or invalid') || msg.includes('building type')) {
      return res.status(400).json({ ok: false, error: msg });
    }
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
