export const C = {
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  card: "var(--c-card)",
  border: "var(--c-border)",
  red: "var(--c-red)",
  redDark: "var(--c-redDark)",
  redGlow: "var(--c-redGlow)",
  green: "var(--c-green)",
  greenDim: "var(--c-greenDim)",
  white: "var(--c-white)",
  gray: "var(--c-gray)",
  grayDark: "var(--c-grayDark)",
  grayDarker: "var(--c-grayDarker)",
  greenGlow: "var(--c-greenGlow)",
  shadow: "var(--c-shadow)",
  navBg: "var(--c-navBg)",
  navBorder: "var(--c-navBorder)",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500&family=Roboto:wght@400;500&display=swap');

:root {
  --c-bg: #221F1F;
  --c-surface: #282424;
  --c-card: #2F2F2F;
  --c-border: #504C4C;
  --c-red: #E50914;
  --c-redDark: #B0060F;
  --c-redGlow: rgba(229, 9, 20, 0.18);
  --c-green: #46D369;
  --c-greenDim: rgba(70, 211, 105, 0.15);
  --c-greenGlow: rgba(70, 211, 105, 0.135);
  --c-white: #FFFFFF;
  --c-gray: #B3B3B3;
  --c-grayDark: #6B6B6B;
  --c-grayDarker: #3D3939;
  --c-shadow: rgba(0, 0, 0, 0.5);
  --c-navBg: rgba(10,10,10,0.82);
  --c-navBorder: transparent;
}

html[data-theme="light"] {
  --c-bg: #F5F5F7;
  --c-surface: #FFFFFF;
  --c-card: #FFFFFF;
  --c-border: #E5E5EA;
  --c-red: #E50914;
  --c-redDark: #B0060F;
  --c-redGlow: rgba(229, 9, 20, 0.08);
  --c-green: #2E7D32;
  --c-greenDim: rgba(46, 125, 50, 0.12);
  --c-greenGlow: rgba(46, 125, 50, 0.1);
  --c-white: #1C1C1E;
  --c-gray: #4A4A4F;
  --c-grayDark: #8E8E93;
  --c-grayDarker: #F2F2F7;
  --c-shadow: rgba(0, 0, 0, 0.08);
  --c-navBg: #FFFFFF;
  --c-navBorder: #E5E5EA;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body, nav, aside, div, p, span, button, input, select, a {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}
body { background: var(--c-bg); color: var(--c-white); font-family: 'Open Sans', 'Roboto', sans-serif; overflow-x: hidden; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--c-bg); }
::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes shimmer  { 0%,100% { opacity:.5; } 50% { opacity:1; } }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
@keyframes ticketSlide { from { opacity:0; transform:scale(.94) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes popIn    { 0% { transform:scale(.8); opacity:0; } 60% { transform:scale(1.05); } 100% { transform:scale(1); opacity:1; } }
@keyframes toastIn  { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }

.fade-up   { animation: fadeUp .5s ease forwards; }
.fade-in   { animation: fadeIn .4s ease forwards; }
.ticket-in { animation: ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards; }
.pop-in    { animation: popIn .35s cubic-bezier(.22,.68,0,1.2) forwards; }

.hover-scale { transition: transform .2s; }
.hover-scale:hover { transform: scale(1.03); }
.hover-lift  { transition: transform .2s, box-shadow .2s; }
.hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px var(--c-shadow); }

input, select { background: var(--c-card); border: 1px solid var(--c-border); color: var(--c-white); font-family: 'Open Sans', sans-serif; font-size: 14px; padding: 10px 14px; border-radius: 4px; width: 100%; outline: none; transition: border-color .2s, background-color 0.3s ease, color 0.3s ease; }
input:focus, select:focus { border-color: var(--c-red); }
input::placeholder { color: var(--c-grayDark); }
label { font-size: 13px; color: var(--c-gray); margin-bottom: 5px; display: block; font-family: 'Open Sans', sans-serif; }
`;
