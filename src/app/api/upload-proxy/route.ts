/**
 * Proxy file uploads to the remote server.
 * Client uploads to /api/upload-proxy → this route forwards to SERVER/api/upload.
 * Returns server-relative URLs (e.g. /uploads/xxx.png).
 */

const SERVER_URL = process.env.DEVFORGE_SERVER_URL ?? "https://forge.wdao.chat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Forward the FormData to the server's upload endpoint
    const res = await fetch(`${SERVER_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Upload failed");
      return Response.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload proxy failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
