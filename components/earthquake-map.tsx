"use client";

import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/land-110m.json";
import type { Earthquake } from "../lib/earthquakes";

const projection = geoEquirectangular()
  .scale(142)
  .translate([480, 230]);
const path = geoPath(projection);
const topology = world as unknown as Parameters<typeof feature>[0];
const land = path(feature(topology, topology.objects.land)) ?? undefined;
const grid = path(geoGraticule10()) ?? undefined;

export function magnitudeBand(magnitude: number) {
  if (magnitude >= 6) return "high";
  if (magnitude >= 4.5) return "medium";
  return "low";
}

type MapProps = {
  events: Earthquake[];
  selected?: string;
  onSelect: (id: string) => void;
};

export default function EarthquakeMap({ events, selected, onSelect }: MapProps) {
  return (
    <svg viewBox="0 0 960 460" className="world-map" role="group" aria-label="Earthquake epicenter map">
      <rect width="960" height="460" className="map-ocean" />
      <path d={grid} className="map-grid" />
      <path d={land} className="map-land" />
      <path d="M0 230H960M480 0V460" className="map-axis" />
      <text x="15" y="224" className="map-coord">0°</text>
      <text x="486" y="18" className="map-coord">0° E</text>
      {[...events].reverse().map((event) => {
        const position = projection([event.longitude, event.latitude]);
        if (!position) return null;
        const [x, y] = position;
        const active = selected === event.id;
        const radius = 3 + Math.max(0, event.magnitude - 2.5) * 1.7;
        return (
          <g key={event.id} transform={`translate(${x},${y})`}
            className={`map-marker ${magnitudeBand(event.magnitude)}`}
            onClick={() => onSelect(event.id)}
            aria-hidden="true">
            <title>{`M ${event.magnitude.toFixed(1)} · ${event.place}`}</title>
            <circle r={Math.max(9, radius)} fill="transparent" />
            <circle r={radius + (active ? 6 : 2)} className={active ? "marker-active" : "marker-halo"} />
            <circle r={radius} className="marker-dot" />
          </g>
        );
      })}
    </svg>
  );
}
