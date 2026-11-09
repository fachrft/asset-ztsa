import "server-only";

const feeds = {
  day: "2.5_day.geojson",
  week: "2.5_week.geojson",
};

export function isFeedPeriod(period) {
  return Object.hasOwn(feeds, period);
}

export async function readEarthquakes(period) {
  const response = await fetch(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feeds[period]}`,
    { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`USGS returned HTTP ${response.status}`);

  const feed = await response.json();
  if (!Array.isArray(feed.features) || !Number.isFinite(feed.metadata?.generated)) {
    throw new Error("Unexpected USGS feed format");
  }

  const events = feed.features.flatMap(({ id, properties, geometry }) => {
    const [longitude, latitude, depth] = geometry?.coordinates ?? [];
    if (
      properties?.type !== "earthquake" ||
      ![properties.mag, properties.time, longitude, latitude, depth].every(Number.isFinite)
    ) return [];

    return [{
      id,
      place: properties.place || "Unknown location",
      magnitude: properties.mag,
      time: properties.time,
      longitude,
      latitude,
      depth,
      status: properties.status,
      url: properties.url?.startsWith("https://earthquake.usgs.gov/") ? properties.url : null,
    }];
  }).sort((first, second) => second.time - first.time);

  return { source: "USGS", generated: feed.metadata.generated, period, events };
}
