import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";
import { useT } from "@/lib/i18n";
import ExtraEffectLayers, {
  ParticlesCanvas, StarsCanvas, IslamicPatternSvg, WavesAnimation, FloatingShapes
} from "@/components/hero/EffectLayers";

function GradientAnimation({ from, to, speed }) {
  const dur = 8 / speed;
  return (
    <div className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${from}, ${to}, ${from})`,
      backgroundSize: "300% 300%",
      animation: `gradAnim ${dur}s ease infinite`
    }}>
      <style>{`@keyframes gradAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
    </div>);

}

function SlideshowBg({ urls, transition, duration, blur, brightness }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!urls.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % urls.length), duration * 1000);
    return () => clearInterval(t);
  }, [urls.length, duration]);
  if (!urls.length) return null;
  return (
    <div className="absolute inset-0">
      {urls.map((url, i) =>
      <div key={url + i} className="absolute inset-0 transition-all duration-1000"
      style={{
        opacity: i === idx ? 1 : 0,
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: `blur(${blur}px) brightness(${brightness / 100})`,
        transform: transition === "zoom" ? i === idx ? "scale(1.05)" : "scale(1)" : undefined,
        transition: "opacity 1s ease, transform 6s ease"
      }} />
      )}
    </div>);

}

// ── Main HeroBanner ────────────────────────────────────────────────────────────
function read(key, fallback = "") {return getSetting(key) || fallback;}

