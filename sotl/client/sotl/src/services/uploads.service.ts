export async function uploadEvidenceFile(file: File, token: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads/evidence", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // DO NOT set Content-Type for FormData
    },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Upload failed");

  // Prefer the deployed/backend URL. Fall back to the current site origin.
  if (data?.absoluteUrl) return data.absoluteUrl;
  if (data?.url) return new URL(data.url, window.location.origin).toString();
  throw new Error("Upload response missing file URL");
}
