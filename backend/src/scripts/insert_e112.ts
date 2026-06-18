// insert_e112.ts - Insert missing EC1.1.2 into DB
import { AppDataSource } from '../data-source';
import { Criterion } from '../entities/Criterion';

AppDataSource.initialize().then(async () => {
  const r = AppDataSource.getRepository(Criterion);

  const ec112 = new Criterion();
  ec112.code = 'EC1.1.2';
  ec112.name = 'Signage & Wayfinding for Mobility Users';
  ec112.definition = 'Clear directional signage at accessible height (max 160 cm); readable from wheelchair position.';
  ec112.justification = 'Signage is important for orientation and independent navigation, but it becomes meaningful only after physical access is achieved. In office environments, it supports usability rather than enabling basic entry.';
  ec112.value = 0.3;
  ec112.disability = 1; // DT 1 - Physical Disability
  ec112.dimension = 1;  // AD 1 - Spatial & Physical Accessibility
  ec112.score = 3;
  ec112.levels = [
    'Digitally Enhanced Static Signage (Foundation Layer)',
    'QR Code / NFC-Triggered Wayfinding (Low-Cost Digital Layer)',
    'Indoor Positioning + Accessible Navigation Apps',
    'Smart Digital Signage with Adaptive Interfaces',
    'AI-Driven Smart Accessibility Ecosystem (Advanced Layer)',
  ];

  await r.save(ec112);
  console.log('✅ Inserted EC1.1.2');
  console.log('Total count:', await r.count());
  await AppDataSource.destroy();
}).catch(err => { console.error(err); process.exit(1); });
