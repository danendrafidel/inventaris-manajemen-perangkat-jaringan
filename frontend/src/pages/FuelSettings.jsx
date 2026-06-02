import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import { fetchFuelSettings, updateFuelSettings } from "../services/settingsService";
import Sidebar from "../components/Sidebar";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";

// Icons
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import RouteIcon from "@mui/icons-material/Route";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function FuelSettings() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fuel_ratio: "",
    fuel_price_per_liter: ""
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (!user || (role !== "super officer" && role !== "root")) {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFuelSettings();
      setFormData({
        fuel_ratio: data.fuel_ratio,
        fuel_price_per_liter: data.fuel_price_per_liter
      });
    } catch (err) {
      setError(err.message);
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFuelSettings(formData);
      showNotify("Pengaturan bensin berhasil diperbarui");
    } catch (err) {
      showNotify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                SISTEM / <span className="text-blue-600">PENGATURAN</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Pengaturan BBM
              </h1>
            </div>
            <Link
              to="/profile"
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
              title="Lihat Profil"
            >
              {user?.name?.charAt(0)}
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-2xl mx-auto">
          <ErrorAlert message={error} onRetry={loadData} />

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                  <LocalGasStationIcon sx={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Konfigurasi Logistik
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Atur parameter perhitungan BBM
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <RouteIcon sx={{ fontSize: 14 }} /> Konsumsi BBM (KM/Liter)
                        </label>
                        <div className="relative">
                            <input
                                required
                                name="fuel_ratio"
                                type="number"
                                step="any"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                                value={formData.fuel_ratio}
                                onChange={handleChange}
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                                KM / 1L
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <PaymentsIcon sx={{ fontSize: 14 }} /> Harga per Liter
                        </label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                                Rp
                            </span>
                            <input
                                required
                                name="fuel_price_per_liter"
                                type="number"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-6 py-4 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                                value={formData.fuel_price_per_liter}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Estimasi Biaya per KM</p>
                    <p className="text-xl font-black text-blue-800">
                        Rp {formData.fuel_ratio && formData.fuel_price_per_liter 
                            ? Math.round(parseFloat(formData.fuel_price_per_liter) / parseFloat(formData.fuel_ratio)).toLocaleString() 
                            : '0'} 
                        <span className="text-xs font-bold text-blue-400 ml-1">/ KM</span>
                    </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "MENYIMPAN..." : (
                      <>
                        <SaveIcon sx={{ fontSize: 18 }} /> SIMPAN PENGATURAN
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 p-6 border-t border-slate-100">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-black text-xs">i</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                    Informasi Perhitungan
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Sistem menggunakan data jarak rute berkendara. Biaya BBM dihitung dengan rumus: <br />
                    <span className="font-bold text-slate-700">(Jarak / Konsumsi per Liter) × Harga per Liter</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
