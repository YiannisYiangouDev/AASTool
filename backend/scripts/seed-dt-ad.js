require('reflect-metadata');
const { AppDataSource } = require('../dist/data-source');

async function seed() {
  await AppDataSource.initialize();
  
  // Disability Types
  const dtRepo = AppDataSource.getRepository(require('../dist/entities/DisabilityType').DisabilityType);
  await dtRepo.clear();
  await dtRepo.save([
    {id:1, name:'Physical Disability', icon:'🦽', gradient:'from-teal-500 to-cyan-400', bg_color:'from-teal-500/10 to-cyan-500/10', text_color:'text-teal-300', border_color:'border-teal-500/20'},
    {id:2, name:'Sensory Disability', icon:'👁️', gradient:'from-blue-500 to-indigo-400', bg_color:'from-blue-500/10 to-indigo-500/10', text_color:'text-blue-300', border_color:'border-blue-500/20'},
    {id:3, name:'Cognitive & Neurodiverse', icon:'🧩', gradient:'from-violet-500 to-purple-400', bg_color:'from-violet-500/10 to-purple-500/10', text_color:'text-purple-300', border_color:'border-purple-500/20'},
    {id:4, name:'Communication & Mental Health', icon:'💬', gradient:'from-amber-500 to-orange-400', bg_color:'from-amber-500/10 to-orange-500/10', text_color:'text-orange-300', border_color:'border-amber-500/20'},
    {id:5, name:'Multiple / Situational', icon:'🌐', gradient:'from-rose-500 to-pink-400', bg_color:'from-rose-500/10 to-pink-500/10', text_color:'text-pink-300', border_color:'border-rose-500/20'},
  ]);
  
  // Assessment Dimensions
  const adRepo = AppDataSource.getRepository(require('../dist/entities/AssessmentDimension').AssessmentDimension);
  await adRepo.clear();
  await adRepo.save([
    {id:1, name:'Spatial & Physical Accessibility', icon:'🏗️', gradient:'from-teal-500 to-emerald-400', bg_color:'from-teal-500/10 to-emerald-500/10', text_color:'text-emerald-300', border_color:'border-emerald-500/20'},
    {id:2, name:'Safety & Environmental Comfort', icon:'🛡️', gradient:'from-sky-500 to-blue-400', bg_color:'from-sky-500/10 to-blue-500/10', text_color:'text-sky-300', border_color:'border-sky-500/20'},
    {id:3, name:'Cognitive & Navigational Accessibility', icon:'🧠', gradient:'from-indigo-500 to-violet-400', bg_color:'from-indigo-500/10 to-violet-500/10', text_color:'text-indigo-300', border_color:'border-indigo-500/20'},
    {id:4, name:'Digital Interaction & Smart Usability', icon:'💻', gradient:'from-orange-500 to-amber-400', bg_color:'from-orange-500/10 to-amber-500/10', text_color:'text-amber-300', border_color:'border-amber-500/20'},
    {id:5, name:'Social Inclusion & Human Experience', icon:'🤝', gradient:'from-rose-500 to-pink-400', bg_color:'from-rose-500/10 to-pink-500/10', text_color:'text-rose-300', border_color:'border-rose-500/20'},
  ]);
  
  console.log('Seeded disability_types and assessment_dimensions');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
