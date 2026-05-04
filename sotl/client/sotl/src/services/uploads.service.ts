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

  // backend returns: { url: "/uploads/..." }
  // store as full URL (safer for later viewing)
  return `http://localhost:5000${data.url}`;
}