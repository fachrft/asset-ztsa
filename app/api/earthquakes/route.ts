import type { NextRequest } from "next/server";
import { isFeedPeriod, readEarthquakes } from "../../../lib/usgs";

const headers = { "Cache-Control": "no-store" };

function csvCell(value: string | number) {
  const text = typeof value === "string" && /^\s*[=+\-@\t\r\n]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const period = query.get("period") ?? "day";
  const format = query.get("format") ?? "json";
  if (!isFeedPeriod(period) || !["json", "csv"].includes(format)) {
    return Response.json({ error: "Invalid period or format." }, { status: 400, headers });
  }

  try {
    const feed = await readEarthquakes(period);
    if (format === "json") return Response.json(feed, { headers });

    const rows = feed.events.map((event) =>
      [event.id, event.place, event.magnitude, event.depth, event.latitude,
        event.longitude, new Date(event.time).toISOString(), feed.source].map(csvCell).join(","),
    );
    return new Response(
      ["id,location,magnitude,depth_km,latitude,longitude,time_utc,source", ...rows].join("\r\n") + "\r\n",
      { headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="usgs-earthquakes-${period}.csv"`,
      } },
    );
  } catch (error) {
    console.error("USGS feed request failed:", error instanceof Error ? error.message : error);
    return Response.json(
      { error: "The USGS feed is temporarily unavailable. Try again shortly." },
      { status: 502, headers },
    );
  }
}
