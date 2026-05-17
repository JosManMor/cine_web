export const C = {
  bg: "#221F1F",
  surface: "#282424",
  card: "#2F2F2F",
  border: "#504C4C",
  red: "#E50914",
  redDark: "#B0060F",
  redGlow: "rgba(229,9,20,0.18)",
  green: "#46D369",
  greenDim: "rgba(70,211,105,0.15)",
  white: "#FFFFFF",
  gray: "#B3B3B3",
  grayDark: "#6B6B6B",
  grayDarker: "#3D3939",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500&family=Roboto:wght@400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${C.bg}; color: ${C.white}; font-family: 'Open Sans', 'Roboto', sans-serif; overflow-x: hidden; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.bg}; }
::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }

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
.hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.6); }

input, select { background: ${C.card}; border: 1px solid ${C.border}; color: ${C.white}; font-family: 'Open Sans', sans-serif; font-size: 14px; padding: 10px 14px; border-radius: 4px; width: 100%; outline: none; transition: border-color .2s; }
input:focus, select:focus { border-color: ${C.red}; }
input::placeholder { color: ${C.grayDark}; }
label { font-size: 13px; color: ${C.gray}; margin-bottom: 5px; display: block; font-family: 'Open Sans', sans-serif; }
`;
