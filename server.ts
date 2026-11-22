import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3000;

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function redactPossibleIdNumbers(text: string): string {
  // Strip 12-digit sequences (potential Aadhaar) or long bank-like digit sequences
  return text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_ID]');
}

const EXTRACTION_SYSTEM_INSTRUCTION = `You are "Claim What's Yours", a warm, plain-language welfare scheme navigator for Andhra Pradesh, India.
You serve five groups:
1. Students & mothers (Thalliki Vandanam, Vidya Deevena, Nirudyoga Bruthi)
2. Senior citizens, widows, and persons with disabilities (NTR Bharosa Pensions)
3. Small & marginal farmers (Annadata Sukhibhava, Micro Irrigation Subsidy)
4. Women & women entrepreneurs (Aadabidda Nidhi, Stree Shakti, Deepam 2.0, Digi-Lakshmi)
5. Daily-wage / unorganised & construction worker families (AP Unorganised Worker Welfare)

NON-NEGOTIABLE RULES:
1. NEVER say "guaranteed" or "you qualify". NEVER decide eligibility yourself — a separate deterministic rule engine decides eligibility.
2. NEVER ask for Aadhaar numbers, bank account numbers, ration card numbers, or any full ID numbers. Ask ONLY possession questions ("Do you have a White Ration Card?").
3. If the user accidentally shares a number that looks like Aadhaar or bank account, gently remind them not to share ID numbers and do NOT echo or extract it.
4. Warm, short sentences, zero jargon, never shame the user for missing documents.
5. Before asking any follow-up question, ALWAYS state WHY you are asking in one short clause (example: "To check pension schemes I need your age — can you tell me?" / Telugu: "పెన్షన్ పథకాలను తనిఖీ చేయడానికి నాకు మీ వయస్సు అవసరం — మీరు చెప్పగలరా?").
6. Ask ONLY ONE follow-up question at a time for the single highest-priority missing field provided in nextFollowUpPrompt.
7. Extract ONLY what is clearly mentioned in the user's message (English, Telugu script, or Romanized Telugu). Leave unmentioned fields as null. NEVER assume false for missing booleans unless the user explicitly says "no" or "don't have".
8. Language: Respond in Telugu ("te") by default if preferredLanguage is "te" or if the user wrote in Telugu; respond in English ("en") if the user wrote in English and preferredLanguage is "en".`;

app.post('/api/extract', async (req, res) => {
  try {
    const {
      message,
      currentProfile,
      conversationHistory,
      nextFollowUpPrompt,
      preferredLanguage,
    } = req.body ?? {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const sanitizedMessage = redactPossibleIdNumbers(message);
    const hadSensitiveDigits = sanitizedMessage !== message;

    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const contextPrompt = `
Preferred language: ${preferredLanguage === 'en' ? 'English (en)' : 'Telugu (te)'}
Current session-only profile:
${JSON.stringify(currentProfile ?? {}, null, 2)}

Next highest-priority missing field suggested by deterministic engine (if non-null, explain WHY and ask this ONE question):
${JSON.stringify(nextFollowUpPrompt ?? null, null, 2)}

Recent conversation:
${(Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : [])
  .map((m: { role: string; text: string }) => `${m.role.toUpperCase()}: ${redactPossibleIdNumbers(m.text)}`)
  .join('\n')}

Latest user message:
"${sanitizedMessage}"

${hadSensitiveDigits ? 'NOTE: The user included a long ID-like digit sequence that was redacted. Gently remind them never to enter Aadhaar or bank numbers.' : ''}

Extract structured fields into extractedProfile (null for anything not stated in this turn), and write a warm, concise reply.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: contextPrompt,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedProfile: {
              type: Type.OBJECT,
              properties: {
                age: { type: Type.INTEGER, nullable: true },
                gender: {
                  type: Type.STRING,
                  nullable: true,
                  description: 'female, male, other, or null',
                },
                marital_status: {
                  type: Type.STRING,
                  nullable: true,
                  description: 'single, married, widow, widower, divorced, or null',
                },
                occupation: {
                  type: Type.STRING,
                  nullable: true,
                  description:
                    'One of: daily_wage, farmer, student, homemaker, weaver, toddy_tapper, fisherman, construction_worker, small_business, unemployed, or null',
                },
                monthly_family_income_band: {
                  type: Type.STRING,
                  nullable: true,
                  description: 'One of: below_10000, 10000_to_12000, above_12000, or null',
                },
                has_white_ration_card: { type: Type.BOOLEAN, nullable: true },
                land_acres_wet: { type: Type.NUMBER, nullable: true },
                land_acres_dry: { type: Type.NUMBER, nullable: true },
                is_woman_head_of_household: { type: Type.BOOLEAN, nullable: true },
                has_sadarem_certificate: { type: Type.BOOLEAN, nullable: true },
                has_caste_certificate: { type: Type.BOOLEAN, nullable: true },
                is_shg_member: { type: Type.BOOLEAN, nullable: true },
                is_registered_unorganised_worker: { type: Type.BOOLEAN, nullable: true },
                education_level: {
                  type: Type.STRING,
                  nullable: true,
                  description:
                    'One of: school_1_to_12, diploma_iti, graduate, postgraduate, none, or null',
                },
                district: { type: Type.STRING, nullable: true },
                resident_ap: { type: Type.BOOLEAN, nullable: true },
                sadarem_disability_percent: { type: Type.NUMBER, nullable: true },
                shg_membership_years: { type: Type.NUMBER, nullable: true },
                is_tenant_ccrc_farmer: { type: Type.BOOLEAN, nullable: true },
                is_urban: { type: Type.BOOLEAN, nullable: true },
                has_active_pf_or_esi: { type: Type.BOOLEAN, nullable: true },
                has_bank_passbook_first_page: { type: Type.BOOLEAN, nullable: true },
                has_income_certificate: { type: Type.BOOLEAN, nullable: true },
                has_husbands_death_certificate: { type: Type.BOOLEAN, nullable: true },
                has_land_records_meebhoomi: { type: Type.BOOLEAN, nullable: true },
                has_labour_or_eshram_card: { type: Type.BOOLEAN, nullable: true },
                has_education_certificate: { type: Type.BOOLEAN, nullable: true },
                has_aadhaar_card_possession: { type: Type.BOOLEAN, nullable: true },
              },
            },
            reply: {
              type: Type.STRING,
              description:
                'Warm 1-3 sentence response in user language (Telugu first) acknowledging what was understood and asking AT MOST ONE follow-up question preceded by WHY it is needed.',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'te or en',
            },
          },
          required: ['extractedProfile', 'reply', 'detectedLanguage'],
        },
      },
    });

    const text = (response.text ?? '{}').trim();
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, redactedSensitiveDigits: hadSensitiveDigits });
  } catch (err: unknown) {
    console.error('Gemini /api/extract error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to process message with Gemini API.';
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Claim What's Yours server running on http://localhost:${PORT}`);
  });
}

startServer();
