import AppDataSource from '../data-source';

async function main() {
  await AppDataSource.initialize();
  const result = await AppDataSource.query("DELETE FROM criteria WHERE code = 'EC9.9.9'");
  console.log('Deleted:', result);
  const count = await AppDataSource.query("SELECT COUNT(*) as cnt FROM criteria");
  console.log('Remaining:', count[0].cnt);
  await AppDataSource.destroy();
}
main().catch(console.error);
