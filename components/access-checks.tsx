"use client";

import { Activity, ArrowDownToLine, CircleCheck, CircleX, Clock, Database, Play, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

type Check = {
  title: string;
  method: "GET" | "POST";
  path: string;
  icon: LucideIcon;
  description: string;
  valid: (body: Record<string, unknown>, nonce: string) => boolean;
};

type CheckResult = { ok: boolean; message: string };

const checks: Check[] = [
  { title: "App health", method: "GET", path: "/api/health", icon: Activity,
    description: "Confirms the browser can reach the app server.", valid: (body) => body.service === "seismic-desk" && body.status === "ok" },
  { title: "USGS feed", method: "GET", path: "/api/earthquakes", icon: Database,
    description: "Confirms the app can retrieve and return upstream data.", valid: (body) => body.source === "USGS" && Array.isArray(body.events) },
  { title: "JSON round trip", method: "POST", path: "/api/probe", icon: Send,
    description: "Sends a generated nonce and checks the returned value.", valid: (body, nonce) => body.status === "ok" && body.nonce === nonce },
];

async function runCheck(check: Check): Promise<CheckResult> {
  const start = performance.now();
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let status: string | undefined;
  try {
    const response = await fetch(check.path, {
      method: check.method,
      signal: AbortSignal.timeout(12000),
      ...(check.method === "POST" ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce }),
      } : {}),
    });
    status = `HTTP ${response.status}`;
    if (response.redirected) return { ok: false, message: `${status} · Unexpected redirect` };
    if (!response.ok) return { ok: false, message: status };
    if (!response.headers.get("content-type")?.includes("application/json")) {
      return { ok: false, message: `${status} · Expected JSON` };
    }
    const body: unknown = await response.json();
    const ok = typeof body === "object" && body !== null &&
      check.valid(body as Record<string, unknown>, nonce);
    return { ok, message: ok ? `${status} · ${Math.round(performance.now() - start)} ms` : `${status} · Unexpected response` };
  } catch {
    return { ok: false, message: status ? `${status} · Unreadable response` : "Request failed or timed out" };
  }
}

export default function AccessChecks() {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setResults(null);
    setResults(await Promise.all(checks.map(runCheck)));
    setRunning(false);
  }

  return (
    <section className="panel diagnostics" aria-labelledby="checks-title">
      <div className="panel-head events-head">
        <div><h2 id="checks-title">Connection checks</h2><p>Requests use the same origin as this page.</p></div>
        <button className="button primary" onClick={run} disabled={running}>
          <Play size={16} />{running ? "Running…" : "Run checks"}
        </button>
      </div>
      <div className="check-list" aria-live="polite">
        {checks.map((check, index) => {
          const result = results?.[index];
          const Icon = check.icon;
          const Status = result ? result.ok ? CircleCheck : CircleX : Clock;
          return (
            <div className="check-row" key={check.title}>
              <span className="panel-icon"><Icon size={19} /></span>
              <div className="check-detail">
                <h3>{check.title}</h3>
                <code>{check.method} {check.path}</code>
                <p>{check.description}</p>
              </div>
              <span className={`check-status ${result ? result.ok ? "passed" : "failed" : ""}`}>
                <Status size={16} />{result?.message ?? (running ? "Checking…" : "Ready")}
              </span>
            </div>
          );
        })}
      </div>
      <div className="diagnostics-footer">
        <div><strong>File download</strong><p>Verify that the last 24 hours of events can be downloaded through this route.</p></div>
        <a className="button" href="/api/earthquakes?format=csv"><ArrowDownToLine size={16} /> Download CSV</a>
      </div>
    </section>
  );
}
