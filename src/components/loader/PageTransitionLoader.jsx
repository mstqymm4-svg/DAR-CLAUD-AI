import React from "react";
import DarLogoSVG from "./DarLogoSVG";
import LoaderParticles from "./LoaderParticles";
import "./LogoLoader.css";

/**
 * Page-transition loader — the logo is assembled piece by piece.
 * Rendered only while a page transition is in flight (never on app start).
 */
export default function PageTransitionLoader({ inline = false, exiting = false }) {
  return (
    <div
      className={`dau-loader${inline ? " dau-loader--inline" : ""}${exiting ? " is-exiting" : ""}`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="dau-ambient" />
      <svg className="dau-arcs" viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="120" />
        <circle cx="200" cy="200" r="164" />
        <circle cx="200" cy="200" r="196" />
      </svg>

      <div className="dau-stage">
        <LoaderParticles />
        <DarLogoSVG />
      </div>

      <div className="dau-text">
        <p className="dau-title">Dar Al Uloom</p>
        <p className="dau-tagline">Knowledge • Learning • Excellence</p>
        <p className="dau-status">Loading next page</p>
      </div>

      <div className="dau-progress">
        <span />
      </div>
    </div>
  );
}