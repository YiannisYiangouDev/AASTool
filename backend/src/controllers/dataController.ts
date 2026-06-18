import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { Criterion } from '../entities/Criterion';
import { BuildingType } from '../entities/BuildingType';
import { NebThreshold } from '../entities/NebThreshold';
import { Config } from '../entities/Config';
import buildingTypesData from '../data/building-types.json';

export async function getCriteria(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Criterion);
    const items = await repo.find({ order: { code: 'ASC' } });
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function getBuildingTypes(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(BuildingType);
    const items = await repo.find({ order: { name: 'ASC' } });
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function getCriterionByCode(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const repo = AppDataSource.getRepository(Criterion);
    const item = await repo.findOne({ where: { code } });

    if (!item) {
      return res.status(404).json({ ok: false, error: 'Criterion not found' });
    }

    res.json({ ok: true, data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function getNebThresholds(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(NebThreshold);
    const items = await repo.find({ order: { min: 'ASC' } });
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function getConfig(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Config);
    const items = await repo.find();
    res.json({ ok: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function getDisabilityTypes(_req: Request, res: Response) {
  try {
    // Load from canonical data file — no hardcoded labels
    const raw: string[] = buildingTypesData.disabilityTypes || [];
    const result = raw.map((label: string, i: number) => {
      const match = label.match(/^DT\s*\d+\s*[—–-]\s*(.+)$/i);
      const name = match ? match[1].trim() : label;
      return { id: i + 1, name, description: label };
    });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}

export async function createCriterion(req: Request, res: Response) {
  try {
    const { code, name, definition, justification, value, disability, dimension, levels } = req.body;

    // Validation
    if (!code || !name || !definition) {
      return res.status(400).json({ ok: false, error: 'code, name, and definition are required' });
    }
    if (!/^EC\d+\.\d+\.\d+$/.test(code)) {
      return res.status(400).json({ ok: false, error: 'code must match pattern ECx.y.z (e.g. EC1.1.3)' });
    }
    if (!Array.isArray(levels) || levels.length !== 5) {
      return res.status(400).json({ ok: false, error: 'levels must be an array of exactly 5 strings' });
    }
    if (disability < 1 || disability > 5) {
      return res.status(400).json({ ok: false, error: 'disability must be 1-5' });
    }
    if (dimension < 1 || dimension > 5) {
      return res.status(400).json({ ok: false, error: 'dimension must be 1-5' });
    }
    if (typeof value !== 'number' || value <= 0 || value > 1) {
      return res.status(400).json({ ok: false, error: 'value must be a number between 0 and 1' });
    }

    const repo = AppDataSource.getRepository(Criterion);

    // Check for duplicate code
    const existing = await repo.findOne({ where: { code } });
    if (existing) {
      return res.status(409).json({ ok: false, error: `Criterion ${code} already exists` });
    }

    const criterion = repo.create({
      code,
      name,
      definition,
      justification: justification || '',
      value,
      disability,
      dimension,
      score: 3,
      levels,
    });

    const saved = await repo.save(criterion);
    res.status(201).json({ ok: true, data: saved });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Failed to create criterion' });
  }
}

export async function getAssessmentDimensions(_req: Request, res: Response) {
  try {
    const raw: string[] = buildingTypesData.dimensions || [];
    const result = raw.map((label: string, i: number) => {
      const match = label.match(/^AD\s*\d+\s*[—–-]\s*(.+)$/i);
      const name = match ? match[1].trim() : label;
      return { id: i + 1, name, description: label };
    });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'failed' });
  }
}
