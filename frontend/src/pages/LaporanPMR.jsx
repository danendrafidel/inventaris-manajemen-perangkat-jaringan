import { useEffect, useState, useMemo } from "react";
import { getStoredUser } from "../services/authService";
import { fetchPmrReports, fetchInventoryOptions } from "../services/inventoryService";
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
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import InventoryIcon from "@mui/icons-material/Inventory";
import VerifiedIcon from "@mui/icons-material/Verified";
import BoltIcon from "@mui/icons-material/Bolt";
import PublicIcon from "@mui/icons-material/Public";
import RouterIcon from "@mui/icons-material/Router";

export default function LaporanPMR() {
  const [user] = useState(() => getStoredUser());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [options, setOptions] = useState({
    areas: [],
    stos: [],
  });

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState({
    area_id: "",
    sto_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    area_id: "",
    sto_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const role = user?.role;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPmrReports({
        area_id: role !== 'admin' ? user?.area_id : (filters.area_id || null),
        role: role,
        user_id: user?.id,
        search,
        sto_id: filters.sto_id,
        status: filters.status,
        start_date: filters.start_date,
        end_date: filters.end_date
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

  const loadOptions = async () => {
    try {
      const data = await fetchInventoryOptions({ role, email: user?.email });
      setOptions({
        areas: data.areas || [],
        stos: data.stos || [],
      });
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, search]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      normal: reports.filter(r => r.status === 'Baik').length,
      perhatian: reports.filter(r => r.status === 'Perlu Perbaikan' || r.status === 'Rusak').length,
      teknisi: new Set(reports.map(r => r.user_id)).size
    };
  }, [reports]);

  const filteredStosForDraft = useMemo(() => {
    const targetAreaId = role !== 'admin' ? user?.area_id : draftFilters.area_id;
    if (!targetAreaId) return options.stos;
    return options.stos.filter((s) => s.area_id == targetAreaId);
  }, [options.stos, draftFilters.area_id, user?.area_id, role]);

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "area_id") next.sto_id = "";
      return next;
    });
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setSearch(draftSearch);
  };

  const handleResetFilters = () => {
    const initial = {
      area_id: role !== 'admin' ? user?.area_id : "",
      sto_id: "",
      status: "",
      start_date: "",
      end_date: "",
    };
    setDraftFilters(initial);
    setFilters(initial);
    setSearch("");
    setDraftSearch("");
  };

  const setStatusFilter = (status) => {
    const nextFilters = { ...filters, status };
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
  };

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
                PMR / <span className="text-blue-600">LAPORAN</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Laporan Preventive Maintenance
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
          
          {/* Stats Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              {
                title: "TOTAL LAPORAN",
                value: stats.total,
                icon: <HistoryIcon />,
                color: "bg-blue-600",
                onClick: () => handleResetFilters()
              },
              {
                title: "STATUS BAIK",
                value: stats.normal,
                icon: <VerifiedIcon />,
                color: "bg-emerald-500",
                onClick: () => setStatusFilter("Baik")
              },
              {
                title: "PERLU ATENSI",
                value: stats.perhatian,
                icon: <BoltIcon />,
                color: "bg-amber-500",
                onClick: () => setStatusFilter("Perlu Perbaikan")
              },
              {
                title: "TOTAL TEKNISI",
                value: stats.teknisi,
                icon: <PersonIcon />,
                color: "bg-indigo-500",
                onClick: null
              },
            ].map((c, i) => (
              <div
                key={i}
                onClick={c.onClick}
                className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${c.onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                      {c.title}
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {c.value}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-lg ${c.color} text-white`}
                  >
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Filter Bar */}
          <section className="bg-white rounded-3xl md:rounded-4xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
                <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg md:text-xl">
                  <SearchIcon />
                </span>
                <input
                  className="bg-transparent outline-none text-xs md:text-sm font-bold w-full text-slate-700 placeholder:text-slate-400"
                  placeholder="Cari Teknisi atau Perangkat..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">Tgl Awal</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all"
                    value={draftFilters.start_date}
                    onChange={(e) => handleDraftFilterChange("start_date", e.target.value)}
                  />
                </div>
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">Tgl Akhir</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all"
                    value={draftFilters.end_date}
                    onChange={(e) => handleDraftFilterChange("end_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-center gap-3 flex-1">
                <select
                  className={`w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all appearance-none pr-10 ${
                    role !== "admin"
                      ? "opacity-50 cursor-not-allowed bg-slate-100"
                      : "cursor-pointer"
                  }`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={role !== "admin" ? user.area_id : draftFilters.area_id}
                  disabled={role !== "admin"}
                  onChange={(e) =>
                    handleDraftFilterChange("area_id", e.target.value)
                  }
                >
                  <option value="">Semua Area</option>
                  {options.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all cursor-pointer appearance-none pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={draftFilters.sto_id}
                  onChange={(e) =>
                    handleDraftFilterChange("sto_id", e.target.value)
                  }
                >
                  <option value="">Semua STO</option>
                  {filteredStosForDraft.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all cursor-pointer appearance-none pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={draftFilters.status}
                  onChange={(e) =>
                    handleDraftFilterChange("status", e.target.value)
                  }
                >
                  <option value="">Semua Status</option>
                  <option value="Operated">Operated</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 xl:flex-none px-6 md:px-8 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  TERAPKAN FILTER
                </button>

                <button
                  onClick={handleResetFilters}
                  className="h-11 w-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm shrink-0"
                  title="Reset Semua"
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>
          </section>

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
                            report.status === 'Operated' ? 'bg-emerald-50 text-emerald-700' : 
                            report.status === 'Maintenance' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
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
