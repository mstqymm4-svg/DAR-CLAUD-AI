import { useState, useEffect } from "react";
import DarAlUloomSplash from "@/components/splash/DarAlUloomSplash";
import { Button } from "@/components/ui/button";

// Preview page so you can test the Splash animation repeatedly before approving.
export default function SplashPreview() {
  const [key, setKey] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate app loading so the splash builds progress, completes and auto-replays.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2600);
    return () => clearTimeout(timer);
  }, [key]);

  return (
    <div className="relative min-h-screen bg-white">
      {!stopped && (
        <DarAlUloomSplash
          key={key}
          isLoading={loading}
          onComplete={() => setKey((k) => k + 1)} // auto-replay for testing
        />
      )}

      <div className="absolute bottom-6 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-white shadow-lg">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setStopped(false);
            setKey((k) => k + 1);
          }}
        >
          ▶ إعادة التشغيل
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:text-white"
          onClick={() => setStopped(true)}
        >
          ⏸ إيقاف
        </Button>
      </div>
    </div>
  );
}