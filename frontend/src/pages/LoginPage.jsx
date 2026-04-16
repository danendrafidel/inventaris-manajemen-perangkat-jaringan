import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, persistUser } from "../services/authService";
import telkomLogo from "../assets/Logo Telkom.png";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import StorageIcon from "@mui/icons-material/Storage";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(identity, password);
      persistUser(user, remember);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4 py-12 md:py-0">
      {/* Background blobs / shapes - More "busy" animations */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />

      {/* Main Container - Horizontal Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 z-10 bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/50 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Left Side: Branding / Visuals */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          {/* Decorative elements for the left side */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-blob animation-delay-2000" />

          <div className="relative z-10 text-center text-white">
            <div className="w-56 h-32 bg-white rounded-3xl p-6 mb-10 mx-auto border border-white/20 shadow-xl animate-float">
              <img
                src={telkomLogo}
                alt="Telkom Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="text-4xl font-black tracking-tight mb-4">
              Inventaris <br /> Sistem Manajemen
            </h2>
            <p className="text-blue-100/80 text-sm font-medium max-w-xs mx-auto leading-relaxed">
              Selamat datang ke inventaris perangkat jaringan.
            </p>

            <div className="mt-12 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <AnalyticsIcon fontSize="large" className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Analytics
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex flex-col items-center">
                <StorageIcon fontSize="large" className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Inventory
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex flex-col items-center">
                <BuildIcon fontSize="large" className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Monitoring
                </span>
              </div>
            </div>
          </div>

          {/* Glassy overlay effect */}
          <div className="absolute inset-0 bg-white/2 pointer-events-none" />
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img
              src={telkomLogo}
              alt="Telkom Logo"
              className="h-12 object-contain animate-float"
            />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              Access your workspace
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-2xl border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 animate-in fade-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 opacity-0 animate-fade-in-up animation-delay-200">
              <label
                htmlFor="identity"
                className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
              >
                Username / Email
              </label>
              <div className="group relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg group-focus-within:scale-110 transition-transform">
                  <PersonIcon fontSize="small" />
                </span>
                <input
                  id="identity"
                  type="text"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-4 text-sm font-bold outline-none ring-0 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                  placeholder="Enter Username/Email"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 opacity-0 animate-fade-in-up animation-delay-400">
              <label
                htmlFor="password"
                title="Enter your password"
                className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 cursor-help"
              >
                Password
              </label>
              <div className="group relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg group-focus-within:scale-110 transition-transform">
                  <LockIcon fontSize="small" />
                </span>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-4 text-sm font-bold outline-none ring-0 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 opacity-0 animate-fade-in-up animation-delay-400">
              <label className="group flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex items-center justify-center h-5 w-5 rounded-md border-2 border-slate-200 bg-white group-hover:border-blue-400 transition-colors">
                  <input
                    type="checkbox"
                    className="peer absolute opacity-0 h-full w-full cursor-pointer"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <div className="h-2.5 w-2.5 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-all scale-50 peer-checked:scale-100" />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                  Keep me signed in
                </span>
              </label>

              <button
                type="button"
                className="text-[10px] font-black text-blue-600 hover:text-indigo-700 transition-colors tracking-widest uppercase"
                onClick={() =>
                  window.alert("Fitur lupa password belum diimplementasikan")
                }
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-4 w-full overflow-hidden rounded-2xl bg-slate-900 py-4.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-200 transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In Now</span>
                    <span className="group-hover:translate-x-1.5 transition-transform text-base">
                      →
                    </span>
                  </>
                )}
              </div>
              {/* Button shine effect */}
              {!loading && (
                <div className="absolute inset-0 translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/10 to-transparent" />
              )}
            </button>
          </form>

          <div className="mt-auto pt-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">
              © 2026 PT Telkom Indonesia Tbk.
            </p>
            <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <button className="hover:text-blue-600 transition-colors">
                Privacy
              </button>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <button className="hover:text-blue-600 transition-colors">
                Terms
              </button>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <button className="hover:text-blue-600 transition-colors">
                Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
