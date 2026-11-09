export function GET(): Response {
  return Response.json(
    { status: "ok", service: "seismic-desk", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
