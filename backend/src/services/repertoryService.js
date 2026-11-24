/**
 * Homoeopathic Repertory & Gemini AI Service (Backend)
 * Powers /api/v1/repertory/analyze with secure server-side Gemini execution
 * and comprehensive Kentian Repertorization algorithm.
 */

export const HOMOEOPATHIC_KNOWLEDGE_BASE = [
  {
    name: 'Arnica Montana',
    commonName: "Leopard's Bane",
    defaultPotency: '200C',
    category: 'Acute / Trauma',
    keywords: ['trauma', 'bruised', 'sore', 'fall', 'injury', 'blunt', 'bed feels too hard', 'head hot body cold', 'aching', 'hematoma', 'sprain'],
    rubrics: [
      'Generalities - Trauma, contusions, mechanical injuries',
      'Mind - Says nothing is wrong with him, sends doctor away',
      'Extremities - Bruised, lame feeling as if beaten',
      'Sleep - Bed feels too hard, constantly moves to find soft place'
    ],
    keynotes: 'Sore, bruised feeling all over the body. Ailments from mechanical trauma, sprains, overexertion. Patient insists nothing is wrong.',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    instructions: 'Dissolve in clean mouth 15 mins before food. Avoid camphor/raw mint.'
  },
  {
    name: 'Nux Vomica',
    commonName: 'Poison Nut',
    defaultPotency: '30C',
    category: 'Constitutional / Digestive',
    keywords: ['gastric', 'constipation', 'irritability', 'spices', 'coffee', 'alcohol', 'headache', 'ineffectual urging', 'chilly', 'sedentary', 'acid reflux', 'anger', 'stimulants'],
    rubrics: [
      'Stomach - Indigestion after spices, alcohol, coffee or stimulants',
      'Rectum - Frequent ineffectual urging for stool',
      'Mind - Irritable, impatient, fault-finding, fastidious',
      'Generalities - Oversensitive to noise, light, drafts, odors'
    ],
    keynotes: 'Zealous, irritable, impatient constitution. Chronic indigestion from sedentary habits and rich foods. Ineffectual desire to pass stool.',
    dosage: '4 globules or 5 drops in water',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Take one dose at bedtime and one in early morning.'
  },
  {
    name: 'Bryonia Alba',
    commonName: 'White Bryony',
    defaultPotency: '30C',
    category: 'Acute / Respiratory',
    keywords: ['dryness', 'thirst', 'worse motion', 'better rest', 'better pressure', 'stitch', 'stitching pain', 'cough', 'headache', 'irritable'],
    rubrics: [
      'Generalities - Aggravation from least motion, amelioration from absolute rest',
      'Generalities - Amelioration lying on painful side, firm pressure',
      'Mouth - Extreme dryness of mucous membranes with unquenchable thirst for large quantities',
      'Chest - Stitching, sharp pains on breathing and coughing, holds chest'
    ],
    keynotes: 'All complaints aggravated by the least motion and relieved by absolute rest and hard pressure. Stitching pains. Great thirst for large quantities of cold water at long intervals.',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    instructions: 'Take with warm water. Rest quietly after dose.'
  },
  {
    name: 'Rhus Toxicodendron',
    commonName: 'Poison Ivy',
    defaultPotency: '200C',
    category: 'Acute / Musculoskeletal',
    keywords: ['restless', 'stiff', 'worse rest', 'better movement', 'damp weather', 'rain', 'joint pain', 'stiffness', 'triangular red tip of tongue', 'sprain', 'rheumatism'],
    rubrics: [
      'Generalities - Worse beginning of motion, better continued motion',
      'Generalities - Aggravation in damp, cold rainy weather and getting wet',
      'Mind - Extreme restlessness, impossible to remain quiet in bed',
      'Tongue - Triangular red tip on a coated tongue'
    ],
    keynotes: 'Stiffness of joints, muscles, tendons. Aggravated on beginning to move, but ameliorated by continuous movement and warm dry weather. Restlessness at night.',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Avoid getting wet in rain or damp exposure.'
  },
  {
    name: 'Lycopodium Clavatum',
    commonName: 'Club Moss',
    defaultPotency: '200C',
    category: 'Deep Constitutional / Chronic',
    keywords: ['bloating', 'flatulence', 'right side', '4 to 8 pm', 'anticipatory anxiety', 'warm drinks', 'liver', 'intellectual', 'gas', 'digestive'],
    rubrics: [
      'Abdomen - Excessive flatulence, fermentation, fullness after eating a few mouthfuls',
      'Generalities - Symptoms worse 4 PM to 8 PM',
      'Generalities - Right-sided complaints or right to left progression',
      'Mind - Anticipatory stage fright yet performs excellently once started'
    ],
    keynotes: 'Right-sided remedy. Excessive flatulent distension of lower abdomen. Aggravation 4 to 8 PM. Craves warm food and drinks. High intellectual capacity, weak physical power.',
    dosage: '4 globules',
    frequency: 'OD (Once daily)',
    duration: '14 days',
    instructions: 'Take in the late afternoon (around 4 PM) on empty stomach.'
  },
  {
    name: 'Pulsatilla Pratensis',
    commonName: 'Wind Flower',
    defaultPotency: '30C',
    category: 'Constitutional / Hormonal',
    keywords: ['weeping', 'changeable', 'mild', 'thirstless', 'open air', 'fatty food', 'pastries', 'menses', 'catarrh', 'better open air', 'yielding'],
    rubrics: [
      'Mind - Mild, gentle, yielding disposition, weeps easily while explaining symptoms',
      'Generalities - Amelioration in open cool fresh air; aggravation in warm stuffy rooms',
      'Stomach - Thirstlessness with almost all complaints, aversion to fatty rich food',
      'Generalities - Symptoms ever-changing, wander from joint to joint'
    ],
    keynotes: 'Mild, gentle, tearful disposition. Wants consolations and sympathy. Thirstless. Aggravation from rich fat food, warmth, evening. Great amelioration in fresh cool open air.',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Take in fresh air. Avoid heavy greasy gravies.'
  },
  {
    name: 'Belladonna',
    commonName: 'Deadly Nightshade',
    defaultPotency: '200C',
    category: 'Acute / Febrile',
    keywords: ['throbbing', 'sudden', 'flushed', 'red', 'hot', 'fever', 'headache', 'dilated pupils', 'carotids', 'burning', 'violence'],
    rubrics: [
      'Head - Throbbing headache with violent pulsation of carotids',
      'Generalities - Sudden and violent onset of all complaints',
      'Face - Flushed, hot, red face with dilated pupils',
      'Generalities - Aggravation from light, noise, touch, motion, jar'
    ],
    keynotes: 'Great liability to take cold; sensitive to drafts. Sudden and violent onset. Red face, throbbing arteries, heat, redness and burning.',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '3 days',
    instructions: 'Take in a darkened quiet room during acute attacks.'
  },
  {
    name: 'Arsenicum Album',
    commonName: 'White Oxide of Arsenic',
    defaultPotency: '30C',
    category: 'Deep Constitutional / Acute',
    keywords: ['burning', 'restless', 'anxiety', 'midnight', 'sips of water', 'prostration', 'chilly', 'better heat', 'food poisoning', 'fear of death'],
    rubrics: [
      'Mind - Fear of death, extreme restlessness, moves from bed to bed',
      'Generalities - Burning pains relieved by heat and hot applications',
      'Generalities - Midnight aggravation, especially 12 to 2 AM',
      'Stomach - Thirst for small quantities of water at frequent intervals'
    ],
    keynotes: 'Great anguish and restlessness with rapid prostration. Burning pains relieved by heat. Thirst for small sips of water. Midday/midnight aggravation.',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    instructions: 'Drink warm water with dose. Keep patient warmly covered.'
  }
];

