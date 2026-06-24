// Quick seed of config keys into running DB
// Must run AFTER `npm run build` (requires compiled JS in dist/)
const { AppDataSource } = require('../dist/data-source');

AppDataSource.initialize().then(async () => {
  const repo = AppDataSource.getRepository('Config');
  const keys = [
    { key: 'DEFAULT_SCORE', value: '3' },
    { key: 'STRENGTH_THRESHOLD', value: '5' },
    { key: 'WEAKNESS_THRESHOLD', value: '2' },
    { key: 'TOP_N_RESULTS', value: '5' },
  ];
  for (const k of keys) {
    const existing = await repo.findOne({ where: { key: k.key } });
    if (!existing) {
      await repo.save(repo.create({ key: k.key, value: k.value }));
      console.log('Inserted:', k.key);
    } else {
      console.log('Exists:', k.key);
    }
  }
  console.log('Done');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
