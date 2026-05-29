import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Pathfinder AI | Career Strategy Platform",
  description: "Industry-standard career benchmarking and personalized upskilling roadmaps powered by Gemini AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="app-nav">
          <div className="nav-container">
            <Link href="/" className="brand-logo">
              <div className="brand-dot"></div>
              <span>PATHFINDER AI</span>
            </Link>
            <nav className="nav-links">
              <Link href="/" className="nav-link">Dashboard</Link>
              <Link href="/skills" className="nav-link">Skill Matrix</Link>
              <Link href="/roadmap" className="nav-link">Career Path</Link>
            </nav>
            <div style={{ visibility: "hidden" }} className="brand-dot"></div>
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
