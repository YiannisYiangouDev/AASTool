import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { BuildingType } from '../entities/BuildingType';
import { Evaluation } from '../entities/Evaluation';

export async function getBuildings(_req: Request, res: Response) {
  try {
    const btRepo = AppDataSource.getRepository(BuildingType);
    const evalRepo = AppDataSource.getRepository(Evaluation);

    const buildingTypes = await btRepo.find({ order: { name: 'ASC' } });
    const evals = await evalRepo.find({ order: { created_at: 'DESC' } });

    const buildings = buildingTypes.map(bt => {
      const assessments = evals
        .filter(e => e.building_type === bt.name)
        .map(e => ({
          id: e.id,
          status: 'Completed',
          created_at: e.created_at,
        }));
      return {
        id: bt.id,
        name: bt.name,
        type: bt.name,
        assessments,
      };
    });

    res.json({ ok: true, data: buildings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch buildings' });
  }
}

export async function getBuilding(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const btRepo = AppDataSource.getRepository(BuildingType);
    const evalRepo = AppDataSource.getRepository(Evaluation);

    const bt = await btRepo.findOne({ where: { id } });
    if (!bt) {
      return res.status(404).json({ ok: false, error: 'Building not found' });
    }

    const evals = await evalRepo.find({
      where: { building_type: bt.name },
      order: { created_at: 'DESC' },
    });

    const assessments = evals.map(e => ({
      id: e.id,
      status: 'Completed',
      created_at: e.created_at,
    }));

    res.json({
      ok: true,
      data: {
        id: bt.id,
        name: bt.name,
        type: bt.name,
        assessments,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch building details' });
  }
}
