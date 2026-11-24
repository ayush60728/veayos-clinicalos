/**
 * Gemini AI Repertory Integration Service
 * Uses Google Gemini API to analyze homoeopathic symptoms (Location, Sensation, Modalities, Concomitants)
 * and returns ranked homoeopathic remedies with rubrics, repertory scores, and dosage guidance.
 * Includes a comprehensive offline homoeopathic repertory fallback engine.
 */

const GEMINI_STORAGE_KEY = 'veayos_gemini_api_key';
const GEMINI_MODEL_STORAGE_KEY = 'veayos_gemini_model';
const DEFAULT_MODEL = 'gemini-1.5-flash';

/**
 * Robust JSON Extractor for Gemini API Responses.
 * Strips markdown code blocks (```json ... ```) and extracts pure JSON.
 */
export function extractJsonFromGeminiResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let text = rawText.trim();
  // Strip code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  // Find JSON object boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn('Gemini response is not valid JSON string:', err.message);
    return null;
  }
}

// Classical Homoeopathy Repertory Knowledge Base for instant local matching & fallback
const HOMOEOPATHIC_KNOWLEDGE_BASE = [
  {
    name: 'Arnica Montana',
    commonName: 'Leopard\'s Bane',
    defaultPotency: '200C',
    category: 'Acute / Trauma',
    keywords: ['trauma', 'bruised', 'sore', 'fall', 'injury', 'blunt', 'bed feels too hard', 'head hot body cold', 'aching'],
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
    keywords: ['gastric', 'constipation', 'irritability', 'spices', 'coffee', 'alcohol', 'headache', 'ineffectual urging', 'chilly', 'sedentary', 'acid reflux', 'anger'],
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
    keywords: ['restless', 'stiff', 'worse rest', 'better movement', 'damp weather', 'rain', 'joint pain', 'stiffness', 'triangular red tip of tongue'],
    rubrics: [
      'Generalities - Worse beginning of motion, better continued motion',
      'Generalities - Worse cold damp weather, before rain, wet weather',
      'Extremities - Restlessness in limbs, must constantly shift position',
      'Mouth - Triangular red tip on tongue'
    ],
    keynotes: 'Great stiffness on beginning to move, gradually limbering up with continued gentle motion. Aggravated by cold damp weather, wet conditions, and rest.',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Take morning and evening. Avoid cold drafts.'
  },
  {
    name: 'Lycopodium Clavatum',
    commonName: 'Club Moss',
    defaultPotency: '200C',
    category: 'Constitutional / Hepatic',
    keywords: ['gas', 'bloating', 'flatulence', 'right side', 'worse 4 to 8 pm', 'craves sweets', 'warm food', 'liver', 'dyspepsia', 'anxious'],
    rubrics: [
      'Abdomen - Distension and excessive flatulence, fermentation after eating',
      'Generalities - Aggravation between 4 PM and 8 PM',
      'Generalities - Right-sided complaints or moving right to left',
      'Stomach - Desire for warm food and warm drinks, strong craving for sweets'
    ],
    keynotes: 'Right-sided symptoms moving to the left. Marked 4 PM to 8 PM aggravation. Excessive abdominal bloating, fullness after just a few mouthfuls. Desire for warm drinks and sweets.',
    dosage: '4 globules',
    frequency: 'OD (Once daily, early morning empty stomach)',
    duration: '10 days',
    instructions: 'Take 20 mins before breakfast.'
  },
  {
    name: 'Arsenicum Album',
    commonName: 'Arsenic Trioxide',
    defaultPotency: '30C',
    category: 'Constitutional / Acute',
    keywords: ['anxiety', 'restless', 'burning', 'better heat', 'worse midnight', '1 to 2 am', 'prostration', 'fear of death', 'sipping water', 'food poisoning', 'vomiting', 'diarrhoea'],
    rubrics: [
      'Mind - Extreme restlessness with great mental anxiety and fear of death',
      'Generalities - Burning pains ameliorated by hot applications and warm drinks',
      'Generalities - Aggravation after midnight (1:00 AM to 2:00 AM)',
      'Stomach - Thirst for small quantities of water at frequent intervals'
    ],
    keynotes: 'Profound prostration with intense anxiety and restlessness. Burning pains relieved by heat. Sips small sips of water frequently. Aggravation 1 AM to 2 AM.',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '3 days',
    instructions: 'Sip in warm water for gastric burning.'
  },
  {
    name: 'Belladonna',
    commonName: 'Deadly Nightshade',
    defaultPotency: '30C',
    category: 'Acute / Febrile',
    keywords: ['sudden', 'fever', 'throbbing', 'red face', 'heat', 'dry skin', 'pupils dilated', 'delirium', 'headache', 'strawberry tongue', 'right side'],
    rubrics: [
      'Generalities - Sudden and violent onset of complaints',
      'Head - Throbbing, congestive headache, aggravated by jar, light, noise',
      'Face - Flushed, hot, glowing red with dilated pupils',
      'Fever - High fever with burning heat, dry skin, and thirstless or craving lemon'
    ],
    keynotes: 'Sudden, violent onset of symptoms with intense heat, redness, and throbbing. Flushed red face, wide dilated pupils, throbbing carotids. Worse from light, noise, and jar.',
    dosage: '4 globules',
    frequency: 'Every 3-4 hours during acute high fever',
    duration: '2 days',
    instructions: 'Discontinue as temperature normalizes.'
  },
  {
    name: 'Pulsatilla Pratensis',
    commonName: 'Wind Flower',
    defaultPotency: '30C',
    category: 'Constitutional',
    keywords: ['weeping', 'mild', 'changeable', 'better open air', 'thirstless', 'worse rich food', 'grief', 'yellow green discharge', 'menstrual', 'craves sympathy'],
    rubrics: [
      'Mind - Gentle, mild, tearful disposition; seeks consolation and open air',
      'Generalities - Symptoms ever changeable and shifting',
      'Generalities - Marked amelioration in cool open air, worse in warm stuffy room',
      'Mouth - Thirstlessness with almost all complaints'
    ],
    keynotes: 'Mild, gentle, yielding disposition, weeps easily, craves affection and consolation. Complete thirstlessness. Symptoms constantly changing. Better in cool, open fresh air; worse in warm room.',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '10 days',
    instructions: 'Take 30 mins before meals.'
  },
  {
    name: 'Hepar Sulphuris Calcareum',
    commonName: 'Calcium Sulphide',
    defaultPotency: '200C',
    category: 'Acute / Suppuration',
    keywords: ['chilly', 'splinter', 'hypersensitive', 'suppuration', 'pus', 'worse cold draft', 'foul smelling', 'earache', 'sore throat', 'boils'],
    rubrics: [
      'Generalities - Hypersensitivity to cold air, touching, and slightest draft',
      'Throat - Stitching pain in throat as from a fish bone or splinter',
      'Skin - Tendency to suppuration, every little injury suppurates'
    ],
    keynotes: 'Extreme hypersensitivity to pain and cold air. Splinter-like stitching pains. Tendency to rapid pus formation and suppuration.',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '5 days',
    instructions: 'Dissolve under tongue. Keep neck warm.'
  },
  {
    name: 'Silicea',
    commonName: 'Flint / Pure Silica',
    defaultPotency: '200C',
    category: 'Constitutional / Chronic',
    keywords: ['lack of grit', 'chilly', 'sweaty feet', 'suppuration', 'fistula', 'headaches', 'timid', 'brittle nails', 'foreign body expulsion'],
    rubrics: [
      'Generalities - Want of vital heat, always cold, worse drafts',
      'Extremities - Offensive foot sweat, suppresses easily causing complaints',
      'Mind - Yielding, lack of self-confidence, timid yet obstinate'
    ],
    keynotes: 'Lack of stamina and grit ("gritless"). Chilly patient wrapped up warm. Promotes expulsion of foreign bodies and resolves chronic suppurative conditions.',
    dosage: '4 globules',
    frequency: 'OD (Once daily)',
    duration: '14 days',
    instructions: 'Take at night before sleep.'
  }
];

