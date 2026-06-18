import metadata from '../services/metadataService';

async function run() {
  try {
    await metadata.validateMetadata();
    console.log('Metadata validation passed');
  } catch (err) {
    console.error('Metadata validation failed', err);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
