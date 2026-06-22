import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getStoredUser } from "../services/authService";
import { fetchDashboardSummary } from "../services/dashboardService";
import {
  fetchInventoryDevices,
  pingInventoryDevices,
} from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";

import PeopleIcon from "@mui/icons-material/People";
import RouterIcon from "@mui/icons-material/Router";
import VerifiedIcon from "@mui/icons-material/Verified";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PublicIcon from "@mui/icons-material/Public";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion } from "framer-motion";

function StatCard({ title, value, suffix, icon, tone, isInteractive = true }) {
  const toneClasses =
    tone === "blue"
      ? { iconBg: "bg-blue-500/10 text-blue-700", accent: "text-blue-700" }
      : tone === "pink"
        ? {
            iconBg: "bg-fuchsia-500/10 text-fuchsia-700",
            accent: "text-fuchsia-700",
          }
        : tone === "emerald"
          ? {
              iconBg: "bg-emerald-500/10 text-emerald-700",
              accent: "text-emerald-700",
            }
          : tone === "rose"
            ? {
                iconBg: "bg-rose-500/10 text-rose-700",
                accent: "text-rose-700",
              }
            : {
                iconBg: "bg-slate-500/10 text-slate-700",
                accent: "text-slate-700",
              };

  return (
    <div
      className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${isInteractive ? "hover:shadow-md hover:scale-[1.02] cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {title}
          </p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {value}
            <span
              className={`ml-2 text-xs font-bold ${toneClasses.accent} opacity-70`}
            >
              {suffix}
            </span>
          </p>
        </div>
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${toneClasses.iconBg}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [loadError, setLoadError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const showNotify = (message, severity = "error") => {
    setNotification({ open: true, message, severity });
  };

  const roleLabel = useMemo(() => {
    const r = String(user?.role || "").toLowerCase();
    if (r === "admin") return "Administrator";
    if (r === "super officer") return "Super Officer";
    if (r === "root") return "Maintenance Root";
    if (r === "officer") return "Officer";
    return "User";
  }, [user?.role]);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const refreshDashboard = () => {
      // Apply role-based filtering for stats
      const params = new URLSearchParams();
      const role = user.role?.toLowerCase();
      if (role !== "admin" && role !== "super officer" && role !== "root") {
        params.set("area_id", user.area_id);
      }
      params.set("user_id", user.id);

      fetchDashboardSummary(params.toString())
        .then(setDashboard)
        .catch((err) => {
          const message =
            err.message ||
            "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
          setLoadError(message);
          showNotify(message, "error");
        });
    };

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toast
        {...notification}
        onClose={() => setNotification({ ...notification, open: false })}
      />
      <Sidebar />

      {/* Admin Modal & Mobile Backdrop */}
      {showAdminModal && (
        <>
          <div
            className="fixed inset-0 z-1999 bg-slate-900/20 backdrop-blur-xs"
            onClick={() => setShowAdminModal(false)}
          />
          <div className="fixed bottom-28 right-8 z-2000 w-[calc(100vw-4rem)] md:w-96 bg-white rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">
                Hubungi Admin
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-4">
              <a
                href="mailto:admin@telkom.co.id"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors"
              >
                <EmailIcon className="text-blue-600 text-xl" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Email
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    admin@telkom.co.id
                  </p>
                </div>
              </a>
              <a
                href="https://wa.me/6282133765908"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition-colors"
              >
                <PhoneIcon className="text-emerald-600 text-xl" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    WhatsApp
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    0821-3376-5908
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <BusinessIcon className="text-indigo-600 text-xl" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Kantor
                  </p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    Telkom Landmark Tower Surabaya
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 md:hidden" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-blue-600">UTAMA</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/profile"
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
              title="Lihat Profil"
            >
              {user.name?.charAt(0)}
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {/* Welcome banner */}
          <section className="relative overflow-hidden rounded-4xl md:rounded-[2.5rem] bg-linear-to-br from-indigo-600 to-blue-700 p-6 md:p-12 text-white shadow-xl shadow-blue-200 mb-8">
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-8 right-8 md:top-12 md:right-12 text-white/30"
            >
              <AutoAwesomeIcon style={{ fontSize: "5rem" }} />
            </motion.div>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-black tracking-tight">
                Selamat Datang, {user.name}!
              </h2>
              <p className="mt-2 md:mt-3 text-blue-100 font-medium max-w-2xl text-sm md:text-lg">
                Akses{" "}
                <span className="font-bold text-white uppercase tracking-wider bg-white/20 px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-xs md:text-sm">
                  {roleLabel}
                </span>{" "}
                Aktif. Pantau seluruh ekosistem perangkat jaringan secara
                real-time.
              </p>

              <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-4 md:gap-6">
                <Link
                  to="/inventory"
                  className="inline-flex items-center gap-2 rounded-xl md:rounded-2xl bg-white px-6 py-3 md:px-8 md:py-4 text-xs md:text-sm font-black text-blue-700 shadow-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
                >
                  BUKA INVENTARIS <span>→</span>
                </Link>
                <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-bold text-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    SISTEM AKTIF
                  </div>
                  <div className="hidden xs:block h-4 w-px bg-white/20" />
                  <div className="hidden xs:block">VERSI 1.0</div>
                </div>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          </section>

          <ErrorAlert message={loadError} />

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="PENGGUNA AKTIF"
              value={dashboard?.stats?.totalUsers ?? 0}
              suffix={dashboard?.meta?.usersSuffix}
              icon={<PeopleIcon />}
              tone="pink"
              isInteractive={false}
            />
            <div onClick={() => navigate("/inventory")}>
              <StatCard
                title="PERANGKAT DIKELOLA"
                value={dashboard?.stats?.totalDevices ?? 0}
                suffix="Perangkat"
                icon={<InventoryIcon />}
                tone="blue"
              />
            </div>
            <div
              onClick={() =>
                navigate("/inventory", { state: { filter: "online" } })
              }
            >
              <StatCard
                title="PERANGKAT HIDUP"
                value={dashboard?.stats?.onlineCount ?? 0}
                suffix="online"
                icon={<VerifiedIcon />}
                tone="emerald"
              />
            </div>
            <div
              onClick={() =>
                navigate("/inventory", { state: { filter: "offline" } })
              }
            >
              <StatCard
                title="PERANGKAT MATI"
                value={dashboard?.stats?.offlineCount ?? 0}
                suffix="offline"
                icon={<CloseIcon />}
                tone="rose"
              />
            </div>
          </div>
          {/* System Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Ringkasan Operasional
                </h3>
                <span className="px-4 py-1.5 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                  Data Real-time
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Online", value: dashboard?.stats?.onlineCount ?? 0 },
                          { name: "Offline", value: dashboard?.stats?.offlineCount ?? 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f43f5e" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-indigo-50 p-5 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                      Total STO
                    </p>
                    <p className="text-2xl font-black text-indigo-900">
                      {dashboard?.stats?.units ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-purple-50 p-5 border border-purple-100">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                      Total Area
                    </p>
                    <p className="text-2xl font-black text-purple-900">
                      {dashboard?.stats?.totalAreas ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed font-medium text-sm mt-8">
                Sistem saat ini berjalan normal dengan sinkronisasi aktif ke{" "}
                {dashboard?.stats?.units ?? 0} STO dan{" "}
                {dashboard?.stats?.totalAreas ?? 0} area. Pantau ketersediaan
                jaringan melalui chart di atas untuk respon cepat.
              </p>
            </div>
          </div>

          {/* Floating Help Button */}
          <button
            onClick={() => setShowAdminModal(!showAdminModal)}
            className={`fixed bottom-8 right-8 h-16 w-16 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-2001 ${showAdminModal ? "rotate-180 bg-slate-700" : ""}`}
            title="Pusat Bantuan"
          >
            {showAdminModal ? (
              <CloseIcon />
            ) : (
              <SupportAgentIcon fontSize="large" />
            )}
          </button>
        </main>
      </div>
    </div>
  );
}
