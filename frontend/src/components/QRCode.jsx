import { QRCodeSVG } from "qrcode.react";

export default function QRCode({ code, size = 126 }) {
  return (
    <QRCodeSVG
      value={code}
      size={size}
      bgColor="#FFFFFF"
      fgColor="#000000"
      level="M"
    />
  );
}
