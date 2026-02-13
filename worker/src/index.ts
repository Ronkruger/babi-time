export interface Env {
  UPLOADS: {
    put: (
      key: string,
      value: ArrayBuffer,
      options?: {
        httpMetadata?: { contentType?: string };
        customMetadata?: Record<string, string>;
      }
    ) => Promise<unknown>;
  };
  ALLOWED_ORIGINS: string;
  PUBLIC_R2_BASE_URL: string;
  UPLOAD_TOKEN: string;
}

const parseAllowedOrigins = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const resolveCorsOrigin = (request: Request, allowedOriginsRaw: string) => {
  const requestOrigin = request.headers.get("Origin") || "";
  const allowedOrigins = parseAllowedOrigins(allowedOriginsRaw);
  if (!requestOrigin || allowedOrigins.length === 0) return "*";
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0] || "*";
};

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
});

const json = (body: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = resolveCorsOrigin(request, env.ALLOWED_ORIGINS || "");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (env.UPLOAD_TOKEN) {
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (!token || token !== env.UPLOAD_TOKEN) {
        return json({ error: "Unauthorized" }, 401, origin);
      }
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Use multipart/form-data with file field" }, 400, origin);
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ error: "Missing file field" }, 400, origin);
    }

    if (!file.type.startsWith("image/")) {
      return json({ error: "Only image uploads are allowed" }, 400, origin);
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return json({ error: "File too large. Max size is 8MB" }, 400, origin);
    }

    const fileKey = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    await env.UPLOADS.put(fileKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const baseUrl = env.PUBLIC_R2_BASE_URL?.trim();
    if (!baseUrl) {
      return json(
        {
          key: fileKey,
          note: "Upload success. Set PUBLIC_R2_BASE_URL to return direct file URLs.",
        },
        200,
        origin
      );
    }

    return json(
      {
        key: fileKey,
        url: `${baseUrl.replace(/\/$/, "")}/${fileKey}`,
      },
      200,
      origin
    );
  },
};
