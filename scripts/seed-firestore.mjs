// Imports data-export/*.json (exported from Base44) into Firestore.
// Usage:  GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json node scripts/seed-firestore.mjs [databaseId]
// Needs: npm i -D firebase-admin
import { readFileSync, existsSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const MAP = {
  "Books.json": "Book", "Videos.json": "Video", "VideoChannels.json": "VideoChannel",
  "SocialChannels.json": "SocialChannel", "AppSettings.json": "AppSettings",
  "TranslationLanguages.json": "TranslationLanguage", "TranslationGlossary.json": "TranslationGlossary",
  "BookTranslations.json": "BookTranslation", "Translations.json": "Translation",
  // AccountData / Favorites belong to individual users (created_by_id is a Base44 id), so they are skipped.
};

initializeApp({ credential: applicationDefault() });
const db = process.argv[2] ? getFirestore(process.argv[2]) : getFirestore();

for (const [file, coll] of Object.entries(MAP)) {
  const path = new URL(`../data-export/${file}`, import.meta.url);
  if (!existsSync(path)) continue;
  const rows = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(rows) || !rows.length) { console.log(`- ${coll}: empty`); continue; }
  let batch = db.batch(), n = 0;
  for (const r of rows) {
    const { id, ...data } = r;
    batch.set(id ? db.collection(coll).doc(String(id)) : db.collection(coll).doc(), data);
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`✓ ${coll}: ${rows.length} documents`);
}
