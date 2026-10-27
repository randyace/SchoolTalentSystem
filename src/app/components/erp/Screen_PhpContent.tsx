// ─────────────────────────────────────────────────────────────────────────────
// Host for legacy CI4 HTML fragments inside Frame02_AppShell.
// Loads Bootstrap (and optional jQuery plugins); never invents a second shell.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from "react";

export type PhpContentAssets = {
  datatables?: boolean;
  select2?: boolean;
};

type Props = {
  html: string;
  flashSuccess?: string;
  flashError?: string;
  assets?: PhpContentAssets;
};

const CDN = {
  bootstrapCss: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  bootstrapJs: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  jquery: "https://code.jquery.com/jquery-3.7.1.min.js",
  dtCss: "https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css",
  dtJquery: "https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js",
  dtBs: "https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js",
  select2Css: "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css",
  select2Theme: "https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css",
  select2Js: "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js",
};

function ensureLink(href: string, id: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if ((existing as any).dataset.loaded === "1") return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed ${src}`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = false;
    s.onload = () => {
      (s as any).dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed ${src}`));
    document.body.appendChild(s);
  });
}

async function ensureAssets(assets?: PhpContentAssets) {
  ensureLink(CDN.bootstrapCss, "sts-php-bootstrap-css");
  await loadScript(CDN.jquery, "sts-php-jquery");
  await loadScript(CDN.bootstrapJs, "sts-php-bootstrap-js");

  if (assets?.datatables) {
    ensureLink(CDN.dtCss, "sts-php-dt-css");
    await loadScript(CDN.dtJquery, "sts-php-dt-jquery");
    await loadScript(CDN.dtBs, "sts-php-dt-bs");
  }
  if (assets?.select2) {
    ensureLink(CDN.select2Css, "sts-php-select2-css");
    ensureLink(CDN.select2Theme, "sts-php-select2-theme");
    await loadScript(CDN.select2Js, "sts-php-select2-js");
  }
}

/** Re-run <script> tags after innerHTML injection (browser skips them otherwise). */
async function hydrateScripts(host: HTMLElement) {
  const nodes = Array.from(host.querySelectorAll("script"));
  for (const old of nodes) {
    const src = old.getAttribute("src");
    if (src) {
      await loadScript(src, `sts-php-inline-${btoa(src).slice(0, 24)}`);
      old.remove();
      continue;
    }
    const s = document.createElement("script");
    s.textContent = old.textContent || "";
    old.replaceWith(s);
  }
}

export const Screen_PhpContent: React.FC<Props> = ({
  html,
  flashSuccess,
  flashError,
  assets,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAssets(assets);
        if (cancelled) return;
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Asset load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assets?.datatables, assets?.select2]);

  useEffect(() => {
    if (!ready || !hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = html;
    void hydrateScripts(host);
  }, [ready, html]);

  return (
    <div style={{ padding: "24px 28px 48px", maxWidth: 1400, margin: "0 auto" }}>
      <style>{`
        .sts-card {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(15,23,42,.04);
        }
      `}</style>

      {flashSuccess ? (
        <div className="alert alert-success" role="alert" style={{ marginBottom: 16 }}>
          {flashSuccess}
        </div>
      ) : null}
      {flashError ? (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
          {flashError}
        </div>
      ) : null}
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {!ready ? (
        <div className="text-muted small">載入表單資源…</div>
      ) : (
        <div ref={hostRef} />
      )}
    </div>
  );
};
