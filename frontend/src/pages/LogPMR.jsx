import { useEffect, useState } from "react";
import { getStoredUser } from "../services/authService";
import { fetchPmrReports } from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import ErrorAlert from "../components/ErrorAlert";

// Icons
import StorageIcon from "@mui/icons-material/Storage";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function LogPMR() {
  const [user] = useState(() => getStoredUser());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPmrReports({
        area: user?.role === 'officer' ? user?.area : null,
        role: user?.role,
        user_id: user?.id
      });
      setReports(data);
    } catch (err) {
      const message = err.message || "The server returned an unexpected response. Please try again later.";
      setError(message);
      showNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <Toast
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
      />

      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                PMR / <span className="text-blue-600">LOG HISTORY</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Riwayat Preventive Maintenance
              </h1>
            </div>
            <button 
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <HistoryIcon sx={{ fontSize: 16 }} /> REFRESH
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <ErrorAlert message={error} onRetry={loadData} />
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">WAKTU</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PERANGKAT</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TEKNISI</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TINDAKAN</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-bold animate-pulse">
                        Memuat riwayat maintenance...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <HistoryIcon sx={{ fontSize: 48 }} className="text-slate-200" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada riwayat PMR</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-900">
                            {new Date(report.maintenance_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                            Sub: {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <StorageIcon sx={{ fontSize: 16 }} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{report.device_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{report.device_code} · {report.device_sto}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black">
                              {report.technician_name.charAt(0)}
                            </div>
                            <p className="text-xs font-bold text-slate-700">{report.technician_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            report.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-slate-600 line-clamp-1 max-w-[200px]" title={report.action}>
                            {report.action}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm" title="Lihat Detail">
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm" title="Download PDF">
                              <FileDownloadIcon sx={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
