import { AppDataSource } from '../data-source';
import { Criterion } from '../entities/Criterion';

AppDataSource.initialize().then(async () => {
  const r = AppDataSource.getRepository(Criterion);
  const c = await r.findOne({ where: { code: 'EC1.1.2' } });
  console.log('EC1.1.2 exists:', !!c);
  if (c) console.log(JSON.stringify(c, null, 2));
  console.log('Total count:', await r.count());
  await AppDataSource.destroy();
}).catch(console.error);
