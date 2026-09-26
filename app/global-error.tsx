"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es-CO">
      <body style={{ fontFamily: "system-ui", background: "#F7F4EF", color: "#111", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div>
          <h1 style={{ fontWeight: 400 }}>Algo no salió como esperábamos.</h1>
          <button onClick={reset} style={{ marginTop: 24, padding: "14px 28px", borderRadius: 999, background: "#111", color: "#F7F4EF", border: 0, cursor: "pointer" }}>
            Intentar nuevamente
          </button>
        </div>
      </body>
    </html>
  );
}
