import { Activity, ArrowUpRight, Earth, FlaskConical } from "lucide-react";
import Link from "next/link";

export function Header({ lab = false }: { lab?: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand">
          <span className="brand-icon"><Activity size={23} /></span>
          <span>Seismic<span className="brand-accent">Desk</span><small>MONITORING CONSOLE</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/" aria-current={lab ? undefined : "page"}>
            <Earth size={16} /> Overview
          </Link>
          <Link href="/lab" aria-current={lab ? "page" : undefined}>
            <FlaskConical size={16} /> Access lab
          </Link>
        </nav>
        <span className="workspace-label"><span /> PRIVATE ACCESS LAB</span>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="wrap site-footer">
      <span><Activity size={15} /> SeismicDesk <span className="footer-divider">/</span> ZTSA lab application</span>
      <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noreferrer">
        Data by U.S. Geological Survey <ArrowUpRight size={13} />
      </a>
    </footer>
  );
}
