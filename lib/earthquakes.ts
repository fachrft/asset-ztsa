export type FeedPeriod = "day" | "week";

export type Earthquake = {
  id: string;
  place: string;
  magnitude: number;
  time: number;
  longitude: number;
  latitude: number;
  depth: number;
  status?: string;
  url: string | null;
};

export type EarthquakeFeed = {
  source: "USGS";
  generated: number;
  period: FeedPeriod;
  events: Earthquake[];
};
