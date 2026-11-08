import { appParams } from "@/lib/app-params";

/**
 * Uploads a file to the Base44 Core.UploadFile endpoint with progress tracking.
 * Uses XMLHttpRequest to get real-time upload progress (axios doesn't expose it by default).
 *
 * @param {File} file - The file to upload
 * @param {(percent: number, loadedMB: number, totalMB: number, speedMBs: number, etaSec: number) => void} onProgress - progress callback
 * @returns {Promise<string>} file_url
 */
export function uploadFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file, file.name);

    const endpoint = `/api/apps/${appParams.appId}/integration-endpoints/Core/UploadFile`;

    const startTime = Date.now();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (e.total / (1024 * 1024)).toFixed(1);
        const elapsedSec = (Date.now() - startTime) / 1000;
        const speedMBs = elapsedSec > 0 ? (e.loaded / (1024 * 1024)) / elapsedSec : 0;
        const remainingBytes = e.total - e.loaded;
        const etaSec = speedMBs > 0 ? remainingBytes / (1024 * 1024) / speedMBs : 0;
        onProgress(percent, loadedMB, totalMB, speedMBs, etaSec);
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.file_url) {
          resolve(res.file_url);
        } else {
          reject(new Error(res.detail || res.error || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", endpoint);

    // Auth token
    if (appParams.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${appParams.token}`);
    }

    xhr.send(formData);
  });
}