export default function HeroBanner() {
  const t = useT();
  const [s, setS] = useState(() => ({
    bgType: read("hero_bg_type", "gradient_anim"),
    bgUrl: read("hero_bg_url"),
    gradFrom: read("hero_grad_from", "#134e2a"),
    gradTo: read("hero_grad_to", "#1a6b3c"),
    opacity: Number(read("hero_bg_opacity", "100")),
    blur: Number(read("hero_bg_blur", "0")),
    brightness: Number(read("hero_bg_brightness", "100")),
    contrast: Number(read("hero_bg_contrast", "100")),
    saturation: Number(read("hero_bg_saturation", "100")),
    overlayColor: read("hero_overlay_color", "#000000"),
    overlayAlpha: Number(read("hero_overlay_alpha", "30")),
    animSpeed: Number(read("hero_anim_speed", "5")),
    zoom: read("hero_zoom") === "true",
    title: read("hero_title"),
    subtitle: read("hero_subtitle"),
    btnText: read("hero_btn_text"),
    btnLink: read("hero_btn_link", "/books"),
    slideUrls: (() => {try {return JSON.parse(read("hero_slideshow_urls", "[]"));} catch {return [];}})(),
    slideTransition: read("hero_slide_transition", "fade"),
    slideDuration: Number(read("hero_slide_duration", "4")),
    videoAutoplay: read("hero_video_autoplay") !== "false",
    videoLoop: read("hero_video_loop") !== "false",
    videoMute: read("hero_video_mute") !== "false",
    videoBrightness: Number(read("hero_video_brightness", "100")),
    lottieUrl: read("hero_lottie_url"),
    customHtml: read("hero_custom_html"),
    extraLayers: (() => {try {return JSON.parse(read("hero_extra_layers", "[]"));} catch {return [];}})(),
    customLayers: (() => {try {return JSON.parse(read("hero_custom_layers", "[]"));} catch {return [];}})()
  }));

  useEffect(() => {
    const unsub = subscribeToSettings(() => {
      setS({
        bgType: read("hero_bg_type", "gradient_anim"),
        bgUrl: read("hero_bg_url"),
        gradFrom: read("hero_grad_from", "#134e2a"),
        gradTo: read("hero_grad_to", "#1a6b3c"),
        opacity: Number(read("hero_bg_opacity", "100")),
        blur: Number(read("hero_bg_blur", "0")),
        brightness: Number(read("hero_bg_brightness", "100")),
        contrast: Number(read("hero_bg_contrast", "100")),
        saturation: Number(read("hero_bg_saturation", "100")),
        overlayColor: read("hero_overlay_color", "#000000"),
        overlayAlpha: Number(read("hero_overlay_alpha", "30")),
        animSpeed: Number(read("hero_anim_speed", "5")),
        zoom: read("hero_zoom") === "true",
        title: read("hero_title"),
        subtitle: read("hero_subtitle"),
        btnText: read("hero_btn_text"),
        btnLink: read("hero_btn_link", "/books"),
        slideUrls: (() => {try {return JSON.parse(read("hero_slideshow_urls", "[]"));} catch {return [];}})(),
        slideTransition: read("hero_slide_transition", "fade"),
        slideDuration: Number(read("hero_slide_duration", "4")),
        videoAutoplay: read("hero_video_autoplay") !== "false",
        videoLoop: read("hero_video_loop") !== "false",
        videoMute: read("hero_video_mute") !== "false",
        videoBrightness: Number(read("hero_video_brightness", "100")),
        lottieUrl: read("hero_lottie_url"),
        customHtml: read("hero_custom_html"),
        extraLayers: (() => {try {return JSON.parse(read("hero_extra_layers", "[]"));} catch {return [];}})(),
        customLayers: (() => {try {return JSON.parse(read("hero_custom_layers", "[]"));} catch {return [];}})()
      });
    });
    return unsub;
  }, []);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };

  const overlayStyle = {
    backgroundColor: `rgba(${hexToRgb(s.overlayColor)},${s.overlayAlpha / 100})`
  };

  const bgFilterStyle = {
    filter: `blur(${s.blur}px) brightness(${s.brightness / 100}) contrast(${(s.contrast || 100) / 100}) saturate(${(s.saturation || 100) / 100})`,
    opacity: s.opacity / 100,
    transform: s.zoom ? "scale(1.05)" : undefined
  };

  const renderBg = () => {
    const { bgType, bgUrl, gradFrom, gradTo, animSpeed } = s;
    if (bgType === "static_image" || bgType === "animated_gif") {
      return bgUrl ?
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})`, ...bgFilterStyle }} /> :

      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />;

    }
    if (bgType === "video_mp4" || bgType === "video_webm") {
      return bgUrl ?
      <video className="absolute inset-0 w-full h-full object-cover" style={bgFilterStyle}
      autoPlay={s.videoAutoplay} loop={s.videoLoop} muted={s.videoMute} playsInline>
          <source src={bgUrl} type={bgType === "video_mp4" ? "video/mp4" : "video/webm"} />
        </video> :

      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} />;

    }
    if (bgType === "slideshow") {
      return <SlideshowBg urls={s.slideUrls} transition={s.slideTransition}
      duration={s.slideDuration} blur={s.blur} brightness={s.brightness} />;
    }
    if (bgType === "lottie") {
      return s.lottieUrl ?
      <iframe src={`https://lottiefiles.com/preview/${s.lottieUrl}`}
      className="absolute inset-0 w-full h-full border-0" title="lottie" style={{ opacity: s.opacity / 100 }} /> :
      <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    }
    if (bgType === "custom_html") {
      return s.customHtml ?
      <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: s.customHtml }} /> :
      <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    }
    if (bgType === "gradient_anim") return <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
    if (bgType === "particles") return <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} /><ParticlesCanvas speed={animSpeed} /></>;
    if (bgType === "islamic_pattern") return <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} /><IslamicPatternSvg color2={gradTo} speed={animSpeed} /></>;
    if (bgType === "floating_shapes") return <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} /><FloatingShapes color2={gradTo} speed={animSpeed} /></>;
    if (bgType === "stars") return <><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }} /><StarsCanvas speed={animSpeed} /></>;
    if (bgType === "waves") return <><div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${gradFrom}, ${gradTo})` }} /><WavesAnimation color2={gradTo} speed={animSpeed} /></>;
    // fallback
    return <GradientAnimation from={gradFrom} to={gradTo} speed={animSpeed} />;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-12 md:py-20">

      <div className="relative overflow-hidden rounded-3xl min-h-[300px] md:min-h-[360px] flex items-center">
        {/* Background layer */}
        {renderBg()}

        {/* Extra effect layers combined on top of the base background */}
        <ExtraEffectLayers layers={s.extraLayers} speed={s.animSpeed} color2={s.gradTo} customHtml={s.customHtml} customLayers={s.customLayers} />

        {/* Overlay */}
        <div className="absolute inset-0 opacity-100 rounded-md" style={overlayStyle} />

        {/* Subtle Islamic decoration */}
        {!["video_mp4", "video_webm"].includes(s.bgType) &&
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-6 right-10 text-7xl opacity-10 text-white select-none">﷽</div>
            <div className="absolute bottom-4 left-8 text-5xl opacity-10 text-white select-none">☪</div>
          </div>
        }

        {/* Content */}
        <div className="relative z-10 max-w-2xl p-8 md:p-14 w-full">
          {(() => {const eyebrow = read("app_subtitle");return eyebrow ? null :


            null;})()}
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl text-white drop-shadow-lg">
            {s.title || t.heroTitle}
          </h1>
          <p className="mb-8 text-base leading-relaxed opacity-90 md:text-lg max-w-lg text-white/90 drop-shadow">
            {s.subtitle || t.heroSub}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={s.btnLink || "/books"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg rounded-[4px_24px_4px_28px]">
              {s.btnText || t.browseLib}
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {(() => {const yt = read("youtube_url");const yl = read("youtube_label") || t.youtubeBtn;return yt ?
              <a href={yt} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors rounded-[4px_20px_4px_20px] backdrop-blur-sm">
                ▶ {yl}
              </a> : null;})()}
          </div>
        </div>
      </div>
    </motion.section>);

}