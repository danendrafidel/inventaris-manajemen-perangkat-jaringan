import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { getStoredUser } from "../services/authService";
import {
  fetchPmrReports,
  fetchInventoryOptions,
} from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import ErrorAlert from "../components/ErrorAlert";

// Icons
import StorageIcon from "@mui/icons-material/Storage";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import BoltIcon from "@mui/icons-material/Bolt";
import PublicIcon from "@mui/icons-material/Public";
import RouterIcon from "@mui/icons-material/Router";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import RouteIcon from "@mui/icons-material/Route";
import LanIcon from "@mui/icons-material/Lan";
import SpeedIcon from "@mui/icons-material/Speed";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function LaporanPMR() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [options, setOptions] = useState({
    areas: [],
    stos: [],
  });

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    area_id: "",
    sto_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    area_id: "",
    sto_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [draggingImage, setDraggingImage] = useState(null); // Track which image is being dragged

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const addPmrImages = async (reportId, files, type) => {
    setImageLoading(true);
    const formData = new FormData();
    if (type === "photo") {
      files.forEach((file) => formData.append("maintenance_photo", file));
    } else {
      formData.append("fuel_receipt", files[0]);
    }

    try {
      const response = await fetch(`/api/pmr/${reportId}`, {
        method: "PUT",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        showNotify("Foto berhasil ditambahkan");
        setSelectedReport(result.data); // Keep modal open and update data
        await loadData();
      } else {
        showNotify(result.message || "Gagal menambahkan foto", "error");
      }
    } catch (err) {
      showNotify("Terjadi kesalahan saat mengunggah", "error");
    } finally {
      setImageLoading(false);
    }
  };

  const deletePmrImage = async (reportId, index) => {
    setImageLoading(true);
    try {
      const response = await fetch(`/api/pmr/${reportId}/image/${index}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        showNotify("Foto berhasil dihapus");
        // Update local state directly to avoid closing modal
        // Fetch fresh data for the report to ensure state consistency
        const updatedReports = await fetchPmrReports({
          area_id:
            role !== "admin" && role !== "super officer" && role !== "root"
              ? user?.area_id
              : filters.area_id || null,
          role: role,
          user_id:
            role === "admin" || role === "super officer" || role === "root" ? undefined : user?.id,
        });
        const updatedReport = updatedReports.find((r) => r.id === reportId);
        setSelectedReport(updatedReport);
        await loadData();
      } else {
        showNotify(result.message || "Gagal menghapus foto", "error");
      }
    } catch (err) {
      showNotify("Terjadi kesalahan", "error");
    } finally {
      setImageLoading(false);
    }
  };

  const handleExport = () => {
    if (reports.length === 0) {
      showNotify("Tidak ada data untuk diekspor", "error");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      reports.map((r) => ({
        "ID Laporan": r.id,
        "Tanggal & Waktu": `${new Date(r.maintenance_date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })} ${new Date(r.created_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}`,
        Teknisi: r.technician_name,
        Area: r.technician_area,
        Perangkat: r.device_name,
        Tipe: r.device_type,
        Kode: r.device_code,
        Serial: r.serial_number,
        STO: r.device_sto,
        Ruangan: r.room,
        IP: r.ip,
        Status: r.status,
        "Total Port": r.port_capacity,
        Idle: r.port_idle,
        LAN: r.port_lan,
        SFP: r.port_sfp,
        Baik: r.port_good,
        Rusak: r.port_bad,
        "Ping DNS": r.ping_dns,
        Redaman: r.attenuation,
        "Ping Client": r.ping_client,
        "Speed Test": r.speed_test,
        Tindakan: r.action,
        Catatan: r.notes,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan PMR");
    XLSX.writeFile(
      workbook,
      `Laporan_PMR_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.xlsx`,
    );
  };

  const role = user?.role?.toLowerCase();

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handlePrint = (report) => {
    const printWindow = window.open("", "_blank");
    const date = new Date(report.maintenance_date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    let photos = [];
    try {
      if (report.maintenance_photo) {
        let p = report.maintenance_photo;
        while (
          typeof p === "string" &&
          (p.startsWith("[") || p.startsWith('"{'))
        ) {
          p = JSON.parse(p);
        }
        photos = Array.isArray(p) ? p : [p];
      }
    } catch (e) {
      console.error("Error parsing photos", e);
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan PMR - ${report.device_name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.2; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
            .header h1 { margin: 0; color: #1e40af; font-size: 18px; }
            .header p { margin: 2px 0; font-size: 12px; color: #666; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #1e40af; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .field { margin-bottom: 4px; }
            .label { font-size: 9px; color: #888; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 12px; font-weight: bold; }
            .status-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
            .status-Operated { background: #ecfdf5; color: #065f46; }
            .status-Maintenance { background: #fffbeb; color: #92400e; }
            .status-Rusak { background: #fef2f2; color: #991b1b; }
            .notes { background: #f8fafc; padding: 8px; border-radius: 5px; font-size: 11px; font-style: italic; }
            .doc-container { display: flex; flex-wrap: wrap; gap: 10px; }
            .doc-img { width: 150px; height: 150px; object-fit: cover; border-radius: 5px; border: 1px solid #eee; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN PREVENTIVE MAINTENANCE</h1>
            <p>Sistem Manajemen Inventaris Perangkat Jaringan</p>
          </div>

          <div class="section">
            <div class="grid">
              <div class="field">
                <div class="label">Tanggal Maintenance</div>
                <div class="value">${date}</div>
              </div>
              <div class="field">
                <div class="label">Status Perangkat</div>
                <div class="status-tag status-${report.status}">${report.status}</div>
              </div>
              <div class="field">
                <div class="label">Teknisi Lapangan</div>
                <div class="value">${report.technician_name}</div>
              </div>
              <div class="field">
                <div class="label">Area / Lokasi</div>
                <div class="value">${report.technician_area}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informasi Perangkat</div>
            <div class="grid">
              <div class="field"><div class="label">Nama Perangkat</div><div class="value">${report.device_name}</div></div>
              <div class="field"><div class="label">ID / Serial</div><div class="value">${report.device_code} / ${report.serial_number}</div></div>
              <div class="field"><div class="label">IP Address</div><div class="value">${report.ip}</div></div>
              <div class="field"><div class="label">Lokasi / STO</div><div class="value">${report.device_sto} - ${report.room}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detail Kapasitas Port</div>
            <div class="grid" style="grid-template-columns: repeat(4, 1fr);">
              <div class="field"><div class="label">Total</div><div class="value">${report.port_capacity}</div></div>
              <div class="field"><div class="label">Idle</div><div class="value">${report.port_idle}</div></div>
              <div class="field"><div class="label">LAN</div><div class="value">${report.port_lan || 0}</div></div>
              <div class="field"><div class="label">SFP</div><div class="value">${report.port_sfp || 0}</div></div>
              <div class="field"><div class="label">Baik</div><div class="value" style="color: #059669;">${report.port_good || 0}</div></div>
              <div class="field"><div class="label">Rusak</div><div class="value" style="color: #dc2626;">${report.port_bad || 0}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Hasil Tes Koneksi</div>
            <div class="grid">
              <div class="field"><div class="label">Ping DNS</div><div class="value">${report.ping_dns || "-"}</div></div>
              <div class="field"><div class="label">Redaman</div><div class="value">${report.attenuation || "-"}</div></div>
              <div class="field"><div class="label">Ping Client</div><div class="value">${report.ping_client || "-"}</div></div>
              <div class="field"><div class="label">Speed Test</div><div class="value">${report.speed_test || "-"}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Dokumentasi</div>
            ${
              photos.length > 0
                ? `
                <div style="margin-bottom: 10px;">
                    <div style="font-size: 10px; font-weight: bold; color: #666; margin-bottom: 5px;">Kegiatan</div>
                    <div class="doc-container">
                        ${photos.map((p) => `<img src="${p}" class="doc-img" />`).join("")}
                    </div>
                </div>
            `
                : ""
            }
            ${
              report.fuel_receipt
                ? `
                <div>
                    <div style="font-size: 10px; font-weight: bold; color: #666; margin-bottom: 5px;">Nota BBM</div>
                    <div class="doc-container">
                        <img src="${report.fuel_receipt}" class="doc-img" />
                    </div>
                </div>
            `
                : ""
            }
          </div>

          <div class="section">
            <div class="section-title">Tindakan & Catatan</div>
            <div class="field">
              <div class="label">Tindakan</div>
              <div class="value">${report.action}</div>
            </div>
            <div class="field" style="margin-top: 5px;">
              <div class="label">Catatan Tambahan</div>
              <div class="notes">${report.notes || "-"}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPmrReports({
        area_id:
          role !== "admin" && role !== "super officer" && role !== "root"
            ? user?.area_id
            : filters.area_id || null,
        role: role,
        user_id:
          role === "admin" || role === "super officer" || role === "root" ? undefined : user?.id,
        search,
        sto_id: filters.sto_id,
        status: filters.status,
        start_date: filters.start_date,
        end_date: filters.end_date,
      });

      // Normalisasi status data secara menyeluruh
      const normalizedData = data.map((report) => {
        const rawStatus = String(report.status || "")
          .trim()
          .toLowerCase();
        let finalStatus = report.status;

        if (rawStatus === "baik" || rawStatus === "operated") {
          finalStatus = "Operated";
        } else if (
          rawStatus === "perlu perbaikan" ||
          rawStatus === "maintenance" ||
          rawStatus === "perbaikan"
        ) {
          finalStatus = "Maintenance";
        } else if (rawStatus === "rusak" || rawStatus === "problem") {
          finalStatus = "Rusak";
        }

        return { ...report, status: finalStatus };
      });

      setReports(normalizedData);
    } catch (err) {
      const message =
        err.message ||
        "The server returned an unexpected response. Please try again later.";
      setError(message);
      showNotify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const data = await fetchInventoryOptions({ role, email: user?.email });
      setOptions({
        areas: data.areas || [],
        stos: data.stos || [],
      });
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, search]);

  const sortedReports = useMemo(() => {
    let sortableReports = [...reports];
    if (sortConfig !== null) {
      sortableReports.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle specific fields
        if (sortConfig.key === "maintenance_date") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableReports;
  }, [reports, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const stats = useMemo(() => {
    return {
      total: reports.length,
      normal: reports.filter((r) => r.status === "Operated").length,
      perhatian: reports.filter(
        (r) => r.status === "Maintenance" || r.status === "Rusak",
      ).length,
      teknisi: new Set(reports.map((r) => r.user_id)).size,
    };
  }, [reports]);

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "operated")
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s === "maintenance")
      return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-rose-50 text-rose-700 border-rose-100";
  };

  const filteredStosForDraft = useMemo(() => {
    const targetAreaId =
      role !== "admin" && role !== "super officer"
        ? user?.area_id
        : draftFilters.area_id;
    if (!targetAreaId) return options.stos;
    return options.stos.filter((s) => s.area_id == targetAreaId);
  }, [options.stos, draftFilters.area_id, user?.area_id, role]);

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "area_id") next.sto_id = "";
      return next;
    });
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setSearch(draftSearch);
  };

  const handleResetFilters = () => {
    const initial = {
      area_id:
        role !== "admin" && role !== "super officer" ? user?.area_id : "",
      sto_id: "",
      status: "",
      start_date: "",
      end_date: "",
    };
    setDraftFilters(initial);
    setFilters(initial);
    setSearch("");
    setDraftSearch("");
  };

  const setStatusFilter = (status) => {
    const nextFilters = { ...filters, status };
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
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
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 md:hidden" />
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                  PMR / <span className="text-blue-600">LAPORAN</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Laporan Preventive Maintenance
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter shadow-md shadow-blue-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
                title="Lihat Profil"
              >
                {user.name?.charAt(0)}
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <ErrorAlert message={error} onRetry={loadData} />

          {/* Stats Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              {
                title: "TOTAL LAPORAN",
                value: stats.total,
                icon: <HistoryIcon />,
                color: "bg-blue-600",
                onClick: () => handleResetFilters(),
              },
              {
                title: "KONDISI BAIK",
                value: stats.normal,
                icon: <VerifiedIcon />,
                color: "bg-emerald-500",
                onClick: () => setStatusFilter("Operated"),
              },
              {
                title: "PERLU ATENSI",
                value: stats.perhatian,
                icon: <BoltIcon />,
                color: "bg-amber-500",
                onClick: () => setStatusFilter("Maintenance"),
              },
              {
                title: "TOTAL TEKNISI",
                value: stats.teknisi,
                icon: <PersonIcon />,
                color: "bg-indigo-500",
                onClick: null,
              },
            ].map((c, i) => (
              <div
                key={i}
                onClick={c.onClick}
                className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${c.onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                      {c.title}
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900">
                      {c.value}
                    </p>
                  </div>
                  <div
                    className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-lg ${c.color} text-white`}
                  >
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Filter Bar */}
          <section className="bg-white rounded-3xl md:rounded-4xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
                <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg md:text-xl">
                  <SearchIcon />
                </span>
                <input
                  className="bg-transparent outline-none text-xs md:text-sm font-bold w-full text-slate-700 placeholder:text-slate-400"
                  placeholder="Cari Teknisi atau Perangkat..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">
                    Tgl Awal
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all"
                    value={draftFilters.start_date}
                    onChange={(e) =>
                      handleDraftFilterChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div className="relative flex-1 sm:w-44">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10">
                    Tgl Akhir
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-white transition-all"
                    value={draftFilters.end_date}
                    onChange={(e) =>
                      handleDraftFilterChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-center gap-3 flex-1">
                <select
                  className={`w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all appearance-none pr-10 ${
                    role !== "admin" && role !== "super officer"
                      ? "opacity-50 cursor-not-allowed bg-slate-100"
                      : "cursor-pointer"
                  }`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={
                    role !== "admin" && role !== "super officer"
                      ? user.area_id
                      : draftFilters.area_id
                  }
                  disabled={role !== "admin" && role !== "super officer"}
                  onChange={(e) =>
                    handleDraftFilterChange("area_id", e.target.value)
                  }
                >
                  <option value="">Semua Area</option>
                  {options.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all cursor-pointer appearance-none pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={draftFilters.sto_id}
                  onChange={(e) =>
                    handleDraftFilterChange("sto_id", e.target.value)
                  }
                >
                  <option value="">Semua STO</option>
                  {filteredStosForDraft.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all cursor-pointer appearance-none pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.85rem",
                  }}
                  value={draftFilters.status}
                  onChange={(e) =>
                    handleDraftFilterChange("status", e.target.value)
                  }
                >
                  <option value="">Semua Status</option>
                  <option value="Operated">Operated</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                <button
                  onClick={handleExport}
                  className="flex-1 xl:flex-none px-6 md:px-8 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileUploadIcon sx={{ fontSize: 16 }} /> EXPORT
                </button>

                <button
                  onClick={handleApplyFilters}
                  className="flex-1 xl:flex-none px-6 md:px-8 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  TERAPKAN FILTER
                </button>

                <button
                  onClick={handleResetFilters}
                  className="h-11 w-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-500
          hover:bg-rose-50 transition-all shadow-sm shrink-0"
                  title="Reset Semua"
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>
          </section>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1"
                      onClick={() => handleSort("maintenance_date")}
                    >
                      WAKTU
                      {sortConfig.key === "maintenance_date" &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                        ))}
                    </th>
                    <th
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleSort("device_name")}
                    >
                      <div className="flex items-center gap-1">
                        PERANGKAT
                        {sortConfig.key === "device_name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleSort("technician_name")}
                    >
                      <div className="flex items-center gap-1">
                        TEKNISI
                        {sortConfig.key === "technician_name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        STATUS
                        {sortConfig.key === "status" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
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
                        colSpan={5}
                        className="px-6 py-10 text-center text-slate-400 font-bold animate-pulse"
                      >
                        Memuat riwayat maintenance...
                      </td>
                    </tr>
                  ) : sortedReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <HistoryIcon
                            sx={{ fontSize: 48 }}
                            className="text-slate-200"
                          />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                            Belum ada riwayat PMR
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-900">
                            {new Date(
                              report.maintenance_date,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                            Sub:{" "}
                            {new Date(report.created_at).toLocaleString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Jakarta",
                                hour12: false,
                              },
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <StorageIcon sx={{ fontSize: 16 }} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">
                                {report.device_name}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">
                                {report.device_code} · {report.device_sto}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black uppercase">
                              {report.technician_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-700">
                                {report.technician_name}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">
                                {report.technician_area}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(report.status)}`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetail(report)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                              title="Lihat Detail"
                            >
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              onClick={() => handlePrint(report)}
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                              title="Download PDF"
                            >
                              <FileDownloadIcon sx={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-10 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">
                  Memuat Data...
                </div>
              ) : reports.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Tidak ada laporan
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <StorageIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {report.device_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {report.device_code}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                          report.status === "Operated"
                            ? "bg-emerald-50 text-emerald-700"
                            : report.status === "Maintenance"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-3">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          Waktu
                        </p>
                        <p className="text-[10px] font-bold text-slate-700">
                          {new Date(report.maintenance_date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              timeZone: "Asia/Jakarta",
                            },
                          )}{" "}
                          ·{" "}
                          {new Date(report.created_at).toLocaleString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          Teknisi
                        </p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">
                          {report.technician_name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                          {report.technician_area}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          Lokasi STO
                        </p>
                        <p className="text-[10px] font-bold text-slate-700">
                          {report.device_sto}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(report)}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <VisibilityIcon sx={{ fontSize: 14 }} /> DETAIL
                      </button>
                      <button
                        onClick={() => handlePrint(report)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <FileDownloadIcon sx={{ fontSize: 14 }} /> PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 py-8">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[95vh] md:max-h-[90vh] flex flex-col">
            <header className="p-5 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div
                  className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    selectedReport.status === "Operated"
                      ? "bg-emerald-500 shadow-emerald-100"
                      : selectedReport.status === "Maintenance"
                        ? "bg-amber-500 shadow-amber-100"
                        : "bg-rose-500 shadow-rose-100"
                  }`}
                >
                  <HistoryIcon />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                    Detail Laporan PMR
                  </h2>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Laporan ID: PMR-{selectedReport.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handlePrint(selectedReport)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] md:text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <PrintIcon sx={{ fontSize: 16 }} /> CETAK PDF
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center"
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Section 1: General Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <PublicIcon sx={{ fontSize: 14 }} /> Informasi Umum
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Tanggal
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {new Date(
                              selectedReport.maintenance_date,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Status Akhir
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                              selectedReport.status === "Operated"
                                ? "bg-emerald-100 text-emerald-700"
                                : selectedReport.status === "Maintenance"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {selectedReport.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Teknisi
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {selectedReport.technician_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Area
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {selectedReport.technician_area}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LocalGasStationIcon sx={{ fontSize: 14 }} /> Logistik &
                      Perjalanan
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                          <RouteIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Jarak Tempuh
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {selectedReport.distance} KM
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Estimasi BBM
                        </p>
                        <p className="text-sm font-black text-emerald-600">
                          Rp {selectedReport.fuel_cost?.toLocaleString()}
                        </p>
                      </div>
                    </div>{" "}
                  </div>
                </div>

                {/* Section 2: Device Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <RouterIcon sx={{ fontSize: 14 }} /> Detail Perangkat
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Nama / Tipe
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase">
                            {selectedReport.device_name} (
                            {selectedReport.device_type})
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            ID / SN
                          </p>
                          <p className="text-sm font-black text-slate-700 uppercase">
                            {selectedReport.device_code}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            IP Address
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {selectedReport.ip}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Lokasi / STO
                          </p>
                          <p className="text-sm font-black text-slate-700">
                            {selectedReport.device_sto} · {selectedReport.room}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LanIcon sx={{ fontSize: 14 }} /> Kapasitas Port
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Total",
                          val: selectedReport.port_capacity,
                          color: "text-slate-700",
                        },
                        {
                          label: "Idle",
                          val: selectedReport.port_idle,
                          color: "text-slate-400",
                        },
                        {
                          label: "LAN",
                          val: selectedReport.port_lan || 0,
                          color: "text-blue-600",
                        },
                        {
                          label: "SFP",
                          val: selectedReport.port_sfp || 0,
                          color: "text-indigo-600",
                        },
                        {
                          label: "Baik",
                          val: selectedReport.port_good || 0,
                          color: "text-emerald-600",
                        },
                        {
                          label: "Rusak",
                          val: selectedReport.port_bad || 0,
                          color: "text-rose-600",
                        },
                      ].map((p, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-xl p-3 text-center"
                        >
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                            {p.label}
                          </p>
                          <p className={`text-sm font-black ${p.color}`}>
                            {p.val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Connectivity Test */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <SpeedIcon sx={{ fontSize: 14 }} /> Hasil Tes Koneksi
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">
                        Ping DNS
                      </p>
                      <p className="text-sm font-black text-blue-700">
                        {selectedReport.ping_dns || "-"}
                      </p>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">
                        Redaman
                      </p>
                      <p className="text-sm font-black text-indigo-700">
                        {selectedReport.attenuation || "-"}
                      </p>
                    </div>
                    <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-violet-400 uppercase mb-1">
                        Ping Client
                      </p>
                      <p className="text-sm font-black text-violet-700">
                        {selectedReport.ping_client || "-"}
                      </p>
                    </div>
                    <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-cyan-400 uppercase mb-1">
                        Speed Test
                      </p>
                      <p className="text-sm font-black text-cyan-700">
                        {selectedReport.speed_test || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Photos */}
                <div className="md:col-span-2 space-y-3 relative">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <PhotoCameraIcon sx={{ fontSize: 14 }} /> Dokumentasi
                  </h3>

                  {imageLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}

                  {/* Tambah Foto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-blue-300 transition-all">
                      <FileUploadIcon className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">
                        Upload Foto Kegiatan
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          addPmrImages(
                            selectedReport.id,
                            Array.from(e.target.files),
                            "photo",
                          )
                        }
                      />
                    </label>
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-blue-300 transition-all">
                      <FileUploadIcon className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">
                        Upload Nota BBM
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          addPmrImages(
                            selectedReport.id,
                            [e.target.files[0]],
                            "receipt",
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReport.maintenance_photo &&
                      (() => {
                        try {
                          let photos = selectedReport.maintenance_photo;
                          if (typeof photos === "string") {
                            while (
                              typeof photos === "string" &&
                              (photos.startsWith("[") ||
                                photos.startsWith('"{'))
                            ) {
                              photos = JSON.parse(photos);
                            }
                          }

                          if (Array.isArray(photos)) {
                            return (
                              <div className="space-y-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                  Foto Kegiatan
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {photos.map((p, idx) => (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={p}
                                        alt={`Kegiatan ${idx}`}
                                        onClick={() => setActiveImage(p)}
                                        className="rounded-2xl w-24 h-24 object-cover border border-slate-100 cursor-pointer hover:opacity-80"
                                      />
                                      <button
                                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deletePmrImage(
                                            selectedReport.id,
                                            idx,
                                          );
                                        }}
                                      >
                                        <CloseIcon sx={{ fontSize: 12 }} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-2">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                  Foto Kegiatan
                                </p>
                                <div className="relative inline-block">
                                  <img
                                    src={photos}
                                    alt="Foto Kegiatan"
                                    onClick={() => setActiveImage(photos)}
                                    className="rounded-2xl w-full h-48 object-cover border border-slate-100 cursor-pointer hover:opacity-80"
                                  />
                                  <button
                                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePmrImage(selectedReport.id, 0);
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 12 }} />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          return (
                            <div className="space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">
                                Foto Kegiatan
                              </p>
                              <div className="relative inline-block">
                                <img
                                  src={selectedReport.maintenance_photo}
                                  alt="Foto Kegiatan"
                                  onClick={() =>
                                    setActiveImage(
                                      selectedReport.maintenance_photo,
                                    )
                                  }
                                  className="rounded-2xl w-full h-48 object-cover border border-slate-100 cursor-pointer hover:opacity-80"
                                />
                                <button
                                  className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePmrImage(selectedReport.id, 0);
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </button>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    {selectedReport.fuel_receipt && (
                      <div className="space-y-2 relative">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Nota BBM
                        </p>
                        <div className="relative inline-block">
                          <img
                            src={selectedReport.fuel_receipt}
                            alt="Nota BBM"
                            onClick={() =>
                              setActiveImage(selectedReport.fuel_receipt)
                            }
                            className="rounded-2xl w-full h-48 object-cover border border-slate-100 cursor-pointer hover:opacity-80"
                          />
                          <button
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePmrImage(selectedReport.id, "receipt");
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Action & Notes */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BuildIcon sx={{ fontSize: 14 }} /> Tindakan & Catatan
                  </h3>
                  <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                        Tindakan Maintenance
                      </p>
                      <p className="text-sm font-black text-blue-400 uppercase tracking-tight">
                        {selectedReport.action}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">
                        Catatan Teknisi
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "
                        {selectedReport.notes ||
                          "Tidak ada catatan tambahan untuk laporan ini."}
                        "
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-8 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                Simpan Detail Laporan
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {activeImage && (
        <div
          className="fixed inset-0 z-3000 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <img
            src={activeImage}
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setActiveImage(null)}
          >
            <CloseIcon sx={{ fontSize: 32 }} />
          </button>
        </div>
      )}
    </div>
  );
}
