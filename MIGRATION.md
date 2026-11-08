# نقل «دار العلوم» من Base44 إلى Google AI Studio (Firebase)

## ما تم
- حُذف `@base44/sdk` و`@base44/vite-plugin`، وحلّ محلّهما `src/api/firebaseClient.js` بنفس واجهة `base44.*` (فلا تغيير في بقية الصفحات).
- المصادقة → Firebase Auth (بريد/كلمة مرور + Google)، البيانات → Firestore، رفع الملفات → Firebase Storage.
- دالة `deleteAccountRequest` و`sendContactMessage` أُعيدت كتابتها داخل العميل. `InvokeLLM` يعمل عبر Gemini (`VITE_GEMINI_API_KEY`).
- بدون إعداد Firebase يعمل التطبيق في **وضع محلي** (localStorage) للمعاينة.
- خادم OTP التجريبي صار للتطوير فقط ولا يُرجع الرمز للمتصفح.

## خطوات التشغيل
1. ارفع المجلد إلى AI Studio (أو GitHub ثم استورده)، واربط مشروع Firebase (يُنشئ `firebase-applet-config.json`)، أو انسخ `.env.example` إلى `.env` واملأه.
2. في Firebase: فعّل Authentication (Email + Google) وFirestore وStorage، وانشر `firestore.rules` و`storage.rules` (غيّر `REPLACE_WITH_ADMIN_EMAIL` ببريد المدير).
3. استورد البيانات: `npm i -D firebase-admin` ثم `GOOGLE_APPLICATION_CREDENTIALS=key.json npm run seed`.
4. انقل الصور من Base44: `npm run migrate-assets` (من جهاز له إنترنت عادي) — يحمّل الملفات إلى `public/migrated/` ويحدّث الروابط. **لا تحذف تطبيق Base44 قبل هذه الخطوة.**
5. `npm install && npm run dev`.

## لا ينتقل تلقائياً / يحتاج قرار
- **حسابات المستخدمين وكلمات المرور** (Base44 لا يصدّرها): يسجّل المستخدمون من جديد.
- **المفضلة وAccountData** الخاصة بكل مستخدم: مرتبطة بمعرّفات Base44، لذلك لم تُستورد.
- **MFA** (ميزة منصة Base44) أُلغيت؛ Firebase يحتاج Identity Platform لها.
- **رمز OTP عبر Gmail SMTP**: يحتاج خادماً حقيقياً؛ اضبط `VITE_API_BASE_URL`. بدونه يُستخدم رابط التحقق الذي يرسله Firebase.
- صفحات Login/Register/Forgot/Reset موجودة لكنها غير مسجّلة في `App.jsx` (كذلك في النسخة الأصلية).
- تسجيل Google داخل تطبيق Android (Capacitor) يحتاج إضافة أصلية؛ نافذة الويب لا تكفي.
