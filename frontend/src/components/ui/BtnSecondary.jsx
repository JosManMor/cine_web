import { C } from "../../constants/theme";

export default function BtnSecondary({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: C.card, color: C.white,
      border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 20px",
      fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 13,
      cursor: "pointer", transition: "background .2s",
      letterSpacing: ".5px", textTransform: "uppercase", ...style
    }}
      onMouseEnter={e => (e.target.style.background = C.redGlow)}
      onMouseLeave={e => (e.target.style.background = C.card)}
    >{children}</button>
  );
}
