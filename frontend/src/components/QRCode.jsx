import { C } from "../constants/theme";

function generateQRPattern(code) {
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 21;
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const isFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      if (isFinder) { row.push(1); continue; }
      row.push((seed * (r + 1) * (c + 1) + r * 17 + c * 13) % 3 === 0 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

export default function QRCode({ code }) {
  const grid = generateQRPattern(code);
  const size = 21;
  const cell = 6;
  return (
    <svg width={size * cell} height={size * cell} style={{ display: "block" }}>
      {grid.map((row, r) => row.map((on, c) => on
        ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={C.white} />
        : null
      ))}
    </svg>
  );
}
