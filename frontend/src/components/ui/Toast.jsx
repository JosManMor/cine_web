import { C } from "../../constants/theme";

export default function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "success" ? C.green : t.type === "error" ? C.red : C.card,
          color: t.type === "success" ? "#0A2A12" : t.type === "error" ? "#FFFFFF" : C.white,
          padding: "12px 18px", borderRadius: 6, fontSize: 13,
          fontFamily: "'Open Sans', sans-serif", fontWeight: 500,
          animation: "toastIn .3s ease", minWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,.5)"
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
