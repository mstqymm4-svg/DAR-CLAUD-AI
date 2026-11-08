import React, { useEffect, useState } from "react";
import "./dalxLoader.css";

/*
=========================================================
DAR AL ULOOM — FUTURE PREMIUM LOADER
=========================================================

Modern English-only loading experience.

IMPORTANT:
Use your CURRENT logo only.
Change LOGO_URL if your logo has a different path.
=========================================================
*/

const LOGO_URL =
  "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/679b37a0c_C06AC024-1230-4B65-91B9-B30DDE077171.png";

export default function LogoLoader({
  isLoading = true,
  onComplete,
}) {
  const [visible, setVisible] = useState(isLoading);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(0);

  /*
  -------------------------------------------------------
  Fake visual progress
  -------------------------------------------------------
  This is only for the visual loading animation.
  It does NOT control the actual application loading.
  -------------------------------------------------------
  */

  useEffect(() => {
    if (!isLoading) {
      setClosing(true);

      const timer = setTimeout(() => {
        setVisible(false);

        if (typeof onComplete === "function") {
          onComplete();
        }
      }, 700);

      return () => clearTimeout(timer);
    }

    setVisible(true);
    setClosing(false);
    setProgress(0);

    const start = performance.now();
    const duration = 1900;

    let frame;

    const animate = (time) => {
      const elapsed = time - start;
      const value = Math.min(
        92,
        Math.round((elapsed / duration) * 92)
      );

      setProgress(value);

      if (value < 92) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [isLoading, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`dalx-loader ${
        closing ? "dalx-loader-closing" : ""
      }`}
    >

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="dalx-background">

        {/* Main atmospheric light */}
        <div className="dalx-atmosphere" />

        {/* Floating lights */}
        <div className="dalx-orb dalx-orb-a" />
        <div className="dalx-orb dalx-orb-b" />
        <div className="dalx-orb dalx-orb-c" />

        {/* Moving light */}
        <div className="dalx-sweep" />

        {/* Fine grid */}
        <div className="dalx-grid" />

        {/* Vignette */}
        <div className="dalx-vignette" />

      </div>


      {/* =================================================
          TOP NAVIGATION STYLE BRAND
      ================================================= */}

      <header className="dalx-header">

        <div className="dalx-brand-mini">

          <span className="dalx-brand-dot" />

          <span className="dalx-brand-mini-text">
            DAR AL ULOOM
          </span>

        </div>

        <div className="dalx-version">
          EXPERIENCE
        </div>

      </header>


      {/* =================================================
          CENTER EXPERIENCE
      ================================================= */}

      <main className="dalx-main">

        {/* -------------------------------------------------
            Logo
        ------------------------------------------------- */}

        <div className="dalx-logo-area">

          {/* outer glow */}
          <div className="dalx-logo-glow" />

          {/* orbit */}
          <div className="dalx-orbit dalx-orbit-one">
            <span />
          </div>

          <div className="dalx-orbit dalx-orbit-two">
            <span />
          </div>

          {/* logo */}
          <div className="dalx-logo-container">

            <img
              src={LOGO_URL}
              alt="Dar Al Uloom"
              className="dalx-logo"
              draggable="false"
            />

          </div>

        </div>


        {/* -------------------------------------------------
            Brand
        ------------------------------------------------- */}

        <div className="dalx-brand-content">

          <div className="dalx-eyebrow">
            KNOWLEDGE · LEARNING · EXCELLENCE
          </div>

          <h1 className="dalx-title">
            DAR AL ULOOM
          </h1>

          <p className="dalx-description">
            Your journey to knowledge begins here.
          </p>

        </div>


        {/* -------------------------------------------------
            Loading
        ------------------------------------------------- */}

        <div className="dalx-loading-area">

          <div className="dalx-loading-top">

            <span>
              {progress >= 90
                ? "Almost ready"
                : "Preparing your experience"}
            </span>

            <span className="dalx-percent">
              {progress}%
            </span>

          </div>

          <div className="dalx-progress">

            <div
              className="dalx-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

            <div className="dalx-progress-shine" />

          </div>

        </div>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="dalx-footer">

        <div className="dalx-footer-line" />

        <span>
          BUILT FOR KNOWLEDGE
        </span>

        <div className="dalx-footer-line" />

      </footer>


      {/* =================================================
          EXIT TRANSITION
      ================================================= */}

      <div className="dalx-exit-panel dalx-exit-top" />
      <div className="dalx-exit-panel dalx-exit-bottom" />


      {/* =================================================
          CSS
      ================================================= */}

    </div>
  );
}