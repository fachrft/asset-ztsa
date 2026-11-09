"use client";

import {
  Activity, ArrowDownToLine, ArrowUpRight, ChevronLeft, ChevronRight, Clock,
  Crosshair, Earth, Layers, Radio, RefreshCw, Search, TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import EarthquakeMap, { magnitudeBand } from "./earthquake-map";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const number = new Intl.NumberFormat("en");
const pageSize = 8;

function Metric({ icon: Icon, label, value, unit, note, tone }) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-label"><span className="metric-icon"><Icon size={17} /></span>{label}</div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className="muted metric-note">{note}</div>
    </article>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("day");
  const [threshold, setThreshold] = useState("2.5");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/earthquakes?period=${period}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        if (!Array.isArray(body.events)) throw new Error();
        if (!controller.signal.aborted) setResult({ period, refresh, data: body });
      } catch {
        if (!controller.signal.aborted) setResult({ period, refresh, error: true });
      }
    }
    load();
    return () => controller.abort();
  }, [period, refresh]);

  const current = result?.period === period && result.refresh === refresh ? result : null;
  const data = current?.data;
  const events = data?.events ?? [];
  const search = query.trim().toLowerCase();
  const filtered = events.filter((event) =>
    event.magnitude >= Number(threshold) && event.place.toLowerCase().includes(search),
  );
  const focused = filtered.find((event) => event.id === selected) ?? filtered[0];
  const strongest = events.reduce((top, event) => !top || event.magnitude > top.magnitude ? event : top, null);
  const averageDepth = events.length ? events.reduce((sum, event) => sum + event.depth, 0) / events.length : null;
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const visiblePage = Math.min(page, lastPage);
  const rows = filtered.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  const csvUrl = `/api/earthquakes?period=${period}&format=csv`;

  function changePeriod(nextPeriod) {
    setPeriod(nextPeriod);
    setPage(0);
    setSelected(null);
  }

  return (
    <main className="wrap main">
      <div className="hero">
        <div>
          <div className="eyebrow"><span /> GLOBAL SEISMIC ACTIVITY</div>
          <h1>Earthquake monitor<span>.</span></h1>
          <p>Explore recent seismic events around the globe from the USGS catalog.</p>
        </div>
        <div className="hero-actions">
          <div className="feed-status" role="status">
            <i className={data ? "online" : current?.error ? "offline" : ""} />
            {data ? `USGS · ${clock.format(data.generated)} UTC` : current?.error ? "Feed unavailable" : "Connecting to USGS"}
          </div>
          <button type="button" className="button refresh-button"
            onClick={() => setRefresh((count) => count + 1)} disabled={!current}>
            <RefreshCw size={16} className={!current ? "spin" : undefined} /> Refresh
          </button>
        </div>
      </div>

      <div className="control-bar">
        <div className="segment" aria-label="Feed time range">
          <Clock size={16} />
          <button aria-pressed={period === "day"} onClick={() => changePeriod("day")}>24 hours</button>
          <button aria-pressed={period === "week"} onClick={() => changePeriod("week")}>7 days</button>
        </div>
        <a href={csvUrl} className="button export-button"><ArrowDownToLine size={16} /> Export CSV</a>
      </div>

      {current?.error && (
        <div className="notice" role="alert">
          <TriangleAlert size={19} />
          <span><strong>USGS data couldn’t be loaded.</strong> Refresh to retry, or check the upstream connection in Access lab.</span>
        </div>
      )}

      <section aria-label="Feed summary" className="metrics">
        <Metric icon={Activity} label="Recorded events" value={data ? number.format(events.length) : "—"}
          note="Earthquakes of M2.5 and above" tone="mint" />
        <Metric icon={Radio} label="Peak magnitude" value={strongest?.magnitude.toFixed(1) ?? "—"}
          unit={strongest ? "M" : ""} note={strongest?.place ?? "Strongest event in this window"} tone="amber" />
        <Metric icon={Layers} label="Average depth" value={averageDepth?.toFixed(1) ?? "—"}
          unit={averageDepth === null ? "" : "km"} note="Below the Earth’s surface" tone="blue" />
      </section>

      <section aria-labelledby="map-title" className="panel map-panel">
        <div className="panel-head">
          <div className="panel-title">
            <span className="panel-icon"><Earth size={20} /></span>
            <div><h2 id="map-title">Epicenter map</h2><p>Select a marker or an event below to inspect it.</p></div>
          </div>
          <div className="legend" aria-label="Magnitude color legend">
            <span className="low"><i />2.5–4.4</span>
            <span className="medium"><i />4.5–5.9</span>
            <span className="high"><i />6.0+</span>
          </div>
        </div>
        <div className="map-layout">
          <div className="map-canvas">
            <EarthquakeMap events={filtered} selected={focused?.id} onSelect={setSelected} />
            <span className="map-label"><Crosshair size={13} /> GLOBAL VIEW</span>
          </div>
          <aside className="event-focus" aria-label="Selected earthquake" aria-live="polite">
            <span className="eyebrow"><Crosshair size={14} /> SELECTED EVENT</span>
            {focused ? (
              <>
                <div className={`focus-magnitude ${magnitudeBand(focused.magnitude)}`}>
                  <small>M</small>{focused.magnitude.toFixed(1)}
                </div>
                <h3>{focused.place}</h3>
                <dl>
                  <div><dt>Occurred</dt><dd>{dateTime.format(focused.time)} UTC</dd></div>
                  <div><dt>Depth</dt><dd>{focused.depth.toFixed(1)} km</dd></div>
                </dl>
                {focused.url && (
                  <a href={focused.url} target="_blank" rel="noreferrer">
                    USGS event report <ArrowUpRight size={14} />
                  </a>
                )}
              </>
            ) : <p className="muted">{!current ? "Loading events…" : "No event selected."}</p>}
          </aside>
        </div>
      </section>

      <section aria-labelledby="events-title" className="panel events-panel">
        <div className="panel-head events-head">
          <div className="panel-title">
            <span className="panel-icon"><Activity size={20} /></span>
            <div><h2 id="events-title">Recent events</h2><p>Latest first · all times in UTC</p></div>
          </div>
          <div className="event-filters">
            <label className="search">
              <Search size={16} />
              <input placeholder="Search location" aria-label="Search location" value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
            </label>
            <select aria-label="Minimum magnitude" value={threshold}
              onChange={(event) => { setThreshold(event.target.value); setPage(0); }}>
              <option value="2.5">M 2.5+</option>
              <option value="4.5">M 4.5+</option>
              <option value="6">M 6.0+</option>
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Magnitude</th><th>Location</th><th>Depth</th><th>Occurred (UTC)</th></tr></thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className={event.id === focused?.id ? "selected-row" : undefined}>
                  <td><span className={`magnitude-pill ${magnitudeBand(event.magnitude)}`}>{event.magnitude.toFixed(1)}</span></td>
                  <td><button className="event-name" aria-pressed={event.id === focused?.id}
                    onClick={() => setSelected(event.id)}>{event.place}</button></td>
                  <td>{event.depth.toFixed(1)} km</td>
                  <td>{dateTime.format(event.time)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="empty">
                {!current ? "Loading the latest earthquakes…" : current.error ? "The feed is unavailable." : "No earthquakes match your filters."}
              </td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>{number.format(filtered.length)} {filtered.length === 1 ? "event" : "events"}</span>
          <div>
            <button className="button icon-button" aria-label="Previous page" disabled={visiblePage === 0}
              onClick={() => setPage(visiblePage - 1)}><ChevronLeft size={17} /></button>
            <span>{visiblePage + 1} / {lastPage + 1}</span>
            <button className="button icon-button" aria-label="Next page" disabled={visiblePage === lastPage}
              onClick={() => setPage(visiblePage + 1)}><ChevronRight size={17} /></button>
          </div>
        </div>
      </section>
    </main>
  );
}
