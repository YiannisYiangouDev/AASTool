import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { Evaluation } from '../entities/Evaluation';
import { BuildingType } from '../entities/BuildingType';
import calc from '../services/calculationService';

export async function createAssessment(req: Request, res: Response) {
  try {
    const { buildingId, name } = req.body as { buildingId: string; name?: string };

    if (!buildingId) {
      return res.status(400).json({ ok: false, error: 'buildingId is required' });
    }

    const btRepo = AppDataSource.getRepository(BuildingType);
    const bt = await btRepo.findOne({ where: { id: buildingId } });
    if (!bt) {
      return res.status(404).json({ ok: false, error: 'Building type not found' });
    }
    const bTypeName = bt.name;

    const result = await calc.evaluate(bTypeName, {});

    const repo = AppDataSource.getRepository(Evaluation);
    const ev = new Evaluation();
    ev.building_type = bTypeName;
    ev.scores = {};
    ev.result = result;
    ev.obs = result.obs;
    ev.neb_class = result.nebClass;
    ev.average_raw_score = result.averageRawScore;

    await repo.save(ev);

    res.status(201).json({
      ok: true,
      data: {
        id: ev.id,
        buildingId: buildingId || null,
        name: name || `Assessment - ${bTypeName}`,
        results: result,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to create assessment' });
  }
}

export async function getAssessment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Evaluation);
    const ev = await repo.findOne({ where: { id } });

    if (!ev) {
      return res.status(404).json({ ok: false, error: 'Assessment not found' });
    }

    const btRepo = AppDataSource.getRepository(BuildingType);
    const bt = await btRepo.findOne({ where: { name: ev.building_type } });

    res.json({
      ok: true,
      data: {
        id: ev.id,
        buildingId: bt?.id || null,
        results: ev.result,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch assessment' });
  }
}
