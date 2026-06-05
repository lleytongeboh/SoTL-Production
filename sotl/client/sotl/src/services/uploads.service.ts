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

  if (data?.url) return new URL(data.url, window.location.origin).toString();
  if (data?.absoluteUrl) {
    const absoluteUrl = new URL(data.absoluteUrl);
    if (absoluteUrl.pathname.startsWith("/uploads/")) {
      return new URL(absoluteUrl.pathname + absoluteUrl.search, window.location.origin).toString();
    }
    return data.absoluteUrl;
  }
  throw new Error("Upload response missing file URL");
}
