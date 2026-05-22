import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { getStoredUser } from "../services/authService";
import { fetchFuelRecap, updateFuelReport, fetchInventoryOptions } from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import ErrorAlert from "../components/ErrorAlert";

// Icons
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import RouteIcon from "@mui/icons-material/Route";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HistoryIcon from "@mui/icons-material/History";

export default function FuelRecap() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const [options, setOptions] = useState({ areas: [], stos: [], roles: [], deviceTypes: [], statuses: [], offices: [] });

  // Filters
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState({
    area_id: "",
    sto_id: "",
    start_date: "",
    end_date: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    area_id: "",
    sto_id: "",
    start_date: "",
    end_date: "",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ fuel_cost: "", distance: "" });
  const [showImageModal, setShowImageModal] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "maintenance_date", direction: "desc" });

  const role = user?.role?.toLowerCase();
  const isAdminOrSuper = role === "admin" || role === "super officer";

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const loadOptions = async () => {
    try {
      const data = await fetchInventoryOptions({ role: user?.role, email: user?.email });
      setOptions(data);
    } catch (err) {
      console.error("Gagal memuat opsi filter", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const effectiveFilters = { ...filters, search };
      if (!isAdminOrSuper && user?.area_id) {
        effectiveFilters.area_id = user.area_id;
      }
      const data = await fetchFuelRecap(effectiveFilters);
      setReports(data);
      setSelectedIds([]); // Reset selection on reload
    } catch (err) {
      setError(err.message);
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (role !== "super officer" && role !== "officer")) {
      navigate("/dashboard");
      return;
    }
    loadOptions();
    loadData();
  }, [filters, search]);

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setSearch(draftSearch);
  };

  const handleResetFilters = () => {
    const initial = {
      area_id: isAdminOrSuper ? "" : user?.area_id || "",
      sto_id: "",
      start_date: "",
      end_date: "",
    };
    setDraftFilters(initial);
    setFilters(initial);
    setSearch("");
    setDraftSearch("");
  };

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "area_id") next.sto_id = "";
      return next;
    });
  };

  const filteredStosForDraft = useMemo(() => {
    const targetAreaId =
      role !== "admin" && role !== "super officer"
        ? user?.area_id
        : draftFilters.area_id;
    if (!targetAreaId) return options.stos;
    return options.stos.filter((s) => s.area_id == targetAreaId);
  }, [options.stos, draftFilters.area_id, user?.area_id, role]);

  const handleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map(r => r.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEdit = (report) => {
    setEditingId(report.id);
    setEditForm({ fuel_cost: report.fuel_cost, distance: report.distance });
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateFuelReport(id, editForm);
      showNotify("Data BBM diperbarui");
      setEditingId(null);
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
        showNotify("Pilih data yang akan diekspor", "warning");
        return;
    }
    const selectedData = reports.filter(r => selectedIds.includes(r.id));
    const worksheet = XLSX.utils.json_to_sheet(selectedData.map(r => ({
      "ID": r.id,
      "Tanggal": new Date(r.maintenance_date).toLocaleDateString("id-ID"),
      "Teknisi": r.technician_name,
      "NIK": r.nik,
      "Area": r.technician_area,
      "Perangkat": r.device_name,
      "Jarak (KM)": r.distance,
      "Biaya BBM (Rp)": r.fuel_cost
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap_BBM");
    XLSX.writeFile(workbook, `Rekap_BBM_${new Date().getTime()}.xlsx`);
  };

  const sortedReports = useMemo(() => {
    let items = [...reports];
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'maintenance_date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reports, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const totals = useMemo(() => {
    const selected = reports.filter(r => selectedIds.includes(r.id));
    return {
      distance: selected.reduce((acc, curr) => acc + parseFloat(curr.distance || 0), 0),
      cost: selected.reduce((acc, curr) => acc + parseFloat(curr.fuel_cost || 0), 0),
      count: selected.length
    };
  }, [reports, selectedIds]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <Toast {...notification} onClose={() => setNotification({ ...notification, open: false })} />

      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                LOGISTIK / <span className="text-blue-600">REKAP BBM</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Rekapitulasi BBM Bulanan
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter shadow-md shadow-blue-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
                title="Lihat Profil"
              >
                {user.name?.charAt(0)}
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6">
          <ErrorAlert message={error} onRetry={loadData} />

          {/* Stats Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              {
                title: "TOTAL LAPORAN",
                value: reports.length,
                icon: <HistoryIcon />,
                color: "bg-blue-600",
                onClick: () => setSelectedIds([]),
              },
              {
                title: "TOTAL TERPILIH",
                value: totals.count,
                icon: <CheckBoxIcon />,
                color: "bg-indigo-500",
                onClick: handleSelectAll,
              },
              {
                title: "JARAK TERPILIH",
                value: `${totals.distance.toFixed(1)} KM`,
                icon: <RouteIcon />,
                color: "bg-amber-500",
                onClick: null,
              },
              {
                title: "BIAYA TERPILIH",
                value: `Rp ${totals.cost.toLocaleString()}`,
                icon: <PaymentsIcon />,
                color: "bg-emerald-600",
                onClick: null,
              },
            ].map((c, i) => (
              <div
                key={i}
                onClick={c.onClick}
                className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${c.onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                      {c.title}
                    </p>
                    <p className="text-xl md:text-2xl font-black text-slate-900">
                      {c.value}
                    </p>
                  </div>
                  <div
                    className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-lg ${c.color} text-white`}
                  >
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Filter Bar (Identical to LaporanPMR.jsx design) */}
          <section className="bg-white rounded-3xl md:rounded-4xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
                <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg md:text-xl">
                  <SearchIcon />
                </span>
                <input
                  className="bg-transparent outline-none text-xs md:text-sm font-bold w-full text-slate-700 placeholder:text-slate-400"
                  placeholder="Cari Nama Teknisi..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">
                    Tgl Awal
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all cursor-pointer"
                    value={draftFilters.start_date}
                    onChange={(e) =>
                      handleDraftFilterChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">
                    Tgl Akhir
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all cursor-pointer"
                    value={draftFilters.end_date}
                    onChange={(e) =>
                      handleDraftFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-center gap-3 flex-1">
                <select
                  className={`w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all appearance-none pr-10 ${
                    role !== "admin" && role !== "super officer"
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
                  value={
                    role !== "admin" && role !== "super officer"
                      ? user?.area_id
                      : draftFilters.area_id
                  }
                  disabled={role !== "admin" && role !== "super officer"}
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
              </div>

              <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                <button
                  onClick={handleExport}
                  disabled={selectedIds.length === 0}
                  className="flex-1 xl:flex-none px-6 md:px-8 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileUploadIcon sx={{ fontSize: 16 }} /> EXPORT
                </button>

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

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort("maintenance_date")}>
                      <div className="flex items-center gap-1">
                        WAKTU {sortConfig.key === "maintenance_date" && (sortConfig.direction === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 12 }} /> : <ArrowDownwardIcon sx={{ fontSize: 12 }} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      PERANGKAT
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort("technician_name")}>
                      <div className="flex items-center gap-1">
                        TEKNISI {sortConfig.key === "technician_name" && (sortConfig.direction === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 12 }} /> : <ArrowDownwardIcon sx={{ fontSize: 12 }} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      JARAK (KM)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      BIAYA BBM
                    </th>
                    <th className="px-6 py-4 w-12 text-center">
                      <button onClick={handleSelectAll} className="text-blue-600 transition-transform active:scale-90" title="Pilih Semua">
                        {selectedIds.length === reports.length && reports.length > 0 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse">Memuat data...</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold">Tidak ada data untuk periode ini</td></tr>
                  ) : (
                    sortedReports.map((r) => (
                      <tr key={r.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.includes(r.id) ? "bg-blue-50/30" : ""}`}>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-900">{new Date(r.maintenance_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                            Sub: {new Date(r.maintenance_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <LocalGasStationIcon sx={{ fontSize: 16 }} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{r.device_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{r.device_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black uppercase">
                              {r.technician_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-700">{r.technician_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{r.nik || r.technician_area}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editingId === r.id ? (
                            <input
                              type="number"
                              className="w-20 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-black text-blue-700 text-center outline-none ring-2 ring-blue-100"
                              value={editForm.distance}
                              onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })}
                            />
                          ) : (
                            <span className="text-xs font-black text-slate-700 cursor-pointer" onClick={() => handleEdit(r)} title="Klik untuk edit">{r.distance} KM</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editingId === r.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                className="w-28 rounded-lg border border-blue-200 bg-white px-2 py-1 text-xs font-black text-blue-700 text-center outline-none ring-2 ring-blue-100"
                                value={editForm.fuel_cost}
                                onChange={(e) => setEditForm({ ...editForm, fuel_cost: e.target.value })}
                              />
                              <button onClick={() => handleSaveEdit(r.id)} className="text-blue-600 hover:text-blue-800" title="Simpan">
                                <SaveIcon sx={{ fontSize: 18 }} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600" title="Batal">
                                <CloseIcon sx={{ fontSize: 18 }} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-black text-emerald-600 cursor-pointer" onClick={() => handleEdit(r)} title="Klik untuk edit">Rp {r.fuel_cost?.toLocaleString()}</span>
                              {r.fuel_receipt && (
                                <button onClick={() => setShowImageModal(r.fuel_receipt)} className="text-slate-300 hover:text-blue-500" title="Lihat Nota">
                                  <VisibilityIcon sx={{ fontSize: 14 }} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleToggleSelect(r.id)} className={`${selectedIds.includes(r.id) ? "text-blue-600" : "text-slate-300"}`}>
                            {selectedIds.includes(r.id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                          </button>
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-3000 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowImageModal(null)}>
          <div className="relative max-w-4xl w-full">
            <img src={showImageModal} alt="Nota BBM" className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button className="absolute -top-12 right-0 text-white flex items-center gap-2 font-black uppercase text-xs tracking-widest">
              TUTUP <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
