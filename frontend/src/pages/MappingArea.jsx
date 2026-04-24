import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import { fetchAllAreas,
  createArea,
  updateArea,
  deleteArea,
  toggleAreaStatus,
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
import LocationCityIcon from "@mui/icons-material/LocationCity";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function MappingArea() {
  const user = getStoredUser();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const sortedAreas = useMemo(() => {
    let sortableItems = [...areas];
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
  }, [areas, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const stats = useMemo(() => ({
    total: areas.length,
    active: areas.filter(a => a.status === 'active').length,
    inactive: areas.filter(a => a.status !== 'active').length,
  }), [areas]);

  const showNotify = (message, severity = "success") =>
    setNotification({ open: true, message, severity });

  const handleGeocode = async () => {
    if (!formData.name) {
      showNotify("Masukkan nama area terlebih dahulu", "error");
      return;
    }
    setIsGeocoding(true);
    try {
      const query = `${formData.name}, Indonesia`;
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
      const areaData = await fetchAllAreas();
      setAreas(areaData);
    } catch (err) {
      const message = "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      setError(message);
      showNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isAdmin = user?.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (selectedArea) {
        await updateArea(selectedArea.id, formData);
        showNotify("Area berhasil diperbarui");
      } else {
        await createArea(formData);
        showNotify("Area berhasil ditambahkan");
      }
      setShowModal(false);
      await loadData();
      window.dispatchEvent(new Event('areas-updated'));
    } catch (err) {
      const message = "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
      showNotify(message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (
      window.confirm(
        "Hapus Area ini? Semua data STO terkait juga akan dihapus.",
      )
    ) {
      try {
        await deleteArea(id);
        showNotify("Area berhasil dihapus");
        loadData();
        window.dispatchEvent(new Event('areas-updated'));
      } catch (err) {
        const message = "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
        showNotify(message, "error");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    if (!isAdmin) return;
    try {
      await toggleAreaStatus(id);
      showNotify("Status area berhasil diubah");
      loadData();
    } catch (err) {
      const message = "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
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
                MAPPING / <span className="text-blue-600">AREA</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Kelola Area
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    setSelectedArea(null);
                    setFormData({ name: "", latitude: "", longitude: "" });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  <AddIcon sx={{ fontSize: 18 }} /> TAMBAH AREA
                </button>
              )}
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
                    { title: "TOTAL AREA", value: stats.total, icon: <PublicIcon />, color: "bg-slate-600" },
                    { title: "AKTIF", value: stats.active, icon: <CheckCircleIcon />, color: "bg-emerald-500" },
                    { title: "TIDAK AKTIF", value: stats.inactive, icon: <BlockIcon />, color: "bg-rose-500" },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{s.title}</p>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl ${s.color} text-white flex items-center justify-center shadow-lg`}>{s.icon}</div>
                    </div>
                ))}
            </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th 
                      onClick={() => handleSort('generated_id')}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortConfig.key === 'generated_id' && (
                          sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 12 }} /> : <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        NAMA AREA
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 12 }} /> : <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                        )}
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
                      {isAdmin ? "AKSI" : ""}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-10 text-center animate-pulse text-slate-400 font-bold"
                      >
                        Memuat...
                      </td>
                    </tr>
                  ) : areas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-10 text-center text-slate-400 font-bold"
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    sortedAreas.map((c) => (
                      <tr
                        key={c.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-black text-slate-900">
                          {c.generated_id || c.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                              {c.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {c.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1 text-[10px] font-black text-slate-500">
                            <span title="Users"><PersonIcon sx={{ fontSize: 14 }} /> {c.active_user_count}</span>
                            <span title="STOs"><ApartmentIcon sx={{ fontSize: 14 }} /> {c.sto_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.latitude && c.longitude ? (
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              {c.latitude}, {c.longitude}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}
                            />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAdmin && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(c.id)}
                                className={`h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center transition-all ${c.status === "active" ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                                title={
                                  c.status === "active"
                                    ? "Nonaktifkan"
                                    : "Aktifkan"
                                }
                              >
                                {c.status === "active" ? (
                                  <BlockIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedArea(c);
                                  setFormData({
                                    name: c.name,
                                    latitude: c.latitude || "",
                                    longitude: c.longitude || "",
                                  });
                                  setShowModal(true);
                                }}
                                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                                title="Edit"
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
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
              {sortedAreas.map((c) => (
                <div key={c.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            ID: {c.generated_id || c.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {c.status}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        <PersonIcon sx={{ fontSize: 12 }} /> User:
                      </span>{" "}
                      {c.active_user_count}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        <ApartmentIcon sx={{ fontSize: 12 }} /> STOs:
                      </span>{" "}
                      {c.sto_count}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        <MapIcon sx={{ fontSize: 12 }} /> Coord:
                      </span>{" "}
                      {c.latitude ? `${c.latitude}, ${c.longitude}` : "-"}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => handleToggleStatus(c.id)}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center ${c.status === "active" ? "text-rose-600 border-rose-200" : "text-emerald-600 border-emerald-200"}`}
                      >
                        {c.status === "active" ? (
                          <BlockIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArea(c);
                          setFormData({
                            name: c.name,
                            latitude: c.latitude || "",
                            longitude: c.longitude || "",
                          });
                          setShowModal(true);
                        }}
                        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="h-8 w-8 rounded-lg border border-rose-200 flex items-center justify-center text-rose-600"
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 py-8 md:py-16">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <LocationCityIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedArea ? "Update Area" : "Tambah Area"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Kelola Wilayah
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
                  NAMA AREA
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Semarang"
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
                {selectedArea ? "SIMPAN PERUBAHAN" : "TAMBAH AREA"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
