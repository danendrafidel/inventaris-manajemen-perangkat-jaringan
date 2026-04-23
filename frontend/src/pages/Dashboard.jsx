import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import { fetchDashboardSummary } from "../services/dashboardService";
import Sidebar from "../components/Sidebar";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";

import PeopleIcon from "@mui/icons-material/People";
import RouterIcon from "@mui/icons-material/Router";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ApartmentIcon from "@mui/icons-material/Apartment";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";

function StatCard({ title, value, suffix, icon, tone }) {
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
          : {
              iconBg: "bg-slate-500/10 text-slate-700",
              accent: "text-slate-700",
            };

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
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
  const [notification, setNotification] = useState({ open: false, message: "", severity: "error" });

  const showNotify = (message, severity = "error") => {
    setNotification({ open: true, message, severity });
  };

  const roleLabel = useMemo(() => {
    const r = String(user?.role || "").toLowerCase();
    if (r === "admin") return "Administrator";
    if (r === "officer") return "Officer";
    return "User";
  }, [user?.role]);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    // Apply role-based filtering for stats
    const params = new URLSearchParams();
    if (user.role !== "admin") {
      params.set("area_id", user.area_id);
    }

    fetchDashboardSummary(params.toString())
      .then(setDashboard)
      .catch((err) => {
        const message = err.message || "Server memberikan respon yang tidak terduga. Silakan coba lagi nanti.";
        setLoadError(message);
        showNotify(message, "error");
      });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toast
        {...notification}
        onClose={() => setNotification({ ...notification, open: false })}
      />
      <Sidebar />

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowAdminModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
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
                <EmailIcon className="text-blue-600" />
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
                <PhoneIcon className="text-emerald-600" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Kontak (WhatsApp)
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    0821-3376-5908
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <BusinessIcon className="text-indigo-600" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Kantor
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    Telkom Landmark Tower Surabaya, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-[1050] border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 md:hidden" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-blue-600">GAMBARAN UMUM</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                Gambaran Umum Dashboard
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
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-black tracking-tight">
                Selamat Datang, {user.name.split(" ")[0]}!
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
              title="TOTAL PENGGUNA"
              value={dashboard?.stats?.totalUsers ?? 0}
              suffix={dashboard?.meta?.usersSuffix}
              icon={<PeopleIcon />}
              tone="pink"
            />
            <StatCard
              title="PERANGKAT DIKELOLA"
              value={dashboard?.stats?.totalDevices ?? 0}
              suffix={dashboard?.meta?.devicesSuffix}
              icon={<RouterIcon />}
              tone="blue"
            />
            <StatCard
              title="PEMINJAMAN AKTIF"
              value={dashboard?.stats?.activeLoans ?? 0}
              suffix={dashboard?.meta?.loansSuffix}
              icon={<AssignmentIcon />}
              tone="emerald"
            />
            <StatCard
              title="UNIT"
              value={dashboard?.stats?.units ?? 0}
              suffix={dashboard?.meta?.unitsSuffix}
              icon={<ApartmentIcon />}
              tone="amber"
            />
          </div>

          {/* System Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Ringkasan Sistem
                </h3>
                <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                  Sistem Informasi
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium text-base mb-8">
                Dashboard overview ini menyajikan ringkasan administratif
                sistem. Untuk manajemen teknis, konfigurasi, dan pemantauan
                spesifik per unit perangkat, silakan gunakan modul{" "}
                <span className="font-bold text-blue-600">Inventaris</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 group hover:border-emerald-200 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Status Keamanan
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    TERENKRIPSI & AMAN
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 group hover:border-blue-200 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Sinkronisasi Database
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    AKTIF REAL-TIME
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-slate-900 p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-xl font-black tracking-tight mb-3">
                  Pusat Bantuan
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">
                  Butuh bantuan navigasi sistem atau pelaporan kendala teknis?
                </p>

                <button
                  onClick={() => setShowAdminModal(true)}
                  className="mt-auto w-full rounded-2xl bg-white/10 border border-white/20 py-4 text-xs font-black hover:bg-white/20 transition-all uppercase tracking-widest"
                >
                  Hubungi Admin
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 text-[10rem] opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <SupportAgentIcon fontSize="inherit" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
