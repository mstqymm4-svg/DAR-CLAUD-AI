You are working on an existing, finished React + Vite app ("دار العلوم" – an Arabic/RTL Islamic library: books, PDF reader, videos, favorites, admin panel). It was imported from GitHub and is already fully detached from Base44. DO NOT rewrite, restructure, redesign or migrate it to another framework. Only do the tasks below, in order, and fix only real errors.

## Facts about the code (do not change these conventions)
- Entry: index.html -> src/main.jsx -> src/App.jsx (JavaScript/JSX, react-router, Tailwind v3 via postcss, Vite alias "@" = ./src).
- Every page imports `{ base44 } from "@/api/base44Client"`. That name is only a legacy alias: the real implementation is src/api/firebaseClient.js (Firebase Auth + Firestore + Storage). Keep the alias and the `base44.auth.*` / `base44.entities.<Name>.*` call sites exactly as they are.
- Firebase config is read by src/lib/firebase.js from /firebase-applet-config.json (project root) or VITE_FIREBASE_* env vars. If neither exists the app runs in a local-only mode.
- Firestore collections = entity names: Book, Video, VideoChannel, SocialChannel, AppSettings, TranslationLanguage, TranslationGlossary, BookTranslation, Translation, Favorite, AccountData, users, ContactMessages, Invitations.
- Rules to deploy are in firestore.rules and storage.rules. Seed data is in data-export/*.json.

## Tasks
1. Run `npm install` then start the dev server on port 3000. If it fails, show me the exact error and fix only that, minimally.
2. Set up Firebase for this project (Authentication with Email/Password AND Google, Firestore, Storage). Make sure /firebase-applet-config.json exists in the project root (include firestoreDatabaseId if the database is not "(default)").
3. Deploy firestore.rules and storage.rules. In firestore.rules replace REPLACE_WITH_ADMIN_EMAIL with: <PUT_MY_EMAIL_HERE>.
4. Seed Firestore once from data-export/*.json with this mapping (keep each record's `id` as the document id, store the rest of the fields as-is): Books.json->Book, Videos.json->Video, VideoChannels.json->VideoChannel, SocialChannels.json->SocialChannel, AppSettings.json->AppSettings, TranslationLanguages.json->TranslationLanguage, TranslationGlossary.json->TranslationGlossary, BookTranslations.json->BookTranslation, Translations.json->Translation. Do NOT import AccountData.json or Favorites.json (they belong to old accounts). Do the seeding with a one-off script, then delete the script.
5. Authentication must work end to end with the existing pages (already routed in App.jsx): /login, /register, /forgot-password, /reset-password, /verify-email. Check: sign-up creates the user and a `users/{uid}` document with role "user"; sign-in/sign-out; Google sign-in; password-reset email (Firebase puts the code in `?oobCode=`, ResetPassword.jsx already reads it); the first admin is the email set in step 3. After sign-up the app sends a Firebase verification email.
6. Test, and report results: home page, /books, /book/:id, /read/:id (PDF), /videos, /favorites (add/remove as a signed-in user), /settings, /contact (message saved to ContactMessages), /dev admin panel (add a book, upload a cover to Storage, edit a setting) as the admin user, delete-account button in the profile.
7. Report anything that does not work with the exact error text. Do not hide failures.

## Rules
- Keep all UI text Arabic and the layout RTL. Do not touch styling.
- Never put secret keys in code. Firebase web config values are fine.
- Do not add new features, do not change file/folder structure, do not replace the `base44` alias.
