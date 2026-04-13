import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, persistUser } from "../services/authService";

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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4">
      {/* Background blobs / shapes */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="p-10">
            {/* Header / Brand */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-[1.75rem] bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-200 animate-float">
                🛡️
              </div>
              <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight text-center">
                System Login
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest text-center">
                Inventaris Manajemen
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 animate-in fade-in slide-in-from-top-2">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 opacity-0 animate-fade-in-up animation-delay-200">
                <label
                  htmlFor="identity"
                  className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1"
                >
                  Username / Email
                </label>
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    👤
                  </span>
                  <input
                    id="identity"
                    type="text"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm font-bold outline-none ring-0 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                    placeholder="Enter username or email"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 opacity-0 animate-fade-in-up animation-delay-400">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1"
                >
                  Password
                </label>
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    🔑
                  </span>
                  <input
                    id="password"
                    type="password"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm font-bold outline-none ring-0 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
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
                    <div className="h-2 w-2 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                    Keep me signed in
                  </span>
                </label>

                <button
                  type="button"
                  className="text-xs font-black text-blue-600 hover:text-indigo-700 transition-colors tracking-tight"
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
                className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-200 transition-all hover:bg-black hover:shadow-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In Now</span>
                      <span className="group-hover:translate-x-1 transition-transform">
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

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                © 2026 PT Telkom Indonesia Tbk.
              </p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:underline transition-all"
                >
                  Privacy Policy
                </button>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <button
                  type="button"
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:underline transition-all"
                >
                  Terms & Conditions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support floating text */}
        <p className="mt-8 text-center text-[11px] font-bold text-slate-400 tracking-tight">
          System version 2.4.0-stable ·{" "}
          <span className="text-blue-500 hover:underline cursor-pointer">
            Support Center
          </span>
        </p>
      </div>
    </div>
  );
}
