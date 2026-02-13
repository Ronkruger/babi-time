const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const uploadImageFile = async (file: File): Promise<string> => {
  const uploadApiUrl = import.meta.env.VITE_R2_UPLOAD_API_URL as string | undefined;
  const uploadApiToken = import.meta.env.VITE_R2_UPLOAD_API_TOKEN as string | undefined;

  if (!uploadApiUrl) {
    return fileToDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(uploadApiUrl, {
    method: "POST",
    body: formData,
    headers: uploadApiToken ? { Authorization: `Bearer ${uploadApiToken}` } : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  const payload = (await response.json()) as { url?: string; key?: string; note?: string };
  if (payload.url) {
    return payload.url;
  }

  throw new Error(payload.note || "Upload API did not return a public url. Set PUBLIC_R2_BASE_URL in worker.");
};
