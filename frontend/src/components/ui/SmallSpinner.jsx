import { C } from "../../constants/theme";

/** Spinner circular pequeño — para cargas dentro de contenido */
export default function SmallSpinner() {
  return (
    <div style={{
      width: 28, height: 28,
      border: `2px solid ${C.border}`,
      borderTopColor: C.red,
      borderRadius: "50%",
      animation: "spin .8s linear infinite",
      flexShrink: 0,
    }} />
  );
}
