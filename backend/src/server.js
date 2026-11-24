/**
 * Server Entrypoint for VEAYOS Homoeopathy ClinicalOS Backend
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🩺 VEAYOS Homoeopathy ClinicalOS API Server`);
  console.log(` 🚀 Listening on http://localhost:${PORT}`);
  console.log(` 🔒 Strict 2-Account Whitelist Enforced:`);
  console.log(`    - Dr. V. P. Dixit (vpdixit75@gmail.com)`);
  console.log(`    - Dr. Ved Prakash (ved@veayos.com)`);
  console.log(` ⚡ Gemini AI Repertory Proxy: ACTIVE`);
  console.log(` 💬 Aisensy WhatsApp Gateway: ACTIVE`);
  console.log(`=======================================================`);
});
