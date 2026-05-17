import { C } from "../../constants/theme";

export default function BtnPrimary({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.grayDarker : C.red,
      color: disabled ? C.grayDark : C.white,
      border: "none", borderRadius: 4, padding: "11px 20px",
      fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background .2s, transform .15s",
      letterSpacing: ".5px", textTransform: "uppercase", ...style
    }}
      onMouseEnter={e => !disabled && (e.target.style.background = C.redDark)}
      onMouseLeave={e => !disabled && (e.target.style.background = C.red)}
      onMouseDown={e => !disabled && (e.target.style.transform = "scale(.97)")}
      onMouseUp={e => !disabled && (e.target.style.transform = "scale(1)")}
    >{children}</button>
  );
}
