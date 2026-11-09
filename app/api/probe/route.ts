export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected application/json." }, { status: 415, headers });
  }

  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Missing payload." }, { status: 400, headers });

  const decoder = new TextDecoder();
  let bytes = 0;
  let payload = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        return Response.json({ error: "Payload exceeds 1 KB." }, { status: 413, headers });
      }
      payload += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(payload + decoder.decode());
    if (typeof body !== "object" || body === null || !("nonce" in body) ||
      typeof body.nonce !== "string" || !/^[a-z0-9-]{1,64}$/.test(body.nonce)) {
      return Response.json({ error: "Invalid probe payload." }, { status: 400, headers });
    }
    return Response.json({ status: "ok", nonce: body.nonce }, { headers });
  } catch {
    return Response.json({ error: "Invalid probe payload." }, { status: 400, headers });
  }
}
