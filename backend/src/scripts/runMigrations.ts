import AppDataSource from '../data-source';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Connected, running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
