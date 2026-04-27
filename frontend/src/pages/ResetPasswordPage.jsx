import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import telkomLogo from "../assets/Logo Telkom.png";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "error" });

  useEffect(() => {
    if (!token) {
      setError("Link reset tidak valid (token hilang)");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.message);
      setNotification({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4">
      <Toast
        {...notification}
        onClose={() => setNotification({ ...notification, open: false })}
      />
      
      <div className="w-full max-w-md z-10 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-2xl p-8 md:p-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <img src={telkomLogo} alt="Telkom Logo" className="h-10 mb-6 object-contain" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Atur Ulang Password</h1>
          <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Masukkan password baru Anda</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-10 space-y-4 animate-in zoom-in-95 duration-500">
            <CheckCircleIcon sx={{ fontSize: 64 }} className="text-emerald-500" />
            <p className="text-center font-bold text-slate-700">Password berhasil diperbarui!</p>
            <p className="text-xs text-slate-400">Mengalihkan ke halaman login...</p>
          </div>
        ) : (
          <>
            <ErrorAlert message={error} />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><LockIcon fontSize="small" /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password Baru</label>
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><LockIcon fontSize="small" /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !token} 
                className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 disabled:bg-slate-400"
              >
                {loading ? "Memproses..." : "Perbarui Password"}
              </button>
            </form>
          </>
        )}
      </div>
      
      {/* Background blobs */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute -bottom-20 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
    </div>
  );
}