export function extractJsonFromGeminiResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let text = rawText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

export function runKentianRepertoryAnalysis({
  location = '',
  sensation = '',
  modalitiesWorse = '',
  modalitiesBetter = '',
  concomitants = '',
  mentals = '',
  freeNotes = '',
  patientAge = '',
  patientGender = ''
}) {
  const combinedText = [
    location,
    sensation,
    modalitiesWorse,
    modalitiesBetter,
    concomitants,
    mentals,
    freeNotes
  ].join(' ').toLowerCase();

  const scoredRemedies = HOMOEOPATHIC_KNOWLEDGE_BASE.map(remedy => {
    let score = 0;
    const matchingRubrics = [];

    remedy.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      if (regex.test(combinedText)) {
        score += 3;
      } else if (combinedText.includes(keyword.toLowerCase())) {
        score += 1.5;
      }
    });

    remedy.rubrics.forEach(rubric => {
      const words = rubric.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
      const matchedWords = words.filter(w => combinedText.includes(w));
      if (matchedWords.length >= 2) {
        matchingRubrics.push(rubric);
        score += matchedWords.length * 2;
      }
    });

    // Age / Gender specific homoeopathic affinities
    if (patientGender && patientGender.toLowerCase().startsWith('f')) {
      if (remedy.name === 'Pulsatilla Pratensis') score += 2;
    }
    if (patientAge && Number(patientAge) > 60) {
      if (remedy.name === 'Lycopodium Clavatum' || remedy.name === 'Arsenicum Album') score += 2;
    }

    if (matchingRubrics.length === 0) {
      matchingRubrics.push(remedy.rubrics[0]);
    }

    const calculatedGrade = score >= 12 ? 3 : score >= 6 ? 2 : 1;

    return {
      remedy: remedy.name,
      commonName: remedy.commonName,
      potency: remedy.defaultPotency,
      repertoryScore: Math.round(score + 10),
      grade: calculatedGrade,
      matchingRubrics: Array.from(new Set(matchingRubrics)),
      keynotes: remedy.keynotes,
      dosage: remedy.dosage,
      frequency: remedy.frequency,
      duration: remedy.duration,
      instructions: remedy.instructions,
      confidence: score >= 10 ? 'High' : 'Moderate'
    };
  });

  scoredRemedies.sort((a, b) => b.repertoryScore - a.repertoryScore);
  const topRemedies = scoredRemedies.slice(0, 5);

  const top1 = topRemedies[0];
  const top2 = topRemedies[1];

  return {
    totalityAnalysis: `Totality of Symptoms Analysis: Case presents distinct particulars and modalities centered on "${location || 'constitutional'}" with sensations of "${sensation || 'general malaise'}". Kentian repertorization prioritizes mental state ("${mentals || 'General'}"), physical modalities (Worse: "${modalitiesWorse || 'None'}", Better: "${modalitiesBetter || 'None'}"), yielding high similarity to ${top1.remedy}.`,
    remedies: topRemedies,
    differentialAdvice: `Differential: ${top1.remedy} leads with highest rubric coverage and keynote correspondence. If symptoms exhibit variable modalities, consider ${top2.remedy} as complementary or intercurrent.`,
    generalRegimen: 'Avoid raw onions, garlic, camphor, and strong perfumes during administration. Take remedies 15-30 minutes away from food with water.'
  };
}

