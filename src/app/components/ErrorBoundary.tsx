import React from "react";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

/**
 * Catches unexpected render errors so the SPA never dies as a blank white #root.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[STS ErrorBoundary]", error, info?.componentStack);
  }

  private reload = () => {
    this.setState({ error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const title = this.props.title || "頁面載入發生錯誤";
    const message = this.state.error?.message || "Unknown error";

    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily:
            '"PingFang HK","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
          background: "#F8FAFC",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "28px 24px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#FEF2F2",
              color: "#DC2626",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            !
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
            {title}
          </h2>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
            系統遇到未預期的元件錯誤。您的資料未遺失，請重新載入頁面。
          </p>
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 11,
              color: "#94A3B8",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
          <button
            type="button"
            onClick={this.reload}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1A56DB",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
