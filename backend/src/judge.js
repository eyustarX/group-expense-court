/**
 * AI Debt Detective - Courtroom Judge Logic.
 *
 * CODE DECIDES, AI NARRATES:
 * 1. Code deterministically compares claimedCount vs receiptCount and sets status.
 * 2. Amazon Bedrock (Converse API) is called ONLY to generate a witty, 2-sentence courtroom verdict.
 * 3. If Bedrock is unavailable or times out (5 seconds), pre-written fallback verdicts
 *    in English, Amharic, or Afaan Oromo are returned.
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-1';
const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

let bedrockClient = null;
try {
  bedrockClient = new BedrockRuntimeClient({ region });
} catch (e) {
  console.warn('[Bedrock] Failed to initialize BedrockRuntimeClient:', e.message);
}

// Fallback verdicts when Bedrock is offline, times out, or fails
const FALLBACK_VERDICTS = {
  en: {
    Verified: [
      (c, r) => `Order in the court! The sacred parchment confirms ${r} items, matching your claim of ${c}. The gavel strikes in your favor: debt fully cleared!`,
      (c, r) => `The witness testimony is unshakeable: ${c} items were claimed and ${r} were certified on the bill. Case closed with royal honor!`,
      (c, r) => `Upon forensic examination of the feast, ${c} items stand verified against the ${r} printed. You may leave the court with a clean conscience!`,
    ],
    'Needs Evidence': [
      (c, r) => `Halt! You claimed ${c} items, but the sacred receipt only accounts for ${r}. The court demands further photographic proof or a witness testimony before disbursing!`,
      (c, r) => `A discrepancy in the archives: you reported ${c} items when the bill shows only ${r}. The judge orders you to present additional evidence to the table!`,
      (c, r) => `Objection! The numbers do not align: ${c} items claimed versus ${r} on record. The bench suspends judgment pending further verification!`,
    ],
    'Case Dismissed': [
      (c, r) => `Absurdity in the courtroom! Claiming ${c} items exceeds all human appetite and realm laws. Case dismissed with laughter!`,
      (c, r) => `The court will not entertain folklore: claiming ${c} items is utterly preposterous. Gavel bang: dismissed!`,
    ],
  },
  am: {
    Verified: [
      (c, r) => `ፍርድ ቤቱ መርምሯል! የጠየቁት ${c} እቃዎች በደረሰኙ ላይ ከተመዘገቡት ${r} እቃዎች ጋር በትክክል ይገጥማሉ። ክሱ በድል ተዘግቷል!`,
      (c, r) => `እውነት አሸንፋለች! ${c} የታዘዙ እቃዎች በደረሰኙ የተረጋገጡ ናቸው። ፍርዱ ለክቡር ተከራካሪ ይሁን!`,
    ],
    'Needs Evidence': [
      (c, r) => `ቆም በሉ! የጠየቁት ${c} ቢሆንም ደረሰኙ የሚያሳየው ${r} ብቻ ነው። ተጨማሪ ማስረጃ እንዲቀርብ ፍርድ ቤቱ አዟል!`,
      (c, r) => `ተቃውሞ አለ! የቀረበው የ${c} ጥያቄ በደረሰኙ ካለው ${r} ጋር አይመጣጠንም። ተጨማሪ ምስክር ያስፈልጋል!`,
    ],
    'Case Dismissed': [
      (c, r) => `አስቂኝ ክስ! ${c} እቃዎችን መጠየቅ ከተፈጥሮ ሕግ ውጭ ነው። ክሱ ውድቅ ተደርጓል!`,
    ],
  },
  om: {
    Verified: [
      (c, r) => `Manni murtichaa mirkaneesseera! Wanti ati gaafatte ${c} ragaa nagahee ${r} wajjin guutumaan guutuutti wal simata. Murtichi siif kennameera!`,
    ],
    'Needs Evidence': [
      (c, r) => `Dhaabbadhaa! Ati ${c} gaafattus, nagaheen garuu ${r} qofa agarsiisa. Ragaan dabalataa dhiyaachuu qaba!`,
    ],
    'Case Dismissed': [
      (c, r) => `Gaaffiin ${c} kun baay'ee qaanii dha! Manni murtichaa murtii kanaan cufa!`,
    ],
  },
};

/**
 * Evaluates a claim using deterministic logic, then queries Bedrock for narrative.
 *
 * @param {Object} params
 * @param {string} params.claimText What the user claimed
 * @param {number} params.claimedCount Number of items/portions claimed
 * @param {number} params.receiptCount Actual count found on receipt/expense
 * @param {string} [params.language='en'] Language: en, am, om
 * @returns {Promise<{status: 'Verified' | 'Needs Evidence' | 'Case Dismissed', verdict: string}>}
 */
export async function judgeClaim({ claimText, claimedCount, receiptCount, language = 'en' }) {
  const c = Math.max(0, parseInt(claimedCount, 10) || 0);
  const r = Math.max(0, parseInt(receiptCount, 10) || 0);
  const lang = ['en', 'am', 'om'].includes(language) ? language : 'en';

  // 1. Plain Code Decides Status
  let status = 'Verified';
  if (!claimText || c <= 0 || c > 50) {
    status = 'Case Dismissed';
  } else if (c > r) {
    status = 'Needs Evidence';
  } else {
    status = 'Verified';
  }

  // 2. Default fallback verdict generator
  const getFallbackVerdict = () => {
    const langFallbacks = FALLBACK_VERDICTS[lang] || FALLBACK_VERDICTS.en;
    const list = langFallbacks[status] || FALLBACK_VERDICTS.en[status];
    const template = list[Math.floor(Math.random() * list.length)];
    return template(c, r);
  };

  // 3. Call Amazon Bedrock Converse API with 5-second timeout
  if (bedrockClient && process.env.BEDROCK_MODEL_ID) {
    try {
      const prompt = `Claimant stated: "${claimText}".
Claimed count: ${c}.
Receipt count: ${r}.
Courtroom status determined by law: "${status}".
Deliver the 2-sentence humorous courtroom verdict now.`;

      const systemPrompt = `You are a dramatic but kind courtroom judge in a friendly group of students sharing expenses in Ethiopia. Use ONLY the facts given. Do not invent numbers, names or items. Never accuse anyone of a crime; keep it playful. Max 2 sentences. Reply in ${lang === 'am' ? 'Amharic' : lang === 'om' ? 'Afaan Oromo' : 'English'}.`;

      // 5-second timeout promise race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bedrock timeout')), 5000)
      );

      const bedrockPromise = bedrockClient.send(
        new ConverseCommand({
          modelId,
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }],
            },
          ],
          system: [{ text: systemPrompt }],
          inferenceConfig: {
            maxTokens: 120,
            temperature: 0.7,
          },
        })
      );

      const response = await Promise.race([bedrockPromise, timeoutPromise]);
      const reply = response?.output?.message?.content?.[0]?.text?.trim();

      if (reply && reply.length > 5) {
        return { status, verdict: reply };
      }
    } catch (err) {
      console.warn('[Judge] Bedrock call failed or timed out. Falling back to pre-written verdict:', err.message);
    }
  }

  // Return graceful pre-written verdict
  return {
    status,
    verdict: getFallbackVerdict(),
  };
}
