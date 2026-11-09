import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import AccessChecks from "../../components/access-checks";
import { Footer, Header } from "../../components/shell";

export const metadata: Metadata = { title: "Access lab | Seismic Desk" };

export default function Lab() {
  return (
    <>
      <Header lab />
      <main className="wrap main lab-main">
        <div className="hero">
          <div>
            <div className="eyebrow"><span /> 02 / PRIVATE ACCESS LAB</div>
            <h1>Access diagnostics<span>.</span></h1>
            <p>Check what reaches the app through your current access path.</p>
          </div>
          <span className="panel-icon lab-hero-icon"><ShieldCheck size={27} /></span>
        </div>
        <AccessChecks />
        <section className="panel lab-guide" aria-labelledby="guide-title">
          <h2 id="guide-title">Validate the policy in Vision One</h2>
          <ol>
            <li>Open this app through your configured ZTSA access path using an allowed test identity. Run the checks and download the CSV.</li>
            <li>Repeat with an identity or device that your policy should deny. Verify the outcome in the Vision One access logs.</li>
            <li>If App health passes and USGS feed fails, check outbound DNS and HTTPS from the app host.</li>
          </ol>
          <p>The checks measure application requests from this browser. The access logs show the policy decision.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
