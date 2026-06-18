import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { Evaluation } from '../entities/Evaluation';

export async function getReports(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Evaluation);
    const evals = await repo.find({ order: { created_at: 'DESC' } });

    const reports = evals.map((e, index) => {
      const dateStr = new Date(e.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return {
        id: e.id,
        title: `Accessibility Report #${evals.length - index} — ${e.building_type} (${dateStr}) — OBS: ${e.obs}%`,
      };
    });

    res.json({ ok: true, data: reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch reports' });
  }
}
