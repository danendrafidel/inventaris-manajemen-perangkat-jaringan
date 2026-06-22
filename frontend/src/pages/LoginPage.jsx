import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, persistUser, forgotPassword, resetPassword, getStoredUser } from "../services/authService";
import telkomLogo from "../assets/Logo Telkom.png";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // login, forgot, reset
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "error" });

  useEffect(() => {
    if (getStoredUser()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const showNotify = (message, severity = "error") => {
    setNotification({ open: true, message, severity });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(identity, password);
      persistUser(user, remember);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err.message || "Terjadi kesalahan saat login";
      setError(message);
      showNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      showNotify("Link reset password telah dikirim ke email Anda", "success");
      // Tidak pindah ke view reset karena user harus klik link di email
      setEmail("");
      setView("login");
    } catch (err) {
      setError(err.message);
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4 py-12 md:py-0">
      <Toast
        {...notification}
        onClose={() => setNotification({ ...notification, open: false })}
      />
      {/* Background blobs / shapes */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 z-10 bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/50 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="relative z-10 text-center text-white">
            <div className="w-56 h-32 bg-white rounded-3xl p-6 mb-10 mx-auto border border-white/20 shadow-xl animate-float">
              <img src={telkomLogo} alt="Telkom Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">Inventaris <br /> Sistem Manajemen</h2>
            <p className="text-blue-100/80 text-sm font-medium max-w-xs mx-auto leading-relaxed">
              Selamat datang ke inventaris perangkat jaringan.
              <br />
              <span className="font-bold text-white text-base">IS Cybersecurity</span>
            </p>
          </div>
          <div className="absolute inset-0 bg-white/2 pointer-events-none" />
        </div>

        {/* Right Side: Forms */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src={telkomLogo} alt="Telkom Logo" className="h-12 object-contain animate-float" />
          </div>

          <ErrorAlert message={error} />

          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sign In</h1>
                <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Access your workspace</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Email</label>
                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"><PersonIcon fontSize="small" /></span>
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                      placeholder="Enter Username/Email"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"><LockIcon fontSize="small" /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-12 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="group flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative flex items-center justify-center h-5 w-5 rounded-md border-2 border-slate-200 bg-white">
                      <input type="checkbox" className="peer absolute opacity-0 h-full w-full" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      <div className="h-2.5 w-2.5 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-all" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Keep me signed in</span>
                  </label>
                  <button type="button" className="text-[10px] font-black text-blue-600 hover:text-indigo-700 uppercase tracking-widest" onClick={() => setView("forgot")}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 disabled:bg-slate-400">
                  {loading ? "Verifying..." : "Sign In Now"}
                </button>
              </form>
            </div>
          )}

          {view === "forgot" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <button onClick={() => setView("login")} className="mb-6 flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                <ArrowBackIcon sx={{ fontSize: 14 }} /> Back to Login
              </button>
              <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Forgot Password</h1>
                <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Kami akan mengirimkan link reset ke email Anda</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"><EmailIcon fontSize="small" /></span>
                    <input
                      type="email"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                      placeholder="yourname@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 disabled:bg-slate-400">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-auto pt-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">© 2026 PT Telkom Indonesia Tbk.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
