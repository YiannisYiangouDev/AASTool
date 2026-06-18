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
    if (buildingType !== undefined && typeof buildingType !== 'string') {
      return res.status(400).json({ ok: false, error: 'buildingType must be a string' });
    }
    if (scores !== undefined && (typeof scores !== 'object' || Array.isArray(scores))) {
      return res.status(400).json({ ok: false, error: 'scores must be an object mapping codes to numbers' });
    }
    const bt = buildingType || 'Commercial Buildings';
    console.log('Evaluating with buildingType:', bt);
    const result = await calc.evaluate(bt, scores as Record<string, number> | undefined);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('Evaluate error', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
