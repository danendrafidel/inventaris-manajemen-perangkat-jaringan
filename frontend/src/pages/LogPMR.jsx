import Sidebar from "../components/Sidebar";

export default function LogPMR() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 md:hidden" />
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                Pages / <span className="text-blue-600">Log PMR</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Log Preventive Maintenance
              </h1>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Halaman Log PMR sedang dalam pengembangan
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