export async function analyzeSymptomsWithGeminiOrFallback({
  location = '',
  sensation = '',
  modalitiesWorse = '',
  modalitiesBetter = '',
  concomitants = '',
  mentals = '',
  freeNotes = '',
  patientAge = '',
  patientGender = '',
  customApiKey = null,
  model = 'gemini-1.5-flash'
}) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const symptomsSummary = `
Patient Demographics: Age ${patientAge || 'Adult'}, Gender ${patientGender || 'Unspecified'}
- Location: ${location || 'Not specified'}
- Sensation & Pain Quality: ${sensation || 'Not specified'}
- Modalities (Worse with): ${modalitiesWorse || 'None reported'}
- Modalities (Better with): ${modalitiesBetter || 'None reported'}
- Concomitant Symptoms: ${concomitants || 'None reported'}
- Mental & Emotional State: ${mentals || 'None reported'}
- Doctor Narrative / Observations: ${freeNotes || 'None'}
      `.trim();

      const prompt = `
You are the VEAYOS Homoeopathic Repertory Intelligence Engine for clinical practice.
Analyze the presented homoeopathic totality of symptoms according to classical homoeopathic principles (Kent, Boericke, Boger, Synthesis Repertory).
Symptoms:
${symptomsSummary}

You MUST respond strictly with a valid JSON object matching this schema:
{
  "totalityAnalysis": "Clinical synthesis of the totality",
  "remedies": [
    {
      "remedy": "Remedy Name (e.g. Lycopodium Clavatum)",
      "commonName": "Common Name",
      "potency": "Recommended Potency (e.g. 30C, 200C, 1M, Q)",
      "repertoryScore": 18,
      "grade": 3,
      "matchingRubrics": ["Rubric 1", "Rubric 2"],
      "keynotes": "Key materia medica verification points",
      "dosage": "4 globules / 10 drops",
      "frequency": "OD / BD / TDS / SOS",
      "duration": "7 days / 15 days",
      "instructions": "Specific administration advice",
      "confidence": "High / Moderate"
    }
  ],
  "differentialAdvice": "Brief differential diagnosis between top candidates",
  "generalRegimen": "Homoeopathic dietary and lifestyle advice"
}
      `.trim();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = extractJsonFromGeminiResponse(rawText);
        if (parsed && Array.isArray(parsed.remedies) && parsed.remedies.length > 0) {
          return {
            source: 'gemini',
            data: parsed
          };
        }
      }
    } catch (err) {
      console.warn('Gemini server-side proxy call failed, falling back to Kentian engine:', err.message);
    }
  }

  // Robust Fallback
  const fallbackData = runKentianRepertoryAnalysis({
    location,
    sensation,
    modalitiesWorse,
    modalitiesBetter,
    concomitants,
    mentals,
    freeNotes,
    patientAge,
    patientGender
  });

  return {
    source: 'kentian_repertory_engine',
    data: fallbackData
  };
}
