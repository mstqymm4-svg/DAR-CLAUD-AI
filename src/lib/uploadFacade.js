/**
 * uploadFacade — unified upload entry point.
 *
 * Switches between Base44's Core.UploadFile and the independent backend's
 * /uploads endpoint based on INDEPENDENT_API_ENABLED.
 *
 * Returns a normalized { file_url, url } so call sites can keep using
 * `const { file_url } = await uploads.upload({ file, kind })` regardless
 * of which backend is active.
 */
import { base44 } from "@/api/base44Client";
import { INDEPENDENT_API_ENABLED } from "@/lib/api/config";
import { uploadApi } from "@/lib/api/uploadApi";

export const uploads = {
  /**
   * @param {Object} p
   * @param {File} p.file
   * @param {"covers"|"pdfs"|"videos"|"avatars"|"misc"} [p.kind]
   * @returns {Promise<{file_url: string, url: string}>}
   */
  async upload({ file, kind = "misc" }) {
    if (INDEPENDENT_API_ENABLED) {
      const res = await uploadApi.upload(file, kind);
      return { file_url: res.url, url: res.url };
    }
    const res = await base44.integrations.Core.UploadPublicFile({ file });
    return { file_url: res.file_url, url: res.file_url };
  },
};