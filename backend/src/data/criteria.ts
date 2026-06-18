// Auto-generated criteria data from workbook mapping.
// Code format: EC{disability}.{dimension}.{index}
// Values sourced from workbook-mapping.md (canonical Excel data)
export const criteria = [
  // DT1 - Physical Disability x AD1 - Spatial & Physical Accessibility
  { code: "EC1.1.1", name: "Accessible Entrance Width", definition: "Minimum clear opening width for doors and entrances", justification: "Ensures wheelchair and mobility device passage", value: 0.7, disability: 1, dimension: 1, score: 3, levels: ["Insufficient (<80cm)", "Narrow (80-90cm)", "Adequate (90-100cm)", "Good (100-120cm)", "Excellent (>120cm)"] },
  { code: "EC1.1.2", name: "Ramp Gradient Compliance", definition: "Slope ratio of access ramps", justification: "Safe gradient for independent wheelchair use", value: 0.3, disability: 1, dimension: 1, score: 3, levels: ["Steep (>1:10)", "Moderate (1:10-1:12)", "Standard (1:12-1:15)", "Gentle (1:15-1:20)", "Optimal (<1:20)"] },

  // DT1 - Physical Disability x AD2 - Safety & Environmental Comfort
  { code: "EC1.2.1", name: "Emergency Evacuation Route", definition: "Accessible fire escape paths", justification: "Safe egress for all mobility levels", value: 0.25, disability: 1, dimension: 2, score: 3, levels: ["No accessible route", "Partial route", "Designated route", "Fully accessible", "Automated assistance"] },
  { code: "EC1.2.2", name: "Handrail Continuity", definition: "Continuous handrails along circulation paths", justification: "Support for balance-impaired users", value: 0.35, disability: 1, dimension: 2, score: 3, levels: ["None", "Intermittent", "Partial", "Continuous", "Dual-height"] },
  { code: "EC1.2.3", name: "Lighting Levels", definition: "Illuminance in circulation areas", justification: "Adequate visibility for safe navigation", value: 0.25, disability: 1, dimension: 2, score: 3, levels: ["Dim", "Low", "Adequate", "Bright", "Adjustable"] },
  { code: "EC1.2.4", name: "Emergency Assembly Point", definition: "Designated accessible assembly areas", justification: "Safe gathering point for all during evacuation", value: 0.15, disability: 1, dimension: 2, score: 3, levels: ["None designated", "Distant location", "Nearby but unmarked", "Marked accessible", "Fully equipped refuge"] },

  // DT1 x AD3 - Cognitive & Navigational Accessibility
  { code: "EC1.3.1", name: "Wayfinding Signage", definition: "Clear directional signage throughout building", justification: "Supports independent navigation", value: 0.4, disability: 1, dimension: 3, score: 3, levels: ["No signage", "Minimal", "Adequate", "Comprehensive", "Multilingual + tactile"] },
  { code: "EC1.3.2", name: "Tactile Ground Surface", definition: "Tactile paving for navigation guidance", justification: "Guides visually impaired users", value: 0.35, disability: 1, dimension: 3, score: 3, levels: ["None", "Spot locations", "Key routes", "Most routes", "All routes"] },
  { code: "EC1.3.3", name: "Color Contrast - Surfaces", definition: "Luminance contrast between floors, walls, doors", justification: "Aids visual discrimination of spaces", value: 0.25, disability: 1, dimension: 3, score: 3, levels: ["No contrast", "Minimal", "Moderate", "Good", "Excellent"] },

  // DT1 x AD4 - Digital Interaction & Smart Usability
  { code: "EC1.4.1", name: "Accessible Kiosk Height", definition: "Operating height of digital kiosks", justification: "Reachable from wheelchair seated position", value: 0.4, disability: 1, dimension: 4, score: 3, levels: ["Too high", "Adjustable", "Front approach", "Side approach", "Universal"] },
  { code: "EC1.4.2", name: "Assistive Tech Compatibility", definition: "Compatibility with screen readers and switch devices", justification: "Enables digital interaction for all", value: 0.3, disability: 1, dimension: 4, score: 3, levels: ["None", "Partial", "Basic", "Good", "Full WCAG AAA"] },
  { code: "EC1.4.3", name: "Voice Control Systems", definition: "Voice-activated building controls and interfaces", justification: "Hands-free operation for mobility-impaired", value: 0.3, disability: 1, dimension: 4, score: 3, levels: ["None", "Basic voice commands", "Room-level control", "Building-wide", "AI voice assistant"] },

  // DT1 x AD5 - Social Inclusion & Human Experience
  { code: "EC1.5.1", name: "Accessible Seating Areas", definition: "Designated wheelchair spaces in communal areas", justification: "Social inclusion in shared spaces", value: 0.35, disability: 1, dimension: 5, score: 3, levels: ["None", "Isolated", "Integrated", "Choice of locations", "Universal"] },
  { code: "EC1.5.2", name: "Service Counter Height", definition: "Height of reception and service counters", justification: "Accessible face-to-face interaction", value: 0.3, disability: 1, dimension: 5, score: 3, levels: ["Standing only", "Partial lowered", "Dual height", "Adjustable", "Universal"] },
  { code: "EC1.5.3", name: "Inclusive Event Spaces", definition: "Adaptable event and gathering spaces", justification: "Ensures participation for all mobility levels", value: 0.35, disability: 1, dimension: 5, score: 3, levels: ["Inaccessible spaces", "Partial access", "Adaptable layout", "Fully accessible", "Universal design"] },

  // DT2 - Sensory Disability x AD1 - Spatial & Physical
  { code: "EC2.1.1", name: "Audible Warning Systems", definition: "Audio alerts for hazards and transitions", justification: "Alerts visually impaired users to dangers", value: 0.35, disability: 2, dimension: 1, score: 3, levels: ["None", "Minimal", "Key areas", "Comprehensive", "Directional audio"] },
  { code: "EC2.1.2", name: "Visual Fire Alarms", definition: "Strobe lights for fire alarm notification", justification: "Alerts deaf and hard-of-hearing users", value: 0.3, disability: 2, dimension: 1, score: 3, levels: ["None", "Corridors only", "Common areas", "All public areas", "All areas + bed shakers"] },
  { code: "EC2.1.3", name: "Braille Signage", definition: "Braille labels on room signs and directories", justification: "Independent identification for blind users", value: 0.35, disability: 2, dimension: 1, score: 3, levels: ["None", "Entrance only", "Key rooms", "All rooms", "All + tactile maps"] },

  // DT2 x AD2 - Safety & Environmental Comfort
  { code: "EC2.2.1", name: "Acoustic Environment", definition: "Ambient noise levels and reverberation control", justification: "Reduces sensory overload and aids hearing", value: 0.4, disability: 2, dimension: 2, score: 3, levels: ["Echoey/noisy", "Some treatment", "Moderate", "Good acoustics", "Excellent"] },
  { code: "EC2.2.2", name: "Glare Control", definition: "Window shading and anti-glare surfaces", justification: "Prevents visual discomfort for sensitive users", value: 0.3, disability: 2, dimension: 2, score: 3, levels: ["No control", "Curtains", "Blinds", "Automated", "Smart glass"] },
  { code: "EC2.2.3", name: "Induction Loop Systems", definition: "Hearing loop coverage in key areas", justification: "Direct audio transmission to hearing aids", value: 0.3, disability: 2, dimension: 2, score: 3, levels: ["None", "One counter", "Key rooms", "All meeting rooms", "Building-wide"] },

  // DT2 x AD3 - Cognitive & Navigational
  { code: "EC2.3.1", name: "Audible Information Points", definition: "Audio beacons at decision points", justification: "Orientation for visually impaired users", value: 0.6, disability: 2, dimension: 3, score: 3, levels: ["None", "Entrance only", "Key junctions", "All junctions", "Smart navigation"] },
  { code: "EC2.3.2", name: "Tactile Maps", definition: "Raised tactile floor plan maps", justification: "Spatial understanding for blind users", value: 0.4, disability: 2, dimension: 3, score: 3, levels: ["None", "Entrance only", "Key nodes", "Each floor", "Interactive tactile"] },

  // DT2 x AD4 - Digital Interaction
  { code: "EC2.4.1", name: "Screen Reader Support", definition: "Website and kiosk screen reader compatibility", justification: "Digital access for blind users", value: 0.3, disability: 2, dimension: 4, score: 3, levels: ["Inaccessible", "Partial", "WCAG AA", "WCAG AAA", "Native optimization"] },
  { code: "EC2.4.2", name: "Captioning & Transcripts", definition: "Captions for all audio-visual content", justification: "Information access for deaf users", value: 0.4, disability: 2, dimension: 4, score: 3, levels: ["None", "Auto-generated", "Edited captions", "Real-time", "Multi-language"] },
  { code: "EC2.4.3", name: "Text Size Adjustability", definition: "Ability to enlarge text without loss of function", justification: "Readability for low-vision users", value: 0.3, disability: 2, dimension: 4, score: 3, levels: ["Fixed size", "Browser zoom", "App scaling", "200% support", "Unlimited + reflow"] },

  // DT2 x AD5 - Social Inclusion
  { code: "EC2.5.1", name: "Quiet Room Availability", definition: "Dedicated low-sensory spaces", justification: "Retreat space for sensory overload recovery", value: 0.4, disability: 2, dimension: 5, score: 3, levels: ["None", "Temporary", "Shared room", "Dedicated room", "Multiple + bookable"] },
  { code: "EC2.5.2", name: "Staff Sensory Training", definition: "Staff trained in sensory disability awareness", justification: "Better assistance for sensory-impaired visitors", value: 0.35, disability: 2, dimension: 5, score: 3, levels: ["No training", "Basic awareness", "Disability-specific", "Regular training", "Certified program"] },
  { code: "EC2.5.3", name: "Sensory-Friendly Events", definition: "Events designed for sensory accessibility", justification: "Inclusive participation for sensory-sensitive individuals", value: 0.25, disability: 2, dimension: 5, score: 3, levels: ["No consideration", "Quiet hours", "Sensory-adjusted", "Dedicated sessions", "Fully inclusive"] },

  // DT3 - Cognitive & Neurodiverse x AD1
  { code: "EC3.1.1", name: "Clear Spatial Layout", definition: "Logical and predictable spatial organization", justification: "Reduces anxiety for neurodiverse users", value: 0.6, disability: 3, dimension: 1, score: 3, levels: ["Confusing layout", "Some logic", "Clear zones", "Intuitive flow", "Universal design"] },
  { code: "EC3.1.2", name: "Visual Cues for Transitions", definition: "Color or texture change at space transitions", justification: "Signals change of environment", value: 0.4, disability: 3, dimension: 1, score: 3, levels: ["None", "Floor changes", "Color + texture", "Signage + cues", "Multisensory"] },

  // DT3 x AD2
  { code: "EC3.2.1", name: "Predictable Environment", definition: "Consistent placement of fixtures and controls", justification: "Builds confidence through predictability", value: 0.35, disability: 3, dimension: 2, score: 3, levels: ["Inconsistent", "Some consistency", "Standardized", "Clearly documented", "Intuitive universal"] },
  { code: "EC3.2.2", name: "Sensory Zoning", definition: "Separation of high and low stimulus areas", justification: "Choice of environmental intensity", value: 0.4, disability: 3, dimension: 2, score: 3, levels: ["Mixed zones", "Informal separation", "Designated zones", "Clearly marked", "Adjustable"] },
  { code: "EC3.2.3", name: "Clear Emergency Instructions", definition: "Simple visual emergency procedure guides", justification: "Understandable evacuation for cognitive disabilities", value: 0.25, disability: 3, dimension: 2, score: 3, levels: ["Text only", "Text + symbols", "Pictogram guides", "Multi-format", "Personalized plans"] },

  // DT3 x AD3
  { code: "EC3.3.1", name: "Simple Signage Language", definition: "Plain language and pictogram signage", justification: "Comprehension for cognitive disabilities", value: 0.45, disability: 3, dimension: 3, score: 3, levels: ["Text only", "Some pictograms", "Pictogram + text", "Plain language", "Easy Read standard"] },
  { code: "EC3.3.2", name: "Landmark-Based Navigation", definition: "Distinctive architectural features as waypoints", justification: "Memorable navigation for cognitive users", value: 0.55, disability: 3, dimension: 3, score: 3, levels: ["No landmarks", "Few features", "Some distinct", "Clear landmarks", "Memorable + themed"] },

  // DT3 x AD4
  { code: "EC3.4.1", name: "Interface Simplicity", definition: "Simple, uncluttered digital interfaces", justification: "Reduces cognitive load for neurodiverse users", value: 0.6, disability: 3, dimension: 4, score: 3, levels: ["Complex", "Standard", "Simplified", "Guided", "Adaptive"] },
  { code: "EC3.4.2", name: "Customizable Display", definition: "Options to adjust font, contrast, animations", justification: "Personalization for cognitive comfort", value: 0.4, disability: 3, dimension: 4, score: 3, levels: ["No options", "Basic themes", "Multiple profiles", "Full customization", "AI-adaptive"] },

  // DT3 x AD5
  { code: "EC3.5.1", name: "Social Stories / Pre-Visit Info", definition: "Visual guides showing what to expect", justification: "Reduces anxiety by previewing the experience", value: 0.55, disability: 3, dimension: 5, score: 3, levels: ["None", "Text description", "Photos", "Video walkthrough", "Interactive VR preview"] },
  { code: "EC3.5.2", name: "Staff Neurodiversity Training", definition: "Staff awareness of neurodiverse needs", justification: "Empathetic support for cognitive differences", value: 0.45, disability: 3, dimension: 5, score: 3, levels: ["No training", "Basic awareness", "Disability-specific", "Regular training", "Neurodiverse-led training"] },

  // DT4 - Communication & Mental Health x AD1
  { code: "EC4.1.1", name: "Communication Board Access", definition: "Picture communication boards in key areas", justification: "Supports non-verbal communication", value: 0.45, disability: 4, dimension: 1, score: 3, levels: ["None", "One location", "Key areas", "All public areas", "Digital + physical"] },
  { code: "EC4.1.2", name: "Private Consultation Spaces", definition: "Sound-insulated private rooms", justification: "Confidential communication for mental health", value: 0.55, disability: 4, dimension: 1, score: 3, levels: ["No privacy", "Screen divider", "Partitioned room", "Sound-insulated", "Full sensory isolation"] },

  // DT4 x AD2
  { code: "EC4.2.1", name: "Calming Color Palette", definition: "Use of calming, muted color schemes", justification: "Reduces anxiety through environmental design", value: 0.55, disability: 4, dimension: 2, score: 3, levels: ["Harsh colors", "Standard palette", "Muted tones", "Calming scheme", "Evidence-based design"] },
  { code: "EC4.2.2", name: "Natural Light Access", definition: "Access to daylight and nature views", justification: "Supports mental wellbeing", value: 0.45, disability: 4, dimension: 2, score: 3, levels: ["Windowless", "Limited daylight", "Some natural light", "Good daylight", "Biophilic design"] },

  // DT4 x AD3
  { code: "EC4.3.1", name: "Multilingual Signage", definition: "Signage in multiple community languages", justification: "Navigation for non-native speakers", value: 0.6, disability: 4, dimension: 3, score: 3, levels: ["Single language", "Bilingual", "3-5 languages", "6+ languages", "Dynamic digital"] },
  { code: "EC4.3.2", name: "Symbol-Based Direction", definition: "International symbols instead of text", justification: "Universal comprehension across languages", value: 0.4, disability: 4, dimension: 3, score: 3, levels: ["Text only", "Some symbols", "Standard ISO symbols", "Comprehensive symbols", "Universal symbolic"] },

  // DT4 x AD4
  { code: "EC4.4.1", name: "Translation App Integration", definition: "Real-time translation via digital interfaces", justification: "Enables communication across languages", value: 0.45, disability: 4, dimension: 4, score: 3, levels: ["None", "Text translation", "Voice translation", "Real-time conversation", "AI simultaneous"] },
  { code: "EC4.4.2", name: "Text-to-Speech Output", definition: "Digital content read aloud capability", justification: "Supports users with reading difficulties", value: 0.55, disability: 4, dimension: 4, score: 3, levels: ["None", "Basic TTS", "Natural voice", "Multilingual TTS", "AI narration"] },

  // DT4 x AD5
  { code: "EC4.5.1", name: "Peer Support Programs", definition: "Trained peer support available on-site", justification: "Lived-experience support for mental health", value: 0.6, disability: 4, dimension: 5, score: 3, levels: ["None", "Informal network", "Designated peers", "Trained program", "Integrated service"] },
  { code: "EC4.5.2", name: "Inclusive Communication Training", definition: "Staff trained in inclusive communication methods", justification: "Effective interaction with diverse users", value: 0.4, disability: 4, dimension: 5, score: 3, levels: ["No training", "Basic awareness", "Communication methods", "Regular refresher", "Certified inclusive"] },

  // DT5 - Multiple / Situational x AD1
  { code: "EC5.1.1", name: "Universal Toilet Facilities", definition: "Accessible toilet provision beyond minimum standards", justification: "Meets diverse needs including changing places", value: 0.35, disability: 5, dimension: 1, score: 3, levels: ["Standard accessible", "Ambulant cubicle", "Wheelchair accessible", "Changing Places", "Universal + carer"] },
  { code: "EC5.1.2", name: "Rest Areas with Seating", definition: "Frequent resting points along circulation routes", justification: "Supports users with fatigue or pain conditions", value: 0.4, disability: 5, dimension: 1, score: 3, levels: ["No rest areas", "Occasional seats", "Every 30m", "Every 20m", "Every 10m + shelter"] },
  { code: "EC5.1.3", name: "Adjustable Furniture Systems", definition: "Furniture adaptable to diverse physical needs", justification: "Accommodates varying body sizes and abilities", value: 0.25, disability: 5, dimension: 1, score: 3, levels: ["Fixed furniture", "Limited adjustability", "Some adjustable", "Mostly adjustable", "Fully adaptable"] },

  // DT5 x AD2
  { code: "EC5.2.1", name: "Air Quality Management", definition: "Filtration and ventilation standards", justification: "Critical for respiratory and chemical sensitivity", value: 0.55, disability: 5, dimension: 2, score: 3, levels: ["Standard HVAC", "Basic filtration", "HEPA filtration", "Low-VOC materials", "Hospital-grade air"] },
  { code: "EC5.2.2", name: "Temperature Control Zones", definition: "Zonal temperature regulation", justification: "Accommodates temperature sensitivity conditions", value: 0.45, disability: 5, dimension: 2, score: 3, levels: ["No control", "Building-wide", "Floor zones", "Room control", "Personal control"] },

  // DT5 x AD3
  { code: "EC5.3.1", name: "Consistent Signage System", definition: "Uniform sign design language throughout", justification: "Builds navigational confidence for all", value: 0.3, disability: 5, dimension: 3, score: 3, levels: ["Inconsistent", "Partially consistent", "Mostly consistent", "Fully consistent", "Branded universal"] },
  { code: "EC5.3.2", name: "Orientation Points", definition: "You-are-here maps at regular intervals", justification: "Situational awareness for all users", value: 0.4, disability: 5, dimension: 3, score: 3, levels: ["None", "Entrance only", "Key nodes", "Every junction", "Interactive kiosks"] },
  { code: "EC5.3.3", name: "Digital Information Kiosks", definition: "Interactive touch-screen information points", justification: "On-demand access to building information", value: 0.3, disability: 5, dimension: 3, score: 3, levels: ["None", "Static display", "Touch screen", "Interactive + audio", "AI-powered assistant"] },

  // DT5 x AD4
  { code: "EC5.4.1", name: "Multi-Modal Information", definition: "Information available in text, audio, and visual formats", justification: "Meets diverse information access needs", value: 0.35, disability: 5, dimension: 4, score: 3, levels: ["Single format", "Two formats", "Three formats", "All formats", "Adaptive multi-modal"] },
  { code: "EC5.4.2", name: "Emergency Communication App", definition: "Multi-channel emergency alert system", justification: "Reaches all users regardless of disability", value: 0.25, disability: 5, dimension: 4, score: 3, levels: ["Audible only", "Audible + visual", "Multi-sensory", "App notifications", "Personalized alerts"] },
  { code: "EC5.4.3", name: "Accessibility Feedback App", definition: "Mobile app for reporting accessibility issues", justification: "Continuous improvement through user reporting", value: 0.4, disability: 5, dimension: 4, score: 3, levels: ["No feedback channel", "Paper forms", "Online form", "Mobile app", "Real-time + tracking"] },

  // DT5 x AD5
  { code: "EC5.5.1", name: "Community Space Provision", definition: "Inclusive communal spaces for diverse use", justification: "Fosters social connection across abilities", value: 0.6, disability: 5, dimension: 5, score: 3, levels: ["No communal space", "Single purpose", "Multi-purpose", "Inclusive design", "Co-designed by community"] },
  { code: "EC5.5.2", name: "Feedback Mechanisms", definition: "Accessible ways to provide feedback on accessibility", justification: "Continuous improvement through user input", value: 0.4, disability: 5, dimension: 5, score: 3, levels: ["No mechanism", "Comment box", "Online form", "Multiple channels", "Co-design + review"] },
];
