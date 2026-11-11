/**
 * OTP e-mail server for Dar Al-Uloom (Gmail SMTP).
 *   POST /send-otp    { email }        -> sends a 6-digit code
 *   POST /verify-otp  { email, otp }   -> verifies it
 * Both are also served under /api/... Codes are never returned to the browser.
 *
 * Environment (set in your host's dashboard, never in code):
 *   GMAIL_USER          sender address, e.g. daraluloom258@gmail.com
 *   GMAIL_APP_PASSWORD  16-char Google "App password" (needs 2-Step Verification)
 *   OTP_SECRET          long random string (used to hash codes)
 *   ALLOWED_ORIGINS     comma-separated origins allowed to call this server
 *   OTP_DRY_RUN=1       log mails to the console instead of sending (testing only)
 */
import express from "express";
import nodemailer from "nodemailer";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const {
  GMAIL_USER = "daraluloom258@gmail.com",
  GMAIL_APP_PASSWORD = "",
  OTP_SECRET = "",
  ALLOWED_ORIGINS = "",
  OTP_DRY_RUN = "",
  PORT = "8080",
} = process.env;

if (!OTP_SECRET || OTP_SECRET.length < 16) {
  console.error("OTP_SECRET must be set (16+ characters)."); process.exit(1);
}
if (!OTP_DRY_RUN && !GMAIL_APP_PASSWORD) {
  console.error("GMAIL_APP_PASSWORD must be set (or OTP_DRY_RUN=1 for testing)."); process.exit(1);
}

const TTL_MS = 10 * 60 * 1000, MAX_ATTEMPTS = 5, RESEND_MS = 60 * 1000;
const MAX_PER_HOUR = 5, IP_PER_HOUR = 30;
const origins = ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);

const transport = OTP_DRY_RUN
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });

const store = new Map();      // email -> { hash, expiresAt, attempts, lastSent }
const hourly = new Map();     // key -> { count, resetAt }
const norm = (e) => String(e || "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hash = (email, code) => createHmac("sha256", OTP_SECRET).update(`${email}:${code}`).digest();

function hit(key, limit) {
  const now = Date.now();
  const r = hourly.get(key);
  if (!r || now > r.resetAt) { hourly.set(key, { count: 1, resetAt: now + 3600_000 }); return true; }
  if (r.count >= limit) return false;
  r.count++; return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) if (now > v.expiresAt) store.delete(k);
  for (const [k, v] of hourly) if (now > v.resetAt) hourly.delete(k);
}, 60_000).unref();

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "2kb" }));

app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && (origins.includes(o) || origins.includes("*"))) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const mail = (to, code) => ({
  from: `"دار العلوم" <${GMAIL_USER}>`,
  to,
  subject: "رمز التحقق - دار العلوم",
  text: `رمز التحقق الخاص بك: ${code}\nصالح لمدة 10 دقائق. إذا لم تطلبه فتجاهل هذه الرسالة.`,
  html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="color:#0d3b2e;margin:0 0 12px">دار العلوم</h2>
    <p style="margin:0 0 12px">رمز التحقق الخاص بك:</p>
    <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#0d3b2e;text-align:center;padding:12px;background:#f3f4f6;border-radius:8px">${code}</div>
    <p style="color:#6b7280;font-size:13px;margin:16px 0 0">صالح لمدة 10 دقائق. إذا لم تطلبه فتجاهل هذه الرسالة.</p></div>`,
});

async function sendOtp(req, res) {
  const email = norm(req.body?.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, error: "صيغة البريد الإلكتروني غير صحيحة" });
  if (!hit(`ip:${req.ip}`, IP_PER_HOUR)) return res.status(429).json({ success: false, error: "طلبات كثيرة، حاول لاحقاً" });

  const prev = store.get(email), now = Date.now();
  if (prev && now - prev.lastSent < RESEND_MS) {
    const retryAfter = Math.ceil((RESEND_MS - (now - prev.lastSent)) / 1000);
    return res.status(429).json({ success: false, error: `انتظر ${retryAfter} ثانية قبل إعادة الإرسال`, retryAfter });
  }
  if (!hit(`mail:${email}`, MAX_PER_HOUR)) return res.status(429).json({ success: false, error: "تجاوزت الحد المسموح من الرموز، حاول بعد ساعة" });

  const code = String(randomInt(100000, 1000000));
  try {
    const info = await transport.sendMail(mail(email, code));
    if (OTP_DRY_RUN) console.log(`[dry-run] ${email} -> ${code}`, info.message ? "" : "");
  } catch (err) {
    console.error("sendMail failed:", err.message);
    return res.status(502).json({ success: false, error: "تعذر إرسال الرمز، حاول لاحقاً" });
  }
  store.set(email, { hash: hash(email, code), expiresAt: now + TTL_MS, attempts: MAX_ATTEMPTS, lastSent: now });
  res.json({ success: true, message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
}

function verifyOtp(req, res) {
  const email = norm(req.body?.email), otp = String(req.body?.otp || "").trim();
  const rec = store.get(email);
  if (!rec || Date.now() > rec.expiresAt) {
    store.delete(email);
    return res.status(400).json({ success: false, error: "انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد" });
  }
  const ok = /^\d{6}$/.test(otp) && timingSafeEqual(hash(email, otp), rec.hash);
  if (!ok) {
    rec.attempts -= 1;
    if (rec.attempts <= 0) {
      store.delete(email);
      return res.status(400).json({ success: false, exhausted: true, remainingAttempts: 0, error: "استنفدت جميع المحاولات. يرجى طلب رمز جديد." });
    }
    return res.status(400).json({ success: false, remainingAttempts: rec.attempts, error: `رمز التحقق غير صحيح، المحاولات المتبقية: ${rec.attempts}` });
  }
  store.delete(email);
  res.json({ success: true, message: "تم التحقق من الرمز بنجاح ✓" });
}

for (const p of ["/send-otp", "/api/send-otp"]) app.post(p, sendOtp);
for (const p of ["/verify-otp", "/api/verify-otp"]) app.post(p, verifyOtp);
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(Number(PORT), () => console.log(`OTP server on :${PORT} (sender ${GMAIL_USER}${OTP_DRY_RUN ? ", DRY RUN" : ""})`));
