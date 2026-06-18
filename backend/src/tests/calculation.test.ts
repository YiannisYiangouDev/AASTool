import calc from '../services/calculationService';
import assert from 'assert';

function approxEqual(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

async function run() {
  const res = await calc.evaluate('Commercial Buildings', {});
  console.log('Evaluation result sample:', res);

  assert(typeof res.obs === 'number', 'obs is number');
  assert(res.averageRawScore >= 1 && res.averageRawScore <= 5, 'avg raw in range');
  assert(approxEqual(res.averageRawScore, 3, 0.01), `expected avg=3 got ${res.averageRawScore}`);

  assert(Number.isFinite(res.obs) && res.obs >= 0 && res.obs <= 100, 'obs range');

  console.log('All tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
