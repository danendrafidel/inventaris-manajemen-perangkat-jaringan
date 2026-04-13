import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, persistUser } from "../services/authService";
import {
  fetchProfile,
  updateProfile,
  changeUserPassword,
} from "../services/userService";
import { fetchInventoryOptions } from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [options, setOptions] = useState({ divisions: [], areas: [] });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nik: "",
    division: "",
    area: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    if (!storedUser) {
      navigate("/");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([
        fetchProfile(storedUser.id),
        fetchInventoryOptions({ role: storedUser.role }),
      ]);
      setProfile(p);
      setFormData({
        name: p.name,
        email: p.email,
        nik: p.nik || "",
        division: p.division,
        area: p.area,
      });
      setOptions(o);
    } catch (err) {
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile(storedUser.id, formData);
      setProfile(updated);
      // Update local storage to keep session in sync
      const current = getStoredUser();
      persistUser(
        { ...current, ...updated },
        localStorage.getItem("auth-user") !== null,
      );
      setIsEditing(false);
      showNotify("Profil berhasil diperbarui");
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      await changeUserPassword(storedUser.id, newPassword);
      setShowPassModal(false);
      setNewPassword("");
      showNotify("Password berhasil diubah");
    } catch (err) {
      showNotify(err.message, "error");
    }
  };

  if (!profile) return null;

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
              <div className="w-10 md:hidden" /> {/* Mobile Toggle Spacer */}
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  SISTEM / <span className="text-blue-600">PROFIL</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Akun Saya
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl">
          <div className="bg-white rounded-4xl md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            {/* Cover / Header */}
            <div className="h-24 md:h-32 bg-linear-to-r from-blue-600 to-indigo-700 relative">
              <div className="absolute -bottom-10 md:-bottom-12 left-6 md:left-10">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl md:rounded-3xl bg-white p-1.5 shadow-xl">
                  <div className="h-full w-full rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-2xl md:text-3xl font-black text-slate-400">
                    {profile.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-14 md:pt-16 px-6 md:px-10 pb-8 md:pb-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 md:mb-10 gap-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h2>
                  <p className="text-xs md:text-sm font-bold text-slate-400">
                    @{profile.username} ·{" "}
                    <span className="text-blue-600 uppercase">
                      {profile.role}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPassModal(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-[10px] md:text-xs font-black text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    <LockIcon sx={{ fontSize: 16 }} /> GANTI PASSWORD
                  </button>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[10px] md:text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      <EditIcon sx={{ fontSize: 16 }} /> EDIT PROFIL
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-[10px] md:text-xs font-black text-white shadow-lg hover:bg-black transition-all"
                    >
                      <CloseIcon sx={{ fontSize: 16 }} /> BATAL
                    </button>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleUpdate}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
              >
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <PersonIcon sx={{ fontSize: 14 }} /> Nama Lengkap
                    </label>
                    <input
                      required
                      disabled={!isEditing}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <EmailIcon sx={{ fontSize: 14 }} /> Email
                    </label>
                    <input
                      required
                      type="email"
                      disabled={!isEditing}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <BadgeIcon sx={{ fontSize: 14 }} /> NIK
                    </label>
                    <input
                      required
                      disabled={!isEditing}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      value={formData.nik}
                      onChange={(e) =>
                        setFormData({ ...formData, nik: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <BusinessIcon sx={{ fontSize: 14 }} /> Divisi
                    </label>
                    <select
                      disabled={!isEditing}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                      value={formData.division}
                      onChange={(e) =>
                        setFormData({ ...formData, division: e.target.value })
                      }
                    >
                      {options.divisions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <MapIcon sx={{ fontSize: 14 }} /> Area
                    </label>
                    <select
                      disabled={!isEditing}
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                    >
                      {options.areas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isEditing && (
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-slate-900 py-3.5 md:py-4 text-xs font-black text-white shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em]"
                      >
                        <SaveIcon sx={{ fontSize: 18 }} /> Simpan Perubahan
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

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
                    Update Keamanan
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Ganti Password Akun
                  </p>
                </div>
              </div>
              <form onSubmit={handleChangePass}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                    PASSWORD BARU
                  </label>
                  <input
                    required
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 karakter"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowPassModal(false)}
                    className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    Update Password
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
