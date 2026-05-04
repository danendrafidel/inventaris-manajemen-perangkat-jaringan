import { QRCodeSVG } from 'qrcode.react';

const QRCode = ({ value, size = 128 }) => {
  const scanUrl = `${window.location.origin}/scan/${encodeURIComponent(value)}`;
  return (
    <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-100">
      <QRCodeSVG 
        value={scanUrl} 
        size={size}
        level="H" 
        includeMargin={false}
      />
    </div>
  );
};

export default QRCode;
