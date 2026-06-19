import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="page-shell" aria-labelledby="site-title">
      <section className="intro">
        <p className="eyebrow">SAKET LABS</p>
        <h1 id="site-title">Building software, AI experiments, and useful tools.</h1>

        <p className="coming-soon">
          Portfolio, projects, photography, and technical writings coming soon.
        </p>

        <nav className="links" aria-label="Social links">
          <a href="https://github.com/sakkket" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/sakket-kumar/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </nav>
      </section>

      <footer>© 2026 Saket Kumar</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
