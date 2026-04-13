import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  changeUserPassword,
  toggleUserStatus,
} from "../services/userService";
import { fetchInventoryOptions } from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function UserManagement() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    roles: [],
    divisions: [],
    areas: [],
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedUser, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    nik: "",
    role: "",
    area: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "officer")
    ) {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, o] = await Promise.all([
        fetchAllUsers(),
        fetchInventoryOptions({ role: currentUser.role }),
      ]);
      setUsers(u);
      setOptions(o);
    } catch (err) {
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowAddModal(false);
      showNotify("User berhasil dibuat");
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.id, formData);
      setShowEditModal(false);
      showNotify("Data user diperbarui");
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      await changeUserPassword(selectedUser.id, newPassword);
      setShowPassModal(false);
      setNewPassword("");
      showNotify("Password user berhasil diubah");
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleUserStatus(id);
      showNotify("Status user diubah");
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
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 md:hidden shrink-0" />{" "}
              {/* Mobile Toggle Spacer */}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                  Dashboard / <span className="text-blue-600">PENGGUNA</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">
                  Pengelola Pengguna
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <button
                onClick={() => {
                  setFormData({
                    username: "",
                    password: "",
                    name: "",
                    email: "",
                    nik: "",
                    role: "",
                    division: "",
                    area: "",
                  });
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 md:px-5 py-2 md:py-2.5 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                <PersonAddIcon sx={{ fontSize: 18 }} />{" "}
                <span className="hidden sm:inline">TAMBAH PENGGUNA</span>
              </button>
              <Link
                to="/profile"
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
                title="Lihat Profil"
              >
                {currentUser?.name?.charAt(0)}
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-full overflow-hidden">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      IDENTITAS
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      KONTAK & NIK
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ROLE & UNIT
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
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {u.name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-tighter">
                              @{u.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">
                          {u.email}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                          NIK: {u.nik || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest border border-blue-100">
                          {u.role}
                        </span>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          {u.division} · {u.area}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(u);
                              setFormData({ ...u });
                              setShowEditModal(true);
                            }}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all shadow-sm"
                            title="Edit Profile"
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(u);
                              setShowPassModal(true);
                            }}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                            title="Ganti Password"
                          >
                            <LockIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center transition-all shadow-sm ${u.status === "active" ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                            title={
                              u.status === "active" ? "Nonaktifkan" : "Aktifkan"
                            }
                          >
                            {u.status === "active" ? (
                              <BlockIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <CheckCircleIcon sx={{ fontSize: 16 }} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">
                          {u.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 tracking-tighter">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        u.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Role & Unit
                      </p>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-widest border border-blue-100">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-700">
                      {u.division} · {u.area}
                    </p>
                    <div className="pt-1 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-600 truncate">
                        {u.email}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        NIK: {u.nik || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(u);
                        setFormData({ ...u });
                        setShowEditModal(true);
                      }}
                      className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                      title="Edit Profile"
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(u);
                        setShowPassModal(true);
                      }}
                      className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                      title="Ganti Password"
                    >
                      <LockIcon sx={{ fontSize: 18 }} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className={`h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center transition-all ${u.status === "active" ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                      title={u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {u.status === "active" ? (
                        <BlockIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowAddModal(false) || setShowEditModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg">
                    {showEditModal ? <EditIcon /> : <PersonAddIcon />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {showEditModal ? "Update User" : "Register User"}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Sistem Manajemen Pengguna
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setShowAddModal(false) || setShowEditModal(false)
                  }
                  className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <CloseIcon />
                </button>
              </div>

              <form
                onSubmit={showEditModal ? handleUpdate : handleCreate}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    USERNAME
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={showEditModal}
                  />
                </div>

                {/* Field Password hanya muncul saat Tambah User */}
                {!showEditModal && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      PASSWORD
                    </label>
                    <input
                      required
                      type="password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    NAMA LENGKAP
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    EMAIL
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    NIK
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.nik}
                    onChange={(e) =>
                      setFormData({ ...formData, nik: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    ROLE
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="">Pilih Role</option>
                    {options.roles.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    Area
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                  >
                    <option value="">Pilih Area</option>
                    {options.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddModal(false) || setShowEditModal(false)
                    }
                    className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                  >
                    {showEditModal ? "Save" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowPassModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                  <LockIcon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Security Update
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Change Account Password
                  </p>
                </div>
              </div>
              <form onSubmit={handleChangePass}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    NEW PASSWORD
                  </label>
                  <input
                    required
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowPassModal(false)}
                    className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    Update Security
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
