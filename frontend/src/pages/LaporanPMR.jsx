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
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import RouteIcon from "@mui/icons-material/Route";
import LanIcon from "@mui/icons-material/Lan";
import SpeedIcon from "@mui/icons-material/Speed";
import ThermostatIcon from "@mui/icons-material/Thermostat";

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

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const role = user?.role;

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handlePrint = (report) => {
    const printWindow = window.open("", "_blank");
    const date = new Date(report.maintenance_date).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan PMR - ${report.device_name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e40af; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 8px; }
            .label { font-size: 11px; color: #888; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 13px; font-weight: bold; margin-top: 2px; }
            .status-tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
            .status-Operated { background: #ecfdf5; color: #065f46; }
            .status-Maintenance { background: #fffbeb; color: #92400e; }
            .status-Rusak { background: #fef2f2; color: #991b1b; }
            .notes { background: #f8fafc; padding: 15px; border-radius: 10px; font-size: 13px; font-style: italic; line-height: 1.5; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN PREVENTIVE MAINTENANCE</h1>
            <p>Sistem Manajemen Inventaris Perangkat Jaringan</p>
          </div>

          <div class="section">
            <div class="grid">
              <div class="field">
                <div class="label">Tanggal Maintenance</div>
                <div class="value">${date}</div>
              </div>
              <div class="field">
                <div class="label">Status Perangkat</div>
                <div class="status-tag status-${report.status}">${report.status}</div>
              </div>
              <div class="field">
                <div class="label">Teknisi Lapangan</div>
                <div class="value">${report.technician_name}</div>
              </div>
              <div class="field">
                <div class="label">Area / Lokasi</div>
                <div class="value">${report.technician_area}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informasi Perangkat</div>
            <div class="grid">
              <div class="field">
                <div class="label">Nama Perangkat</div>
                <div class="value">${report.device_name}</div>
              </div>
              <div class="field">
                <div class="label">ID / Serial Number</div>
                <div class="value">${report.device_code} / ${report.serial_number}</div>
              </div>
              <div class="field">
                <div class="label">IP Address</div>
                <div class="value">${report.ip}</div>
              </div>
              <div class="field">
                <div class="label">Lokasi / STO</div>
                <div class="value">${report.device_sto} - ${report.room}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detail Kapasitas Port</div>
            <div class="grid" style="grid-template-cols: 1fr 1fr 1fr 1fr;">
              <div class="field">
                <div class="label">Total Port</div>
                <div class="value">${report.port_capacity}</div>
              </div>
              <div class="field">
                <div class="label">Port Idle</div>
                <div class="value">${report.port_idle}</div>
              </div>
              <div class="field">
                <div class="label">Port LAN</div>
                <div class="value">${report.port_lan || 0}</div>
              </div>
              <div class="field">
                <div class="label">Port SFP</div>
                <div class="value">${report.port_sfp || 0}</div>
              </div>
              <div class="field">
                <div class="label">Port Baik</div>
                <div class="value" style="color: #059669;">${report.port_good || 0}</div>
              </div>
              <div class="field">
                <div class="label">Port Rusak</div>
                <div class="value" style="color: #dc2626;">${report.port_bad || 0}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Hasil Tes Koneksi</div>
            <div class="grid">
              <div class="field">
                <div class="label">Ping DNS</div>
                <div class="value">${report.ping_dns || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Redaman (Attenuation)</div>
                <div class="value">${report.attenuation || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Ping Client</div>
                <div class="value">${report.ping_client || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Speed Test</div>
                <div class="value">${report.speed_test || '-'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tindakan & Catatan</div>
            <div class="field">
              <div class="label">Tindakan Diambil</div>
              <div class="value">${report.action}</div>
            </div>
            <div class="field" style="margin-top: 15px;">
              <div class="label">Catatan Tambahan</div>
              <div class="notes">${report.notes || 'Tidak ada catatan tambahan.'}</div>
            </div>
          </div>

          <div class="section" style="margin-top: 50px;">
            <div class="grid">
              <div style="text-align: center;">
                <p style="font-size: 12px;">Mengetahui,</p>
                <div style="height: 80px;"></div>
                <p style="font-weight: bold; text-decoration: underline;">( ............................ )</p>
                <p style="font-size: 10px;">Petugas Area</p>
              </div>
              <div style="text-align: center;">
                <p style="font-size: 12px;">Teknisi Pelaksana,</p>
                <div style="height: 80px;"></div>
                <p style="font-weight: bold; text-decoration: underline;">${report.technician_name}</p>
                <p style="font-size: 10px;">NIK: ${report.user_nik || '-'}</p>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
                            <button 
                              onClick={() => handleViewDetail(report)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm" 
                              title="Lihat Detail"
                            >
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button 
                              onClick={() => handlePrint(report)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm" 
                              title="Download PDF"
                            >
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

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 py-8">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <header className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  selectedReport.status === 'Operated' ? 'bg-emerald-500 shadow-emerald-100' :
                  selectedReport.status === 'Maintenance' ? 'bg-amber-500 shadow-amber-100' :
                  'bg-rose-500 shadow-rose-100'
                }`}>
                  <HistoryIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Detail Laporan PMR</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laporan ID: PMR-{selectedReport.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePrint(selectedReport)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <PrintIcon sx={{ fontSize: 16 }} /> CETAK PDF
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center"
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 1: General Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <PublicIcon sx={{ fontSize: 14 }} /> Informasi Umum
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Tanggal</p>
                          <p className="text-sm font-black text-slate-700">
                            {new Date(selectedReport.maintenance_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Status Akhir</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            selectedReport.status === 'Operated' ? 'bg-emerald-100 text-emerald-700' :
                            selectedReport.status === 'Maintenance' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {selectedReport.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Teknisi</p>
                          <p className="text-sm font-black text-slate-700">{selectedReport.technician_name}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Area</p>
                          <p className="text-sm font-black text-slate-700">{selectedReport.technician_area}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LocalGasStationIcon sx={{ fontSize: 14 }} /> Logistik & Perjalanan
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                          <RouteIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Jarak Tempuh</p>
                          <p className="text-sm font-black text-slate-700">{selectedReport.distance} KM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Estimasi BBM</p>
                        <p className="text-sm font-black text-emerald-600">Rp {selectedReport.fuel_cost?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Device Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <RouterIcon sx={{ fontSize: 14 }} /> Detail Perangkat
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Nama / Tipe</p>
                          <p className="text-sm font-black text-slate-700 uppercase">{selectedReport.device_name} ({selectedReport.device_type})</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">ID / SN</p>
                          <p className="text-sm font-black text-slate-700 uppercase">{selectedReport.device_code}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">IP Address</p>
                          <p className="text-sm font-black text-slate-700">{selectedReport.ip}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Lokasi / STO</p>
                          <p className="text-sm font-black text-slate-700">{selectedReport.device_sto} · {selectedReport.room}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LanIcon sx={{ fontSize: 14 }} /> Kapasitas Port
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total', val: selectedReport.port_capacity, color: 'text-slate-700' },
                        { label: 'Idle', val: selectedReport.port_idle, color: 'text-slate-400' },
                        { label: 'LAN', val: selectedReport.port_lan || 0, color: 'text-blue-600' },
                        { label: 'SFP', val: selectedReport.port_sfp || 0, color: 'text-indigo-600' },
                        { label: 'Baik', val: selectedReport.port_good || 0, color: 'text-emerald-600' },
                        { label: 'Rusak', val: selectedReport.port_bad || 0, color: 'text-rose-600' },
                      ].map((p, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-3 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{p.label}</p>
                          <p className={`text-sm font-black ${p.color}`}>{p.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Connectivity Test */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <SpeedIcon sx={{ fontSize: 14 }} /> Hasil Tes Koneksi
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Ping DNS</p>
                      <p className="text-sm font-black text-blue-700">{selectedReport.ping_dns || '-'}</p>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Redaman</p>
                      <p className="text-sm font-black text-indigo-700">{selectedReport.attenuation || '-'}</p>
                    </div>
                    <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-violet-400 uppercase mb-1">Ping Client</p>
                      <p className="text-sm font-black text-violet-700">{selectedReport.ping_client || '-'}</p>
                    </div>
                    <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-cyan-400 uppercase mb-1">Speed Test</p>
                      <p className="text-sm font-black text-cyan-700">{selectedReport.speed_test || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Action & Notes */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BuildIcon sx={{ fontSize: 14 }} /> Tindakan & Catatan
                  </h3>
                  <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Tindakan Maintenance</p>
                      <p className="text-sm font-black text-blue-400 uppercase tracking-tight">{selectedReport.action}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Catatan Teknisi</p>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{selectedReport.notes || 'Tidak ada catatan tambahan untuk laporan ini.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                >
                  Tutup Detail
                </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
