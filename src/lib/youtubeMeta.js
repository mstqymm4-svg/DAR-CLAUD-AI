/**
 * YouTube Metadata Extractor and Helper Utilities
 * Supports auto-fetching video title, duration, channel name, thumbnail,
 * as well as YouTube channel name, logo, and description.
 */

export function extractYoutubeId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getThumbnail(youtubeUrl, quality = "hq") {
  const id = extractYoutubeId(youtubeUrl);
  if (!id) return "";
  if (quality === "maxres") {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Normalizes channel URL or handle
 */
export function normalizeChannelUrl(input) {
  if (!input) return "";
  let trimmed = String(input).trim();
  if (trimmed.startsWith("@")) {
    return `https://www.youtube.com/${trimmed}`;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (trimmed.startsWith("youtube.com") || trimmed.startsWith("www.youtube.com")) {
      return `https://${trimmed}`;
    }
    return `https://www.youtube.com/@${trimmed}`;
  }
  return trimmed;
}

/**
 * Fetches video metadata (title, duration, channel_name, thumbnail, video_type, description)
 */
export async function fetchVideoMetadata(url) {
  if (!url) return null;
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  // 1. Try our backend Express proxy endpoint first
  try {
    const res = await fetch(`/api/youtube-meta?type=video&url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          title: data.title || "",
          channel_name: data.channel_name || "",
          channel_url: data.channel_url || "",
          duration: data.duration || "",
          duration_seconds: data.duration_seconds || 0,
          thumbnail: data.thumbnail || getThumbnail(url),
          thumbnail_hq: data.thumbnail_hq || getThumbnail(url, "maxres"),
          video_type: data.video_type || (url.includes("/shorts/") ? "short" : "normal"),
          description: data.description || "",
        };
      }
    }
  } catch (err) {
    console.warn("Backend /api/youtube-meta call failed, trying client fallback:", err);
  }

  // 2. Resilient client-side fallback: YouTube oEmbed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const odata = await oembedRes.json();
      return {
        title: odata.title || "",
        channel_name: odata.author_name || "",
        channel_url: odata.author_url || "",
        duration: "",
        thumbnail: getThumbnail(url),
        thumbnail_hq: getThumbnail(url, "maxres"),
        video_type: url.includes("/shorts/") ? "short" : "normal",
        description: "",
      };
    }
  } catch (err) {
    console.warn("Client oEmbed fallback failed:", err);
  }

  return {
    title: "",
    channel_name: "",
    duration: "",
    thumbnail: getThumbnail(url),
    video_type: url.includes("/shorts/") ? "short" : "normal",
  };
}

/**
 * Fetches channel metadata (name, channel_logo, description, youtube_url)
 */
export async function fetchChannelMetadata(url) {
  if (!url) return null;
  const normalizedUrl = normalizeChannelUrl(url);

  // 1. Try backend proxy
  try {
    const res = await fetch(`/api/youtube-meta?type=channel&url=${encodeURIComponent(normalizedUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          name: data.name || "",
          channel_logo: data.channel_logo || "",
          description: data.description || "",
          youtube_url: data.youtube_url || normalizedUrl,
        };
      }
    }
  } catch (err) {
    console.warn("Backend channel metadata fetch failed:", err);
  }

  // 2. Fallback: extract handle from URL if possible
  const handleMatch = normalizedUrl.match(/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch) {
    return {
      name: handleMatch[1],
      channel_logo: "",
      description: "",
      youtube_url: normalizedUrl,
    };
  }

  return {
    name: "",
    channel_logo: "",
    description: "",
    youtube_url: normalizedUrl,
  };
}

/**
 * Automatically downloads and uploads the channel logo to app storage via base44.integrations.Core.UploadFile,
 * with fallback to the high-res external YouTube image URL.
 */
export async function autoUploadChannelLogo(logoUrl, channelName = "channel") {
  if (!logoUrl) return "";
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(logoUrl)}`;
    let blob = null;
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        blob = await res.blob();
      }
    } catch {
      try {
        const directRes = await fetch(logoUrl);
        if (directRes.ok) blob = await directRes.blob();
      } catch {}
    }

    if (blob) {
      const { base44 } = await import("@/api/base44Client");
      if (base44?.integrations?.Core?.UploadFile) {
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const cleanName = (channelName || "channel").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
        const file = new File([blob], `${cleanName}_logo_${Date.now()}.${ext}`, {
          type: blob.type || "image/jpeg",
        });
        const uploaded = await base44.integrations.Core.UploadPublicFile({ file });
        if (uploaded?.file_url) {
          return uploaded.file_url;
        }
      }
    }
  } catch (err) {
    console.warn("Auto upload channel logo fallback to direct URL:", err);
  }
  return logoUrl;
}

/**
 * Fetches the videos of a YouTube channel by channel URL or handle
 */
export async function fetchChannelVideos(channelUrl, limit = 30) {
  if (!channelUrl) return [];
  const normalized = normalizeChannelUrl(channelUrl);
  try {
    const res = await fetch(`/api/youtube-channel-videos?url=${encodeURIComponent(normalized)}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.videos)) {
        return data.videos;
      }
    }
  } catch (err) {
    console.warn("fetchChannelVideos failed:", err);
  }
  return [];
}