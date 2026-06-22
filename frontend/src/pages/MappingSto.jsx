import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import {
  fetchAllStos,
  fetchAllAreas,
  createSto,
  updateSto,
  deleteSto,
  toggleStoStatus,
} from "../services/areaService";
import Sidebar from "../components/Sidebar";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PublicIcon from "@mui/icons-material/Public";
import RouterIcon from "@mui/icons-material/Router";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MapIcon from "@mui/icons-material/Map";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function MappingSto() {
  const user = getStoredUser();
  const [stos, setStos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSto, setSelectedSto] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    area_id: "",
    latitude: "",
    longitude: "",
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState({
    area_id: "",
    status: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    area_id: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [jumpPage, setJumpPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "super officer" ||
    user?.role?.toLowerCase() === "root";
  const isOfficer = user?.role?.toLowerCase() === "officer";

  const displayStos = useMemo(() => {
    let result = stos;

    // Role-based filtering
    if (isOfficer) {
      result = result.filter((s) => s.area_id == user?.area_id);
    } else if (!isAdmin) {
      return [];
    }

    // Search filter
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(lowSearch) ||
          s.generated_id?.toLowerCase().includes(lowSearch) ||
          String(s.id).includes(lowSearch),
      );
    }

    // Area filter
    if (filters.area_id) {
      result = result.filter((s) => s.area_id == filters.area_id);
    }

    // Status filter
    if (filters.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    return result;
  }, [stos, isAdmin, isOfficer, user?.area_id, search, filters]);

  const sortedStos = useMemo(() => {
    let sortableItems = [...displayStos];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [displayStos, sortConfig]);

  const totalPages = useMemo(
    () => Math.ceil(sortedStos.length / limit) || 1,
    [sortedStos.length, limit],
  );

  const paginatedStos = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedStos.slice(start, start + limit);
  }, [sortedStos, page, limit]);

  const canManage = (sto) => {
    if (isAdmin) return true;
    if (isOfficer && sto.area_id == user?.area_id) return true;
    return false;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setSearch(draftSearch);
    setPage(1);
  };

  const handleResetFilters = () => {
    const initial = {
      area_id: isOfficer ? user?.area_id : "",
      status: "",
    };
    setDraftFilters(initial);
    setFilters(initial);
    setSearch("");
    setDraftSearch("");
    setPage(1);
  };

  const stats = useMemo(
    () => ({
      total: displayStos.length,
      active: displayStos.filter((s) => s.status === "active").length,
      inactive: displayStos.filter((s) => s.status !== "active").length,
    }),
    [displayStos],
  );

  useEffect(() => {
    setJumpPage(page);
  }, [page]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const showNotify = (message, severity = "success") =>
    setNotification({ open: true, message, severity });

  const handleGeocode = async () => {
    if (!formData.name) {
      showNotify("Masukkan nama STO terlebih dahulu", "error");
      return;
    }
    setIsGeocoding(true);
    try {
      const area = areas.find((c) => c.id == formData.area_id)?.name || "";
      const query = `${formData.name}, ${area}, Indonesia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon,
        }));
        showNotify("Lokasi ditemukan!");
      } else {
        showNotify("Lokasi tidak ditemukan, silakan isi manual", "warning");
      }
    } catch {
      showNotify("Gagal menghubungi layanan peta", "error");
    } finally {
      setIsGeocoding(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [stoData, areaData] = await Promise.all([
        fetchAllStos(),
        fetchAllAreas(),
      ]);
      setStos(stoData);
      setAreas(areaData);
    } catch (err) {
      const message =
        "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      setError(message);
      showNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdateSignal = () => {
      loadData();
    };

    window.addEventListener("areas-updated", handleUpdateSignal);

    return () => {
      window.removeEventListener("areas-updated", handleUpdateSignal);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOfficer && formData.area_id != user?.area_id) {
      showNotify("Anda hanya dapat mengelola STO di area Anda", "error");
      return;
    }

    try {
      if (selectedSto) {
        await updateSto(selectedSto.id, formData);
        showNotify("STO berhasil diperbarui");
      } else {
        await createSto(formData);
        showNotify("STO berhasil ditambahkan");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      const message =
        "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      showNotify(message, "error");
    }
  };

  const handleDelete = async () => {
    if (!selectedSto || !canManage(selectedSto)) return;
    try {
      await deleteSto(selectedSto.id);
      showNotify("STO berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedSto(null);
      loadData();
    } catch (err) {
      const message =
        "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      showNotify(message, "error");
    }
  };

  const handleToggleStatus = async (id) => {
    const sto = stos.find((s) => s.id === id);
    if (!canManage(sto)) return;

    try {
      await toggleStoStatus(id);
      showNotify("Status STO berhasil diubah");
      loadData();
    } catch (err) {
      const message =
        "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      showNotify(message, "error");
    }
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
                MAPPING / <span className="text-blue-600">STO</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Pengelola STO
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedSto(null);
                  setFormData({
                    name: "",
                    area_id: isOfficer ? user?.area_id : "",
                    latitude: "",
                    longitude: "",
                  });
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                <AddIcon sx={{ fontSize: 18 }} /> TAMBAH STO
              </button>
              <Link
                to="/profile"
                className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm"
                title="Lihat Profil"
              >
                {user?.name?.charAt(0)}
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <ErrorAlert message={error} onRetry={loadData} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                title: "TOTAL STO",
                value: stats.total,
                icon: <RouterIcon />,
                color: "bg-slate-600",
              },
              {
                title: "AKTIF",
                value: stats.active,
                icon: <CheckCircleIcon />,
                color: "bg-emerald-500",
              },
              {
                title: "TIDAK AKTIF",
                value: stats.inactive,
                icon: <BlockIcon />,
                color: "bg-rose-500",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {s.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {s.value}
                  </p>
                </div>
                <div
                  className={`h-10 w-10 rounded-xl ${s.color} text-white flex items-center justify-center shadow-lg`}
                >
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <section className="bg-white rounded-3xl md:rounded-4xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-5">
            {/* Top Row: Wide Search Input */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
              <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg md:text-xl">
                <SearchIcon />
              </span>
              <input
                className="bg-transparent outline-none text-xs md:text-sm font-bold w-full text-slate-700 placeholder:text-slate-400"
                placeholder="Cari ID atau Nama STO..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>

            {/* Bottom Row: Dropdowns & Action Buttons */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-center gap-3 flex-1">
                <select
                  className={`w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all appearance-none pr-10 ${
                    isOfficer
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
                  value={isOfficer ? user?.area_id : draftFilters.area_id}
                  disabled={isOfficer}
                  onChange={(e) =>
                    handleDraftFilterChange("area_id", e.target.value)
                  }
                >
                  <option value="">Area</option>
                  {areas.map((a) => (
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
                  value={draftFilters.status}
                  onChange={(e) =>
                    handleDraftFilterChange("status", e.target.value)
                  }
                >
                  <option value="">Status</option>
                  <option value="active">ACTIVE</option>
                  <option value="inactive">INACTIVE</option>
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th
                      onClick={() => handleSort("generated_id")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortConfig.key === "generated_id" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        NAMA STO
                        {sortConfig.key === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("area_name")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <PublicIcon sx={{ fontSize: 12 }} /> AREA
                        {sortConfig.key === "area_name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      STATISTIK
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      KOORDINAT
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center animate-pulse text-slate-400 font-bold"
                      >
                        Memuat...
                      </td>
                    </tr>
                  ) : (
                    paginatedStos.map((s) => (
                      <tr
                        key={s.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-black text-slate-900">
                          {s.generated_id || s.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900">
                            {s.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <PublicIcon
                              sx={{ fontSize: 14 }}
                              className="text-slate-400"
                            />
                            <p className="text-xs font-bold text-slate-700">
                              {s.area_name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span title="Devices">
                            <RouterIcon sx={{ fontSize: 14 }} />{" "}
                            {s.device_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.latitude && s.longitude ? (
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {s.latitude}, {s.longitude}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canManage(s) && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(s.id)}
                                className={`h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center transition-all ${s.status === "active" ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                                title={
                                  s.status === "active"
                                    ? "Nonaktifkan"
                                    : "Aktifkan"
                                }
                              >
                                {s.status === "active" ? (
                                  <BlockIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSto(s);
                                  setFormData({
                                    name: s.name,
                                    area_id: s.area_id,
                                    latitude: s.latitude || "",
                                    longitude: s.longitude || "",
                                  });
                                  setShowModal(true);
                                }}
                                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                                title="Edit"
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSto(s);
                                  setShowDeleteModal(true);
                                }}
                                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                title="Hapus"
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedStos.map((s) => (
                <div key={s.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                        <RouterIcon />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            ID: {s.generated_id || s.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {s.status}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        <ApartmentIcon sx={{ fontSize: 12 }} /> Area:
                      </span>{" "}
                      {s.area_name}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        <MapIcon sx={{ fontSize: 12 }} /> Coord:
                      </span>{" "}
                      {s.latitude ? `${s.latitude}, ${s.longitude}` : "-"}
                    </p>
                  </div>
                  {canManage(s) && (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-[9px] font-bold text-slate-600 font-mono">
                        STO ID: {s.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className={`h-9 w-9 rounded-xl border bg-white flex items-center justify-center transition-all ${s.status === "active" ? "text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600" : "text-emerald-500 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"}`}
                        >
                          {s.status === "active" ? (
                            <BlockIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <CheckCircleIcon sx={{ fontSize: 18 }} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSto(s);
                            setFormData({
                              name: s.name,
                              area_id: s.area_id,
                              latitude: s.latitude || "",
                              longitude: s.longitude || "",
                            });
                            setShowModal(true);
                          }}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 md:p-5 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page
                  </p>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    className="w-10 h-7 text-center border border-slate-200 rounded-lg text-xs font-bold"
                    placeholder={page}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const p = parseInt(jumpPage);
                        if (!isNaN(p) && p >= 1 && p <= totalPages) {
                          setPage(p);
                        } else {
                          setJumpPage(page);
                        }
                      }
                    }}
                    onBlur={() => {
                      const p = parseInt(jumpPage);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        setPage(p);
                      } else {
                        setJumpPage(page);
                      }
                    }}
                  />
                  <span className="text-[10px] text-slate-400 font-bold">/ {totalPages}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <select
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-black text-slate-600 outline-none cursor-pointer"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-xs uppercase tracking-tighter cursor-pointer"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-xs uppercase tracking-tighter cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 py-8 md:py-16">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                  <RouterIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedSto ? "Update STO" : "Tambah STO"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Kelola Infrastruktur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  NAMA STO
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Kebalen"
                  />
                  <button
                    type="button"
                    onClick={handleGeocode}
                    className="px-4 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase border border-blue-100 hover:bg-blue-100 transition-all"
                  >
                    {isGeocoding ? "..." : "CARI"}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  PILIH AREA
                </label>
                <select
                  required
                  disabled={isOfficer}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none ${isOfficer ? "opacity-70 cursor-not-allowed" : ""}`}
                  value={formData.area_id}
                  onChange={(e) =>
                    setFormData({ ...formData, area_id: e.target.value })
                  }
                >
                  <option value="">-- Pilih Area --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    LATITUDE
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    LONGITUDE
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
              {formData.latitude && formData.longitude && (
                <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
                  <MapContainer
                    key={`${formData.latitude}-${formData.longitude}`}
                    center={[formData.latitude, formData.longitude]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[formData.latitude, formData.longitude]}
                    />
                  </MapContainer>
                </div>
              )}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
              >
                SIMPAN
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSto && (
        <div className="fixed inset-0 z-2020 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-white/50 p-8 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              <DeleteIcon fontSize="inherit" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-2">
              Hapus STO
            </h3>
            <p className="text-xs font-bold text-slate-500 text-center mb-8">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="text-slate-900 font-black">{selectedSto.name}</span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-3 rounded-xl bg-rose-600 text-xs font-black uppercase text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
