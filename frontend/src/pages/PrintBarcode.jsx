import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import {
  fetchInventoryDevices,
  fetchInventoryOptions,
} from "../services/inventoryService";

import Sidebar from "../components/Sidebar";
import ErrorAlert from "../components/ErrorAlert";
import Toast from "../components/Toast";

import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RouterIcon from "@mui/icons-material/Router";

export default function PrintBarcode() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [options, setOptions] = useState({
    areas: [],
    stos: [],
  });

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    area_id: "",
    sto_id: "",
  });

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const role = user?.role?.toLowerCase();
  const isSuperUser = ["admin", "super officer"].includes(role);
  const canPrint = ["admin", "super officer", "officer"].includes(role);

  useEffect(() => {
    if (!user || !canPrint) {
      navigate("/dashboard", { replace: true });
      return;
    }
    loadOptions();
    loadData();
  }, [user, navigate, filters, search]);

  const loadOptions = async () => {
    try {
      const o = await fetchInventoryOptions({ role, email: user.email });
      setOptions(o);
      // Auto-select area if only one available (for non-superusers)
      if (!isSuperUser && o.areas.length === 1 && !filters.area_id) {
        setFilters((prev) => ({ ...prev, area_id: o.areas[0].id }));
      }
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    // Enforce area filter for non-superusers
    const effectiveFilters = { ...filters };
    if (!isSuperUser && user?.area_id) {
      effectiveFilters.area_id = user.area_id;
    }

    try {
      const d = await fetchInventoryDevices({
        role,
        email: user.email,
        search,
        ...effectiveFilters,
        limit: 100, // Load more for bulk printing
      });
      setItems(d.items);
    } catch (err) {
      setError(err.message);
      showNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredStos = useMemo(() => {
    const targetAreaId =
      !isSuperUser && user?.area_id ? user.area_id : filters.area_id;
    if (!targetAreaId) return options.stos;
    return options.stos.filter((s) => s.area_id == targetAreaId);
  }, [options.stos, filters.area_id, isSuperUser, user?.area_id]);

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      showNotify("Pilih minimal satu perangkat", "warning");
      return;
    }

    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    const printWindow = window.open("", "_blank");

    let htmlContent = `
      <html>
        <head>
          <title>Bulk Print QR Codes</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: 'Courier New', Courier, monospace;
              margin: 0;
              padding: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(5, 3.5cm);
              gap: 0.5cm;
            }
            .label {
              width: 3.5cm;
              height: 3.5cm;
              border: 1px solid #ddd;
              padding: 2px;
              text-align: center;
              border-radius: 4px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              break-inside: avoid;
              overflow: hidden;
            }
            .device-name { font-weight: bold; font-size: 8px; margin-bottom: 1px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
            .device-info { font-size: 7px; margin-bottom: 1px; color: #555; }
            .sn { font-weight: 900; font-size: 7px; margin-top: 1px; }
            img { width: 1.8cm; height: 1.8cm; margin: 1px 0; }
            @media print {
              .label { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
    `;

    selectedItems.forEach((item) => {
      const scanUrl = `${window.location.origin}/scan/${encodeURIComponent(item.serialNumber)}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;

      htmlContent += `
        <div class="label">
          <div class="device-name">${item.name}</div>
          <img src="${qrCodeUrl}" />
          <div class="sn">${item.serialNumber}</div>
        </div>
      `;
    });

    htmlContent += `
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <Toast
        {...notification}
        onClose={() => setNotification({ ...notification, open: false })}
      />

      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-1050 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                INVENTARIS / <span className="text-blue-600">BULK PRINT</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                Print Barcode
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintSelected}
              disabled={selectedIds.length === 0}
              className="hidden md:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
            >
              <PrintIcon fontSize="small" /> Print ({selectedIds.length})
            </button>
            <Link
              to="/profile"
              className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200 uppercase hover:scale-110 transition-transform text-sm"
              title="Lihat Profil"
            >
              {user?.name?.charAt(0)}
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8 pb-24">
          <ErrorAlert message={error} onRetry={loadData} />

          {/* Filters */}
          <section className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 mb-8 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/50 transition-all group">
                <SearchIcon className="text-slate-400 group-focus-within:text-blue-500" />
                <input
                  className="bg-transparent outline-none text-sm font-bold w-full text-slate-700"
                  placeholder="Cari ID, Nama, atau SN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:w-1/2">
                <select
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={filters.area_id}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      area_id: e.target.value,
                      sto_id: "",
                    })
                  }
                  disabled={!isSuperUser}
                >
                  <option value="">
                    {isSuperUser ? "Semua Area" : user?.area || "Area Saya"}
                  </option>
                  {options.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 outline-none"
                  value={filters.sto_id}
                  onChange={(e) =>
                    setFilters({ ...filters, sto_id: e.target.value })
                  }
                >
                  <option value="">Semua STO</option>
                  {filteredStos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSearch("");
                  const initialFilters = {
                    area_id: !isSuperUser ? user?.area_id || "" : "",
                    sto_id: "",
                  };
                  setFilters(initialFilters);
                  setSelectedIds([]);
                }}
                className="h-11 w-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                title="Reset Filters"
              >
                <RefreshIcon />
              </button>
            </div>
          </section>

          {/* List */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 w-12">
                      <button
                        onClick={handleSelectAll}
                        className="text-blue-600"
                      >
                        {selectedIds.length === items.length &&
                        items.length > 0 ? (
                          <CheckBoxIcon />
                        ) : (
                          <CheckBoxOutlineBlankIcon />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      PERANGKAT
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ID / SERIAL
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      LOKASI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-20 text-center text-xs font-bold text-slate-400 uppercase"
                      >
                        Tidak ada perangkat ditemukan
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className={`group hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.includes(item.id) ? "bg-blue-50/30" : ""}`}
                        onClick={() => handleToggleSelect(item.id)}
                      >
                        <td className="px-6 py-4">
                          <div
                            className={
                              selectedIds.includes(item.id)
                                ? "text-blue-600"
                                : "text-slate-300"
                            }
                          >
                            {selectedIds.includes(item.id) ? (
                              <CheckBoxIcon />
                            ) : (
                              <CheckBoxOutlineBlankIcon />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                              <RouterIcon fontSize="small" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {item.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400">
                                {item.ip}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700">
                            {item.deviceId}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {item.serialNumber}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-900">
                            {item.area}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.sto}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              <div className="p-4 bg-slate-50 flex items-center gap-4">
                <button onClick={handleSelectAll} className="text-blue-600">
                  {selectedIds.length === items.length && items.length > 0 ? (
                    <CheckBoxIcon />
                  ) : (
                    <CheckBoxOutlineBlankIcon />
                  )}
                </button>
                <span className="text-xs font-black text-slate-600 uppercase">
                  Pilih Semua ({items.length})
                </span>
              </div>
              {loading ? (
                <div className="p-10 text-center">Memuat data...</div>
              ) : items.length === 0 ? (
                <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase">
                  Tidak ada perangkat
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-center gap-4 ${selectedIds.includes(item.id) ? "bg-blue-50/30" : ""}`}
                    onClick={() => handleToggleSelect(item.id)}
                  >
                    <div
                      className={
                        selectedIds.includes(item.id)
                          ? "text-blue-600"
                          : "text-slate-300"
                      }
                    >
                      {selectedIds.includes(item.id) ? (
                        <CheckBoxIcon />
                      ) : (
                        <CheckBoxOutlineBlankIcon />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 font-mono">
                        {item.deviceId} • {item.serialNumber}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">
                        {item.area} / {item.sto}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

        {/* Sticky Print Button (Footer) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] md:hidden z-1050">
          <button
            onClick={handlePrintSelected}
            disabled={selectedIds.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            <PrintIcon fontSize="small" /> Print ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
