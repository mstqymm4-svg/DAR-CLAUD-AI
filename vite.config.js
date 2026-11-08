import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// Dev-only OTP stub so the verification screens can be exercised locally.
// It is NOT bundled into production builds (apply: 'serve') and it never
// returns the code to the browser — the code is printed to the dev console.
// In production, point VITE_API_BASE_URL at a real server (Gmail SMTP etc.).
function devOtpPlugin() {
  const store = new Map();
  const json = (res, status, body) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };
  const readBody = (req) => new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
  return {
    name: 'dev-otp',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (req.method !== 'POST') return next();
        if (url === '/api/send-otp' || url === '/send-otp') {
          const { email } = await readBody(req);
          const e = String(email || '').trim().toLowerCase();
          if (!e) return json(res, 400, { success: false, error: 'يرجى إدخال البريد الإلكتروني' });
          const code = String(Math.floor(100000 + Math.random() * 900000));
          store.set(e, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 5 });
          console.log(`[dev-otp] ${e} -> ${code}`);
          return json(res, 200, { success: true, message: `تم إرسال رمز التحقق إلى ${e} (وضع التطوير: انظر سجل الخادم)` });
        }
        if (url === '/api/verify-otp' || url === '/verify-otp') {
          const { email, otp } = await readBody(req);
          const e = String(email || '').trim().toLowerCase();
          const rec = store.get(e);
          if (!rec || Date.now() > rec.expiresAt) {
            store.delete(e);
            return json(res, 400, { success: false, error: 'انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد' });
          }
          if (rec.code !== String(otp || '').trim()) {
            rec.attempts -= 1;
            if (rec.attempts <= 0) {
              store.delete(e);
              return json(res, 400, { success: false, exhausted: true, remainingAttempts: 0, error: 'استنفدت جميع المحاولات. يرجى طلب رمز جديد.' });
            }
            return json(res, 400, { success: false, remainingAttempts: rec.attempts, error: `رمز التحقق غير صحيح، المحاولات المتبقية: ${rec.attempts}` });
          }
          store.delete(e);
          return json(res, 200, { success: true, message: 'تم التحقق من الرمز بنجاح ✓' });
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [devOtpPlugin(), react({ include: /\.(jsx|js|tsx|ts)$/ })],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // AI Studio disables HMR via DISABLE_HMR to avoid flicker during agent edits.
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
