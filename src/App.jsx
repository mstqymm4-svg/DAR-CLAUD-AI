import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import SaveStatusIndicator from './components/SaveStatusIndicator';
import { useEffect, lazy, Suspense, useState } from 'react';
import { loadSettings } from '@/lib/settingsStore';
import { initThemeEngine } from '@/lib/themeEngine';
import { base44 } from '@/api/base44Client';
import { syncPendingFavorites } from '@/lib/offlineSync';
import { getAccountEmail } from '@/lib/activeUser';
import { startContentSyncEngine } from '@/lib/contentSyncEngine';
import { startAccountSyncEngine } from '@/lib/accountSync';
import LogoLoader from './components/LogoLoader';
import SyncStatusBadge from './components/SyncStatusBadge';
import InstallPrompt from './components/InstallPrompt';
import { PageSpinner } from './components/Skeleton';

// Apply theme immediately from localStorage before any renders
try {
  const lsMode = localStorage.getItem("devs_theme_mode") || (localStorage.getItem("devs_dark_mode") === "true" ? "dark" : "light");
  if (lsMode === "dark") document.documentElement.classList.add("dark");else
  if (lsMode === "light") document.documentElement.classList.remove("dark");
} catch (e) {}

// Lazy-load pages for faster initial load
const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const DevPanel = lazy(() => import('./pages/DevPanel'));
const ReadBook = lazy(() => import('./pages/ReadBook'));
const Videos = lazy(() => import('./pages/Videos'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const SplashPreview = lazy(() => import('./pages/SplashPreview'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
import DarAlUloomSplash from './components/splash/DarAlUloomSplash';

const PageLoader = () => (
  <div className="min-h-[60vh] w-full max-w-6xl mx-auto px-4 pt-6">
    <PageSpinner />
  </div>
);


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [splashDone, setSplashDone] = useState(
    () => { try { return sessionStorage.getItem('dar_splash_shown') === '1'; } catch { return false; } }
  );

  useEffect(() => {
    base44.auth.me().
    then((u) => {
      loadSettings(u?.email);
      if (u) syncPendingFavorites(getAccountEmail(u)).catch(() => {});
    }).
    catch(() => {
      loadSettings();
    }).
    finally(() => initThemeEngine());
  }, []);

  // Start the smart content sync engine (replaces manual fullSync calls)
  // — syncs on app open, every 5 min, on "online", and on tab focus
  useEffect(() => {
    const cleanup = startContentSyncEngine();
    return cleanup;
  }, []);

  // Cloud account backup — restores the user's data (avatar, favorites,
  // reading progress, watched videos) automatically after a fresh install
  useEffect(() => {
    const cleanup = startAccountSyncEngine();
    return cleanup;
  }, []);

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!splashDone) {
    return (
      <DarAlUloomSplash
        isLoading={isLoadingPublicSettings || isLoadingAuth}
        onComplete={() => {
          try { sessionStorage.setItem('dar_splash_shown', '1'); } catch {}
          setSplashDone(true);
        }}
      />
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <LogoLoader size={100} />
      </div>
    );
  }

  return (
    <>
    <SaveStatusIndicator />
    <SyncStatusBadge />
    <InstallPrompt />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dev" element={<DevPanel />} />
          <Route path="/read/:id" element={<ReadBook />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/splash-preview" element={<SplashPreview />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
    </>);

};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>);

}

export default App;