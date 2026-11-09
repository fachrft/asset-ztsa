"use client";

import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/land-110m.json";

const projection = geoEquirectangular()
  .scale(142)
  .translate([480, 230]);
const path = geoPath(projection);
const land = path(feature(world, world.objects.land));
const grid = path(geoGraticule10());

export function magnitudeBand(magnitude) {
  if (magnitude >= 6) return "high";
  if (magnitude >= 4.5) return "medium";
  return "low";
}

export default function EarthquakeMap({ events, selected, onSelect }) {
  return (
    <svg viewBox="0 0 960 460" className="world-map" role="group" aria-label="Earthquake epicenter map">
      <defs>
        <radialGradient id="ocean">
          <stop stopColor="#142735" />
          <stop offset="1" stopColor="#0b131f" />
        </radialGradient>
      </defs>
      <rect width="960" height="460" fill="url(#ocean)" />
      <path d={grid} className="map-grid" />
      <path d={land} className="map-land" />
      <path d="M0 230H960M480 0V460" className="map-axis" />
      <text x="15" y="224" className="map-coord">0°</text>
      <text x="486" y="18" className="map-coord">0° E</text>
      {[...events].reverse().map((event) => {
        const [x, y] = projection([event.longitude, event.latitude]);
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