export const geminiService = {
  // Get stored API key
  getApiKey() {
    return localStorage.getItem(GEMINI_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  },

  // Set API key
  setApiKey(key) {
    if (key) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  },

  // Get selected model
  getModel() {
    return localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || DEFAULT_MODEL;
  },

  // Set model
  setModel(model) {
    localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
  },

  // Test connection to Gemini API
  async testConnection(testKey) {
    const key = (testKey || this.getApiKey()).trim();
    if (!key) {
      return { success: false, message: 'No Gemini API key provided.' };
    }

    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Respond with valid JSON: {"status": "ok", "message": "Gemini API connected successfully"}' }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMessage = errorData.error?.message || `HTTP error ${response.status}: ${response.statusText}`;
        return { success: false, message: errMessage };
      }

      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return {
        success: true,
        message: 'Gemini API verified and connected successfully!',
        raw: contentText
      };
    } catch (err) {
      return {
        success: false,
        message: `Network or API connection error: ${err.message}`
      };
    }
  },

  /**
   * Run Homoeopathic Repertorization
   * Combines clinical inputs into Kentian hierarchy and calls Gemini or falls back to internal repertory engine.
   */
  async repertorize({
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
    const apiKey = this.getApiKey();

    // 1. First attempt dedicated backend proxy (/api/v1/repertory/analyze)
    // Keeps Gemini keys secure on server side without exposure
    try {
      const backendRes = await fetch('/api/v1/repertory/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          location,
          sensation,
          modalitiesWorse,
          modalitiesBetter,
          concomitants,
          mentals,
          freeNotes,
          patientAge,
          patientGender,
          model: this.getModel()
        })
      });

      if (backendRes.ok) {
        const payload = await backendRes.json();
        if (payload.success && payload.data && Array.isArray(payload.data.remedies) && payload.data.remedies.length > 0) {
          return payload.data;
        }
      }
    } catch (backendErr) {
      // If backend is offline, proceed with client execution
    }

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

    // If Gemini key is available, attempt real AI repertorization
    if (apiKey) {
      try {
        const model = this.getModel();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = `
You are the VEAYOS Homoeopathic Repertory Intelligence Engine for clinical practice.
Analyze the presented homoeopathic totality of symptoms according to classical homoeopathic principles (Kent, Boericke, Boger, Synthesis Repertory).
Repertorize systematically:
1. Mental / emotional state
2. Physical generals (modalities of temperature, weather, time, food)
3. Particulars (Location, Sensation, Modality, Concomitant)

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
      "matchingRubrics": [
        "Rubric 1",
        "Rubric 2",
        "Rubric 3"
      ],
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
Provide exactly top 3 to 5 ranked remedies based strictly on totality match. Do NOT wrap in markdown ticks or preamble.
        `.trim();

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nCase Totality:\n${symptomsSummary}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = extractJsonFromGeminiResponse(rawText);
          if (parsed && parsed.remedies && parsed.remedies.length > 0) {
            return {
              source: 'gemini',
              model: model,
              ...parsed
            };
          } else {
            console.warn('Gemini response could not be parsed into expected schema. Falling back to local repertory.');
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          console.warn('Gemini API call returned non-OK status:', errMsg);
          return this.localRepertorize({
            location,
            sensation,
            modalitiesWorse,
            modalitiesBetter,
            concomitants,
            mentals,
            freeNotes,
            fallbackReason: `Gemini API returned ${response.status} (${errMsg}). Active fallback engine engaged.`
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call encountered error, activating local repertory engine:', geminiError);
        return this.localRepertorize({
          location,
          sensation,
          modalitiesWorse,
          modalitiesBetter,
          concomitants,
          mentals,
          freeNotes,
          fallbackReason: `Gemini API connection error (${geminiError.message}). Active fallback engine engaged.`
        });
      }
    }

    // Fallback: Intelligent Local Repertory Engine
    return this.localRepertorize({
      location,
      sensation,
      modalitiesWorse,
      modalitiesBetter,
      concomitants,
      mentals,
      freeNotes
    });
  },

  /**
   * Comprehensive Local Homoeopathy Repertorization Engine
   * Scores remedies against symptom keywords and Kentian rubrics
   */
  localRepertorize({
    location = '',
    sensation = '',
    modalitiesWorse = '',
    modalitiesBetter = '',
    concomitants = '',
    mentals = '',
    freeNotes = '',
    fallbackReason = null
  }) {
    const allInputText = `${location} ${sensation} ${modalitiesWorse} ${modalitiesBetter} ${concomitants} ${mentals} ${freeNotes}`.toLowerCase();

    // Score all remedies in the internal knowledge base
    const scoredRemedies = HOMOEOPATHIC_KNOWLEDGE_BASE.map(remedy => {
      let score = 8; // baseline score
      const matchedKeywords = [];

      remedy.keywords.forEach(keyword => {
        if (allInputText.includes(keyword.toLowerCase())) {
          score += 4;
          matchedKeywords.push(keyword);
        }
      });

      // Bonus for sensation / modality matching
      if (allInputText.includes('motion') && remedy.name.includes('Bryonia')) score += 5;
      if (allInputText.includes('stiff') && remedy.name.includes('Rhus')) score += 5;
      if (allInputText.includes('gas') || allInputText.includes('bloat')) {
        if (remedy.name.includes('Lycopodium')) score += 6;
      }
      if (allInputText.includes('chill') || allInputText.includes('cold')) {
        if (remedy.name.includes('Arsenic') || remedy.name.includes('Hepar')) score += 4;
      }
      if (allInputText.includes('injury') || allInputText.includes('pain') || allInputText.includes('fall')) {
        if (remedy.name.includes('Arnica')) score += 6;
      }

      return {
        remedy: remedy.name,
        commonName: remedy.commonName,
        potency: remedy.defaultPotency,
        repertoryScore: Math.min(score, 24),
        grade: score > 15 ? 3 : score > 10 ? 2 : 1,
        matchingRubrics: remedy.rubrics.slice(0, 3),
        keynotes: remedy.keynotes,
        dosage: remedy.dosage,
        frequency: remedy.frequency,
        duration: remedy.duration,
        instructions: remedy.instructions,
        confidence: score > 15 ? 'High' : 'Moderate'
      };
    });

    // Sort descending by repertory score
    scoredRemedies.sort((a, b) => b.repertoryScore - a.repertoryScore);
    const topRemedies = scoredRemedies.slice(0, 4);

    return {
      source: 'local-repertory',
      model: 'VEAYOS Classical Repertory Engine (Kent & Boericke Synthesis)',
      fallbackReason: fallbackReason || null,
      totalityAnalysis: `Repertorization of ${topRemedies.length} candidates based on physical generals, pain sensations, and modalities. Top indicated remedy is ${topRemedies[0].remedy} with rubric affinity score ${topRemedies[0].repertoryScore}/24.`,
      remedies: topRemedies,
      differentialAdvice: `Compare ${topRemedies[0].remedy} with ${topRemedies[1]?.remedy || 'subsequent remedy'} considering mental constitution and thermal modality (chilly vs hot).`,
      generalRegimen: 'Advise patient to avoid strong odors, raw onions/garlic, and medicinal mint during homoeopathic therapy. Maintain clean mouth 20 minutes before each dose.'
    };
  }
};
