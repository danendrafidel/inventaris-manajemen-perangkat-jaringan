import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import {
  fetchAllDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  toggleDivisionStatus,
} from "../services/areaService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function MappingDivision() {
  const user = getStoredUser();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capability: "",
  });
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
    try {
      const data = await fetchAllDivisions();
      setDivisions(data);
    } catch (err) {
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDivision) {
        await updateDivision(selectedDivision.id, formData);
        showNotify("Divisi berhasil diperbarui");
      } else {
        await createDivision(formData);
        showNotify("Divisi berhasil ditambahkan");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Hapus Divisi ini? Semua data Kota dan STO terkait juga akan terhapus.",
      )
    ) {
      try {
        await deleteDivision(id);
        showNotify("Divisi berhasil dihapus");
        loadData();
      } catch (err) {
        showNotify(err.message, "error");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleDivisionStatus(id);
      showNotify("Status divisi berhasil diubah");
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 md:hidden" />
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  MAPPING / <span className="text-blue-600">DIVISI</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Pengelola Divisi
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedDivision(null);
                  setFormData({ name: "", description: "", capability: "" });
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                <AddIcon sx={{ fontSize: 18 }} /> TAMBAH DIVISI
              </button>
              <Link to="/profile" className="h-9 w-9 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm" title="Lihat Profil">
                {user?.name?.charAt(0)}
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ID
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      NAMA DIVISI
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      STATISTIK
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      KAPABILITAS
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      DESKRIPSI
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
                        Memuat data...
                      </td>
                    </tr>
                  ) : divisions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-slate-400 font-bold"
                      >
                        Belum ada data Divisi
                      </td>
                    </tr>
                  ) : (
                    divisions.map((d) => (
                      <tr
                        key={d.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-black text-slate-900">
                          {d.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                              {d.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {d.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1 text-[10px] font-black text-slate-500">
                            <span title="Users">👤 {d.user_count}</span>
                            <span title="Areas">🗺️ {d.area_count}</span>
                            <span title="STOs">🏢 {d.sto_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {d.capability || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {d.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${d.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${d.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}
                            />
                            {d.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(d.id)}
                              className={`h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center transition-all ${d.status === "active" ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                            >
                              <BlockIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDivision(d);
                                setFormData({
                                  name: d.name,
                                  description: d.description || "",
                                  capability: d.capability || "",
                                });
                                setShowModal(true);
                              }}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {divisions.map((d) => (
                <div key={d.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {d.status}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${d.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        Users:
                      </span>{" "}
                      {d.user_count}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        Areas:
                      </span>{" "}
                      {d.area_count}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        STOs:
                      </span>{" "}
                      {d.sto_count}
                    </p>
                    <p>
                      <span className="font-black text-slate-400 uppercase">
                        Cap:
                      </span>{" "}
                      {d.capability || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => handleToggleStatus(d.id)}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center ${d.status === "active" ? "text-rose-600 border-rose-200" : "text-emerald-600 border-emerald-200"}`}
                    >
                      {d.status === "active" ? <BlockIcon sx={{ fontSize: 16 }} /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDivision(d);
                        setFormData({
                          name: d.name,
                          description: d.description || "",
                          capability: d.capability || "",
                        });
                        setShowModal(true);
                      }}
                      className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="h-8 w-8 rounded-lg border border-rose-200 flex items-center justify-center text-rose-600"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                  <BusinessIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedDivision ? "Update Divisi" : "Tambah Divisi"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Manajemen Divisi
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  NAMA DIVISI
                </label>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Witel Suramadu"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  KAPABILITAS
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={formData.capability}
                  onChange={(e) =>
                    setFormData({ ...formData, capability: e.target.value })
                  }
                  placeholder="Contoh: Lingkup Suramadu"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  DESKRIPSI (OPSIONAL)
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all min-h-[100px]"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Keterangan wilayah divisi..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
              >
                {selectedDivision ? "SIMPAN PERUBAHAN" : "TAMBAH DIVISI"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
