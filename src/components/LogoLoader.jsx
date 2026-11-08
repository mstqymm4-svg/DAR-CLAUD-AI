import React, { useEffect, useState } from "react";

const LOGO_URL =
  "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/679b37a0c_C06AC024-1230-4B65-91B9-B30DDE077171.png";

export default function LogoLoader({ isLoading = true }) {
  const [visible, setVisible] = useState(isLoading);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setClosing(false);
    } else {
      setClosing(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <>
      <div
        className={`dar-loader ${closing ? "dar-loader-close" : ""}`}
        dir="rtl"
      >
        <div className="dar-loader-bg dar-loader-bg-1" />
        <div className="dar-loader-bg dar-loader-bg-2" />

        <div className="dar-loader-content">

          <div className="dar-logo-wrapper">
            <div className="dar-logo-light" />

            <img
              src={LOGO_URL}
              alt="دار العلوم"
              className="dar-logo"
              draggable="false"
            />
          </div>

          <div className="dar-brand">
            <div className="dar-title">
              دار العلوم
            </div>

            <div className="dar-line" />

            <div className="dar-subtitle">
              للعلم والمعرفة
            </div>
          </div>

          <div className="dar-loading">
            <div className="dar-loading-bar" />
          </div>

        </div>

        <div className="dar-footer">
          DAR AL ULOOM
        </div>
      </div>

      <style>{`
        .dar-loader {
          position: fixed;
          inset: 0;
          z-index: 999999;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          opacity: 1;
          transform: scale(1);
          transition:
            opacity 600ms cubic-bezier(0.76, 0, 0.24, 1),
            transform 600ms cubic-bezier(0.76, 0, 0.24, 1);
        }

        .dar-loader-close {
          opacity: 0;
          transform: scale(1.025);
        }

        .dar-loader-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .dar-loader-bg {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          filter: blur(90px);
        }

        .dar-loader-bg-1 {
          width: 420px;
          height: 420px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: rgba(165, 243, 252, 0.22);
          animation: darBgPulse 4s ease-in-out infinite;
        }

        .dar-loader-bg-2 {
          width: 300px;
          height: 300px;
          right: -100px;
          bottom: -100px;
          background: rgba(21, 94, 117, 0.08);
          animation: darBgFloat 5s ease-in-out infinite;
        }

        .dar-logo-wrapper {
          position: relative;
          width: 170px;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: darLogoEnter 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .dar-logo-light {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: rgba(165, 243, 252, 0.28);
          filter: blur(45px);
          animation: darLogoGlow 2.5s ease-in-out infinite;
        }

        .dar-logo {
          position: relative;
          z-index: 2;
          width: 150px;
          height: 150px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          filter: drop-shadow(
            0 18px 35px rgba(15, 23, 42, 0.10)
          );
        }

        .dar-brand {
          margin-top: 26px;
          text-align: center;
          animation: darBrandEnter 700ms 250ms
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .dar-title {
          color: #0F172A;
          font-size: 30px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .dar-line {
          width: 24px;
          height: 2px;
          margin: 12px auto 0;
          border-radius: 999px;
          background: #0891B2;
          opacity: 0.75;
        }

        .dar-subtitle {
          margin-top: 10px;
          color: #155E75;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .dar-loading {
          position: relative;
          width: 56px;
          height: 2px;
          margin-top: 34px;
          overflow: hidden;
          border-radius: 999px;
          background: #E2E8F0;
          animation: darLoadingAppear 500ms 650ms both;
        }

        .dar-loading-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 22px;
          height: 100%;
          border-radius: 999px;
          background: #155E75;
          animation: darLoadingMove 950ms
            cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .dar-footer {
          position: absolute;
          z-index: 5;
          bottom: 28px;
          left: 0;
          right: 0;
          text-align: center;
          color: #64748B;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.5px;
          opacity: 0;
          animation: darFooterEnter 600ms 700ms both;
        }

        @keyframes darLogoEnter {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.82);
            filter: blur(7px);
          }

          60% {
            opacity: 1;
            transform: translateY(-3px) scale(1.03);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes darLogoGlow {
          0% {
            opacity: 0.2;
            transform: scale(0.75);
          }

          50% {
            opacity: 0.65;
            transform: scale(1.08);
          }

          100% {
            opacity: 0.3;
            transform: scale(0.9);
          }
        }

        @keyframes darBrandEnter {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes darLoadingAppear {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }

        @keyframes darLoadingMove {
          0% {
            transform: translateX(65px);
          }

          100% {
            transform: translateX(-70px);
          }
        }

        @keyframes darFooterEnter {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }

          100% {
            opacity: 0.55;
            transform: translateY(0);
          }
        }

        @keyframes darBgPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.4;
          }

          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.7;
          }

          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.4;
          }
        }

        @keyframes darBgFloat {
          0% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(-30px, -25px);
          }

          100% {
            transform: translate(0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dar-loader-bg {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}