import "server-only";
import type { Earthquake, EarthquakeFeed, FeedPeriod } from "./earthquakes";

const feeds: Record<FeedPeriod, string> = {
  day: "2.5_day.geojson",
  week: "2.5_week.geojson",
};

export function isFeedPeriod(period: string): period is FeedPeriod {
  return Object.hasOwn(feeds, period);
}

type UsgsFeature = {
  id?: string;
  properties?: {
    type?: string;
    mag?: number | null;
    time?: number;
    place?: string | null;
    status?: string;
    url?: string;
  } | null;
  geometry?: { coordinates?: number[] } | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function readEarthquakes(period: FeedPeriod): Promise<EarthquakeFeed> {
  const response = await fetch(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feeds[period]}`,
    { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`USGS returned HTTP ${response.status}`);

  const feed: { features?: UsgsFeature[]; metadata?: { generated?: number } } = await response.json();
  const generated = feed?.metadata?.generated;
  if (!Array.isArray(feed?.features) || !isFiniteNumber(generated)) {
    throw new Error("Unexpected USGS feed format");
  }

  const events = feed.features.flatMap<Earthquake>((event) => {
    if (!event || typeof event.id !== "string") return [];
    const { id, properties, geometry } = event;
    const { mag, time } = properties ?? {};
    const [longitude, latitude, depth] = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
    if (
      properties?.type !== "earthquake" ||
      !isFiniteNumber(mag) || !isFiniteNumber(time) ||
      !isFiniteNumber(longitude) || !isFiniteNumber(latitude) || !isFiniteNumber(depth)
    ) return [];

    return [{
      id,
      place: typeof properties.place === "string" && properties.place ? properties.place : "Unknown location",
      magnitude: mag,
      time,
      longitude,
      latitude,
      depth,
      status: properties.status,
      url: typeof properties.url === "string" && properties.url.startsWith("https://earthquake.usgs.gov/") ? properties.url : null,
    }];
  }).sort((first, second) => second.time - first.time);

  return { source: "USGS", generated, period, events };
}
