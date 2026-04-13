// Barcode SVG Component
export default function Barcode({ value }) {
  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-inner">
      <svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="transparent" />
        {[...Array(50)].map((_, i) => (
          <rect
            key={i}
            x={10 + i * 3.8}
            y="5"
            width={i % 3 === 0 ? "2.5" : i % 5 === 0 ? "1" : "1.5"}
            height="40"
            fill="black"
          />
        ))}
      </svg>
      <span className="text-[10px] font-black font-mono mt-2 text-slate-900 tracking-widest">{value || 'NO-SERIAL'}</span>
    </div>
  )
}
