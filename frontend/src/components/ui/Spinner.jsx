import { C } from "../../constants/theme";

export default function Spinner() {
  return (
    <div style={{
      width: 28, height: 28,
      border: `2px solid ${C.border}`,
      borderTopColor: C.red,
      borderRadius: "50%",
      animation: "spin .8s linear infinite"
    }} />
  );
}
