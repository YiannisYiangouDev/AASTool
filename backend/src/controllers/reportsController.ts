import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { Evaluation } from '../entities/Evaluation';

const REPORT_LOCALE = process.env.REPORT_LOCALE ?? 'en-US';
const REPORT_TITLE_PREFIX = process.env.REPORT_TITLE_PREFIX ?? 'Accessibility Report';

export async function getReports(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Evaluation);
    const evals = await repo.find({ order: { created_at: 'DESC' } });

    const reports = evals.map((e, index) => {
      const dateStr = new Date(e.created_at).toLocaleDateString(REPORT_LOCALE, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return {
        id: e.id,
        title: `${REPORT_TITLE_PREFIX} #${evals.length - index} \u2014 ${e.building_type} (${dateStr}) \u2014 OBS: ${e.obs}%`,
      };
    });

    res.json({ ok: true, data: reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch reports' });
  }
}
