# بناء AAB (Google Play)

المتطلبات على جهازك: Node 20+، JDK 17، Android Studio (أو Android SDK مع `ANDROID_HOME`).

```bash
npm install
./scripts/make-keystore.sh      # مرة واحدة: ينشئ مفتاح التوقيع (احتفظ بنسخة منه ومن كلمة المرور!)
npm run android:aab             # الناتج: android/app/build/outputs/bundle/release/app-release.aab
```

قبل الرفع: ارفع `versionCode` في `android/app/build.gradle` مع كل إصدار، واضبط `VITE_API_BASE_URL`
(خادم OTP) لأن المسارات النسبية لا تصل لخادمك من داخل التطبيق.

## قائمة اختبار قبل Google Play
- [ ] تشغيل على جهاز حقيقي: `npx cap run android`
- [ ] الصفحات: الرئيسية، الكتب، قراءة PDF، الفيديوهات، المفضلة، الإعدادات، تواصل معنا
- [ ] وضع عدم الاتصال: افتح الكتب ثم أوقف الشبكة وأعد التشغيل
- [ ] التسجيل/الدخول/التحقق بالبريد/استعادة كلمة المرور
- [ ] تسجيل Google (يحتاج إضافة أصلية داخل Capacitor)
- [ ] حذف الحساب (مطلوب من Google Play)
- [ ] اتجاه RTL والخطوط العربية، والوضع الداكن
- [ ] تدوير الشاشة وزر الرجوع
- [ ] فحص Play Console: سياسة الخصوصية، Data safety، لقطات الشاشة

## من الهاتف (Termux + GitHub Actions)
1. `pkg install -y nodejs-lts git openjdk-17 unzip`
2. `termux-setup-storage` ثم `unzip ~/storage/downloads/dar-al-uloom-aistudio.zip -d ~ && cd ~/dar-aistudio`
3. `npm install && npm run migrate-assets`
4. مفتاح التوقيع: `./scripts/make-keystore.sh` ثم `base64 -w0 android/dar-upload.jks`
5. على GitHub (مستودع جديد) ← Settings ← Secrets ← Actions: أضف `KEYSTORE_B64` (ناتج الأمر) و`KEYSTORE_PASSWORD`.
6. `git init -b main && git add . && git commit -m init && git remote add origin <رابط المستودع> && git push -u origin main`
7. تبويب Actions ← Build Android AAB ← نزّل الملف من Artifacts.
