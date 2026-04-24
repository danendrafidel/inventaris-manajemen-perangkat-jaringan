import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import {
  fetchInventoryDevices,
  fetchInventoryOptions,
  fetchInventoryStats,
  createInventoryDevice,
  deleteInventoryDevice,
  updateInventoryDevice,
} from "../services/inventoryService";

// Modular Components
import Sidebar from "../components/Sidebar";
import StatusPill from "../components/StatusPill";
import Barcode from "../components/Barcode";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";

// MUI Icons
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import RouterIcon from "@mui/icons-material/Router";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoIcon from "@mui/icons-material/Info";
import HubIcon from "@mui/icons-material/Hub";
import PrintIcon from "@mui/icons-material/Print";
import InventoryIcon from "@mui/icons-material/Inventory";
import VerifiedIcon from "@mui/icons-material/Verified";
import BoltIcon from "@mui/icons-material/Bolt";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({
    regions: [],
    stos: [], // Now expected to be [{id, name, area_id}, ...]
    areas: [], // Now expected to be [{id, name}, ...]
    statuses: [],
    deviceTypes: [],
  });

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState({
    sto_id: "",
    area_id: "",
    status: "",
  });
  const [draftFilters, setDraftFilters] = useState({
    sto_id: "",
    area_id: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    deviceId: "",
    ip: "",
    name: "",
    deviceType: "",
    storageLocation: "",
    serialNumber: "",
    status: "",
    room: "",
    area_id: "",
    sto_id: "",
    totalPort: "",
    idlePort: "",
  });

  // Filtered STOs based on current Area selection
  const filteredStosForDraft = useMemo(() => {
    if (!draftFilters.area_id) return options.stos;
    return options.stos.filter((s) => s.area_id == draftFilters.area_id);
  }, [options.stos, draftFilters.area_id]);

  const filteredStosForForm = useMemo(() => {
    if (!formData.area_id) return options.stos;
    return options.stos.filter((s) => s.area_id == formData.area_id);
  }, [options.stos, formData.area_id]);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const DEVICE_STATUSES = ["OPERATED", "MAINTENANCE", "RUSAK"];

  const role = user?.role;
  const canEdit = role === "admin" || role === "officer" || role === "user";
  const canDelete = role === "admin" || role === "officer" || role === "user";
  const canAdd = role === "admin" || role === "officer" || role === "user";

  const totalPages = useMemo(
    () => Math.ceil(total / limit) || 1,
    [total, limit],
  );

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    
    // Only set default filters if they are not yet set
    if (role !== "admin" && !filters.area_id && user.area_id) {
        const defaultFilters = { ...filters, area_id: user.area_id };
        setFilters(defaultFilters);
        setDraftFilters(defaultFilters);
        return; // The next effect trigger will call loadData with the new filters
    }
    
    loadData();
  }, [user, page, search, filters, role]);

  const loadData = async () => {
    console.log("Fetching data with filters:", filters);
    setLoading(true);
    setError("");

    const roleParams = {};
    if (role !== "admin") {
      roleParams.area_id = user.area_id;
    }

    try {
      const [s, o, d] = await Promise.all([
        fetchInventoryStats({
          role,
          email: user.email,
          ...roleParams,
          area_id: filters.area_id || roleParams.area_id,
        }),
        fetchInventoryOptions({ role, email: user.email }),
        fetchInventoryDevices({
          role,
          email: user.email,
          search,
          page,
          limit,
          ...filters,
          ...roleParams,
        }),
      ]);
      setStats(s);
      setOptions(o);
      setItems(d.items);
      setTotal(d.total);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      deviceId: "",
      ip: "",
      name: "",
      deviceType: "",
      storageLocation: "",
      serialNumber: "",
      status: "OPERATED",
      room: "",
      area_id: role !== "admin" ? user.area_id : "",
      sto_id: "",
      totalPort: "",
      idlePort: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      ...item,
      area_id: item.area_id || "",
      sto_id: item.sto_id || "",
    });
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleAction = async (e, actionType) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (actionType === "add") await createInventoryDevice(formData);
      else await updateInventoryDevice(selectedItem.id, formData);
      setShowAddModal(false);
      setShowEditModal(false);
      showNotify(
        actionType === "add"
          ? "Perangkat berhasil didaftarkan"
          : "Perangkat berhasil diperbarui",
      );
      loadData();
    } catch (err) {
      showNotify(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Hapus perangkat ${name}?`)) {
      try {
        await deleteInventoryDevice(id);
        showNotify("Perangkat berhasil dihapus");
        loadData();
      } catch (err) {
        showNotify(err.message, "error");
      }
    }
  };

  const handleOpenBarcodePreview = (item) => {
    setSelectedItem(item);
    setShowBarcodeModal(true);
  };

  const executePrint = (item) => {
    const printWindow = window.open("", "_blank", "width=600,height=400");

    // Simulating the barcode SVG content
    const lines = Array.from({ length: 50 })
      .map((_, i) => {
        const x = 10 + i * 3.8;
        const width = i % 3 === 0 ? "2.5" : i % 5 === 0 ? "1" : "1.5";
        return `<rect x="${x}" y="5" width="${width}" height="40" fill="black" />`;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${item.deviceId}</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              margin: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              background: white;
              font-family: 'Courier New', Courier, monospace;
            }
            .label {
              border: 2px solid #000;
              padding: 30px;
              text-align: center;
              width: fit-content;
              border-radius: 15px;
            }
            .device-name { font-weight: bold; font-size: 20px; margin-bottom: 5px; text-transform: uppercase; }
            .device-info { font-size: 14px; margin-bottom: 20px; color: #333; }
            .sn { margin-top: 15px; font-weight: 900; letter-spacing: 3px; font-size: 14px; }
            svg { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="device-name">${item.name}</div>
            <div class="device-info">${item.deviceId} | ${item.area} - ${item.sto}</div>
            <svg width="250" height="80" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
              ${lines}
            </svg>
            <div class="sn">${item.serialNumber}</div>
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

  const handleDraftFilterChange = (key, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "area_id") next.sto_id = ""; // Reset STO if Area changes
      return next;
    });
  };

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
    setSearch(draftSearch);
    setPage(1);
  };

  const handleResetFilters = () => {
    const initial = {
      sto_id: "",
      area_id: role !== "admin" ? user.area_id : "",
      status: "",
    };
    setDraftFilters(initial);
    setFilters(initial);
    setSearch("");
    setDraftSearch("");
    setPage(1);
  };

  if (!user) return null;

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
        {/* Topbar */}
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 md:hidden shrink-0" />{" "}
            {/* Spacer for mobile toggle */}
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                DASHBOARD / <span className="text-blue-600">INVENTARIS</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                Manajemen Perangkat Jaringan
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5 shrink-0 ml-4">
            <Link
              to="/profile"
              className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter shadow-md shadow-blue-200 uppercase hover:scale-110 transition-transform text-sm md:text-base"
              title="Lihat Profil"
            >
              {user.name?.charAt(0)}
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-full overflow-hidden">
          <ErrorAlert message={error} onRetry={() => loadData()} />
          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              {
                title: "TOTAL PERANGKAT",
                value: stats?.stats?.totalDevices ?? 0,
                icon: <InventoryIcon />,
                color: "bg-blue-600",
              },
              {
                title: "KONDISI BAIK",
                value: stats?.stats?.statusBaik ?? 0,
                icon: <VerifiedIcon />,
                color: "bg-emerald-500",
              },
              {
                title: "PERLU ATENSI",
                value: (stats?.stats?.perluPerhatian ?? 0) + (items.filter(i => i.status === "RUSAK").length),
                icon: <BoltIcon />,
                color: "bg-amber-500",
              },
              {
                title: "CAKUPAN AREA",
                value: stats?.stats?.areaTercoverCount ?? 0,
                icon: <PublicIcon />,
                color: "bg-indigo-500",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                      {c.title}
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {c.value}
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-lg ${c.color} text-white`}
                  >
                    {c.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Search & Filter Bar */}
          <section className="bg-white rounded-3xl md:rounded-4xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-5">
            {/* Top Row: Wide Search Input */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-5 py-3 md:py-3.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
              <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg md:text-xl">
                <SearchIcon />
              </span>
              <input
                className="bg-transparent outline-none text-xs md:text-sm font-bold w-full text-slate-700 placeholder:text-slate-400"
                placeholder="Cari ID, Nama, atau SN..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>

            {/* Bottom Row: Dropdowns & Action Buttons */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-center gap-3 flex-1">
                <select
                  className={`w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-white transition-all appearance-none pr-10 ${
                    role !== "admin"
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
                  value={role !== "admin" ? user.area_id : draftFilters.area_id}
                  disabled={role !== "admin"}
                  onChange={(e) =>
                    handleDraftFilterChange("area_id", e.target.value)
                  }
                >
                  <option value="">Area</option>
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
                  <option value="">STO</option>
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
                <option value="">Status</option>
                {DEVICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                </select>              </div>

              <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 xl:flex-none px-6 md:px-8 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  TERAPKAN FILTER
                </button>

                <button
                  onClick={handleResetFilters}
                  className="h-11 w-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm shrink-0"
                  title="Reset Semua"
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>
          </section>

          {/* Table / Card Container */}
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-lg md:text-xl shrink-0">
                  <FolderIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
                    Daftar Perangkat Jaringan
                  </h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {total} TOTAL ENTITIES
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {canAdd && (
                  <button
                    onClick={handleOpenAdd}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    <AddIcon fontSize="small" /> NEW DEVICE
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        DEVICE IDENTITY
                        {sortConfig.key === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("deviceId")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        ID / SERIAL
                        {sortConfig.key === "deviceId" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("area")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        LOCATION
                        {sortConfig.key === "area" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        HEALTH STATUS
                        {sortConfig.key === "status" &&
                          (sortConfig.direction === "asc" ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                          ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      PORTS (IDLE/TOT)
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      OPERATIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : sortedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-xs font-bold text-slate-400 uppercase"
                      >
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              <RouterIcon />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                                {item.ip}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 font-mono">
                            {item.deviceId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900">
                            {item.area}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {item.sto}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                            <span className="text-sm font-black text-blue-600 tabular-nums">
                              {item.idlePort || 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                              /
                            </span>
                            <span className="text-sm font-black text-slate-900 tabular-nums">
                              {item.totalPort || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenBarcodePreview(item)}
                              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                              title="Cetak Barcode"
                            >
                              <PrintIcon sx={{ fontSize: 18 }} />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                              title="Lihat Detail"
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                                title="Edit Perangkat"
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                title="Hapus Perangkat"
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </button>
                            )}
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
                <div className="py-20 text-center">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-slate-400 uppercase">
                  No matching records found
                </div>
              ) : (
                sortedItems.map((item) => (
                  <div key={item.id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <RouterIcon />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">
                            {item.name}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 font-mono">
                            {item.ip}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Location
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 truncate">
                          {item.area}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                          {item.sto}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Ports (Idle/Tot)
                        </p>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-black text-blue-600">
                            {item.idlePort || 0}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            /
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {item.totalPort || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-[9px] font-bold text-slate-600 font-mono">
                        {item.deviceId}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenBarcodePreview(item)}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                        >
                          <PrintIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 md:p-5 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Page {page} <span className="text-slate-300">/</span>{" "}
                  {totalPages}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-xs uppercase tracking-tighter cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-xs uppercase tracking-tighter cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Form Modal (Add / Edit) */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 py-8 md:py-16">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() =>
              !isSubmitting && (setShowAddModal(false), setShowEditModal(false))
            }
          />
          <div className="relative w-full max-w-4xl bg-white rounded-4xl md:rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg md:text-xl shadow-lg shadow-blue-200">
                    {showEditModal ? <EditIcon /> : <RouterIcon />}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                      {showEditModal ? "Edit Perangkat" : "Register New Device"}
                    </h2>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Network Asset Information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => (
                    setShowAddModal(false),
                    setShowEditModal(false)
                  )}
                  className="h-9 w-9 md:h-10 md:w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <form
                onSubmit={(e) => handleAction(e, showAddModal ? "add" : "edit")}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div className="sm:col-span-2 lg:col-span-3 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <InfoIcon sx={{ fontSize: 14 }} /> IDENTITY & CORE INFO
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      DEVICE ID
                    </label>
                    <input
                      required
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.deviceId}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceId: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      IP ADDRESS
                    </label>
                    <input
                      required
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.ip}
                      onChange={(e) =>
                        setFormData({ ...formData, ip: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      NAMA PERANGKAT / MODEL PERANGKAT
                    </label>
                    <input
                      required
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      TIPE DEVICE
                    </label>
                    <select
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.deviceType}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceType: e.target.value })
                      }
                    >
                      <option value="">Pilih Tipe Device</option>
                      {options.deviceTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      NOMOR SERI
                    </label>
                    <input
                      required
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serialNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      STATUS
                    </label>
                    <select
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      {DEVICE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div className="sm:col-span-2 lg:col-span-3 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <LocationOnIcon sx={{ fontSize: 14 }} /> PLACEMENT &
                    LOCATION
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      AREA
                    </label>
                    <select
                      className={`w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3 text-sm font-bold outline-none transition-all ${role !== 'admin' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      value={formData.area_id}
                      disabled={role !== 'admin'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          area_id: e.target.value,
                          sto_id: "", // Reset STO when area changes
                        })
                      }
                    >
                      <option value="">Pilih Area</option>
                      {options.areas.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      STO
                    </label>
                    <select
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-bold outline-none transition-all"
                      value={formData.sto_id}
                      onChange={(e) =>
                        setFormData({ ...formData, sto_id: e.target.value })
                      }
                    >
                      <option value="">Pilih STO</option>
                      {filteredStosForForm.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      LOKASI PENYIMPANAN
                    </label>
                    <input
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.storageLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storageLocation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      RUANG
                    </label>
                    <input
                      className="w-full rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-xl">
                  <div className="sm:col-span-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <HubIcon sx={{ fontSize: 14 }} /> PORT SPECIFICATION
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      KAPASITAS PORT
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl md:rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 md:py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
                      value={formData.totalPort}
                      onChange={(e) =>
                        setFormData({ ...formData, totalPort: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                      PORT IDLE
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl md:rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 md:py-3 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
                      value={formData.idlePort}
                      onChange={(e) =>
                        setFormData({ ...formData, idlePort: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => (
                      setShowAddModal(false),
                      setShowEditModal(false)
                    )}
                    className="w-full sm:w-auto px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl md:rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all disabled:bg-slate-400"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : showEditModal
                        ? "Update Asset"
                        : "Register Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-2 md:p-4 py-8 md:py-16">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-4xl md:rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
            <div className="h-24 md:h-32 bg-linear-to-br from-slate-800 to-slate-900 relative">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all z-10"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 md:px-10 pb-8 md:pb-10 -mt-12 md:-mt-16 relative">
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-4xl md:rounded-4xl bg-blue-50 border-4 border-white shadow-lg flex items-center justify-center text-3xl md:text-4xl text-blue-600 shrink-0">
                    <RouterIcon sx={{ fontSize: 40 }} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                      {selectedItem.name}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <StatusPill status={selectedItem.status} />
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                        {selectedItem.deviceType}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 scale-90 md:scale-100">
                  <Barcode value={selectedItem.serialNumber} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-3xl md:rounded-4xl p-6 md:p-8 border border-slate-100">
                    <div className="flex items-center gap-3 mb-6 font-black text-[10px] text-blue-600 uppercase tracking-widest">
                      <SettingsIcon sx={{ fontSize: 18 }} /> Core Specifications
                    </div>
                    <div className="grid grid-cols-1 gap-y-4 md:gap-y-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Device ID / IP
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.deviceId} / {selectedItem.ip}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Tipe Device
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.deviceType}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Nomor Seri
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.serialNumber}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Kapasitas Port
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.totalPort} Total
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Port Idle
                        </span>
                        <span className="text-xs md:text-sm font-black text-emerald-600">
                          {selectedItem.idlePort} Available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl md:rounded-4xl p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 font-black text-[10px] text-emerald-600 uppercase tracking-widest">
                      <LocationOnIcon sx={{ fontSize: 18 }} /> Placement Details
                    </div>
                    <div className="grid grid-cols-1 gap-y-4 md:gap-y-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Area
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.area}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Lokasi Penyimpanan
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.storageLocation}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Ruang
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.room}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          STO
                        </span>
                        <span className="text-xs md:text-sm font-black text-slate-900">
                          {selectedItem.sto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-stretch gap-4">
                <button
                  onClick={() => handleOpenBarcodePreview(selectedItem)}
                  className="flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 md:py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-emerald-700 transition-all"
                >
                  <PrintIcon sx={{ fontSize: 18 }} /> Print Barcode Asset
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(selectedItem)}
                    className="flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 md:py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-black transition-all"
                  >
                    <EditIcon sx={{ fontSize: 18 }} /> Update Technical Data
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Hapus ${selectedItem.name}?`)) {
                        handleDelete(selectedItem.id, selectedItem.name);
                        setShowDetailModal(false);
                      }
                    }}
                    className="h-14 md:h-16 w-full sm:w-16 rounded-2xl border-2 border-rose-50 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all shrink-0"
                  >
                    <DeleteIcon sx={{ fontSize: 24 }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Barcode Preview Modal */}
      {showBarcodeModal && selectedItem && (
        <div className="fixed inset-0 z-2010 flex items-center justify-center p-4 py-8 md:py-16">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowBarcodeModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-4xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Pratinjau Label
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Pemeriksaan Sebelum Pencetakan
                  </p>
                </div>
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="h-9 w-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-900 uppercase">
                    {selectedItem.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedItem.deviceId} | {selectedItem.area} -{" "}
                    {selectedItem.sto}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <Barcode value={selectedItem.serialNumber} />
                </div>

                <div className="text-center">
                  <p className="text-xs font-mono font-black text-slate-900 tracking-[0.2em]">
                    {selectedItem.serialNumber}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    executePrint(selectedItem);
                    setShowBarcodeModal(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <PrintIcon sx={{ fontSize: 18 }} /> Cetak Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
