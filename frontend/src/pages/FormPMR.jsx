import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import { fetchAllStos, fetchAllAreas } from "../services/areaService";
import {
  fetchInventoryDevices,
  createPmrReport,
} from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import ErrorAlert from "../components/ErrorAlert";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Icons
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SendIcon from "@mui/icons-material/Send";
import RouterIcon from "@mui/icons-material/Router";

// Fix for default leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to auto-center map when markers change
function MapRecenter({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

export default function FormPMR() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [stos, setStos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [origin, setOrigin] = useState({ name: "", lat: 0, lng: 0 });
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundDevice, setFoundDevice] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // PMR Form Fields
  const [pmrForm, setPmrForm] = useState({
    maintenance_date: new Date().toISOString().split("T")[0],
    status: "Baik",
    action: "",
    notes: "",
    // Data Perangkat (Editable)
    device_type: "",
    serial_number: "",
    sto: "",
    room: "",
    ip: "",
    // Detail Port
    port_capacity: "",
    port_idle: "",
    port_lan: "",
    port_sfp: "",
    port_good: "",
    port_bad: "",
    port_notes: "",
    // Tes Koneksi
    ping_dns: "",
    attenuation: "",
    ping_client: "",
    speed_test: "",
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
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [stoData, areaData] = await Promise.all([
          fetchAllStos(),
          fetchAllAreas(),
        ]);
        setStos(stoData);

        // Set origin based on user office if available, otherwise fallback to area
        if (user.kantor_latitude && user.kantor_longitude) {
          setOrigin({
            name: user.kantor || "Kantor Petugas",
            lat: parseFloat(user.kantor_latitude),
            lng: parseFloat(user.kantor_longitude),
          });
        } else {
          const userArea = areaData.find((a) => a.name === user.area);
          if (userArea) {
            setOrigin({
              name: `Kantor ${userArea.name} (Default)`,
              lat: parseFloat(userArea.latitude),
              lng: parseFloat(userArea.longitude),
            });
          }
        }
      } catch (err) {
        const message =
          "The server returned an unexpected response. Please try again later.";
        setError(message);
        showNotify(message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  // Fetch actual route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (!origin.lat || !destination) return;

      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === "Ok" && data.routes.length > 0) {
          const route = data.routes[0];
          const dist = route.distance / 1000;
          setDistance(dist.toFixed(2));

          // Fuel calc: (Distance / 12 kmpl) * 10,000 IDR
          const fuel = (dist / 12) * 10000;
          setFuelCost(Math.round(fuel));

          // OSRM returns [lng, lat], Leaflet needs [lat, lng]
          const coords = route.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]);
          setRouteCoordinates(coords);
        }
      } catch (err) {
        console.error("Gagal mengambil rute:", err);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  const handleSearchDevice = async () => {
    if (!searchTerm) return;
    try {
      const params = { search: searchTerm };
      if (user.role !== "admin") {
        params.area_id = user.area_id;
      }
      const data = await fetchInventoryDevices(params);
      if (data.items.length > 0) {
        setSearchResults(data.items);
        showNotify(`Ditemukan ${data.items.length} perangkat`);
      } else {
        setSearchResults([]);
        showNotify("Perangkat tidak ditemukan di area Anda", "error");
      }
    } catch {
      showNotify("Gagal mencari perangkat", "error");
    }
  };

  const selectDevice = (device) => {
    const sto = stos.find((s) => s.name === device.sto);
    if (sto) {
      setFoundDevice(device);
      setDestination({
        name: sto.name,
        lat: parseFloat(sto.latitude),
        lng: parseFloat(sto.longitude),
      });
      setSearchResults([]);
      setSearchTerm(device.name);

      // Pre-fill form with device data
      setPmrForm((prev) => ({
        ...prev,
        device_type: device.deviceType || "",
        serial_number: device.serialNumber || "",
        sto: device.sto || "",
        room: device.room || "",
        ip: device.ip || "",
        port_capacity: device.totalPort || "",
        port_idle: device.idlePort || "",
      }));

      showNotify(`Perangkat terpilih: ${device.name}`);
    } else {
      showNotify("Lokasi STO perangkat tidak valid", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foundDevice) {
      showNotify("Pilih perangkat terlebih dahulu", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createPmrReport({
        ...pmrForm,
        user_id: user.id,
        device_id: foundDevice.id,
        distance,
        fuel_cost: fuelCost,
      });
      showNotify("Laporan PMR Berhasil Dikirim!");
      // Reset form
      setPmrForm({
        maintenance_date: new Date().toISOString().split("T")[0],
        status: "Baik",
        action: "",
        notes: "",
        // Data Perangkat
        device_type: "",
        serial_number: "",
        sto: "",
        room: "",
        ip: "",
        // Detail Port
        port_capacity: "",
        port_idle: "",
        port_lan: "",
        port_sfp: "",
        port_good: "",
        port_bad: "",
        port_notes: "",
        // Tes Koneksi
        ping_dns: "",
        attenuation: "",
        ping_client: "",
        speed_test: "",
      });
      setFoundDevice(null);
      setDestination(null);
      setSearchTerm("");
    } catch (err) {
      const message =
        err.message ||
        "The server returned an unexpected response. Please try again later.";
      showNotify(message, "error");
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex items-center gap-4">
            <div className="w-10 md:hidden" />
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                PMR / <span className="text-blue-600">FORMULIR</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Laporan Preventive Maintenance
              </h1>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <ErrorAlert
            message={error}
            onRetry={() => window.location.reload()}
          />
          {/* Header Card - Consistent with previous view */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200 uppercase">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {user?.role?.toUpperCase()} {user?.area}
                </p>
                <h2 className="text-lg font-black text-slate-900">
                  {user?.name}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Kantor Asal
              </p>
              <p className="text-sm font-bold text-slate-700">
                {origin.name || "-"}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                {origin.lat !== 0
                  ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`
                  : "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Column (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Pilih Perangkat
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Masukkan ID/Nama Perangkat"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSearchDevice}
                      className="px-4 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                    >
                      CARI
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y">
                    {searchResults.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => selectDevice(d)}
                        className="w-full p-3 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="text-xs font-black text-slate-900 uppercase">
                          {d.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {d.deviceId} · {d.sto}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {foundDevice && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                      Detail Perangkat
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-[11px] font-bold text-slate-700">
                      <p className="flex justify-between">
                        <span>Nama:</span>{" "}
                        <span className="text-slate-900 uppercase">
                          {foundDevice.name}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>ID Perangkat:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.deviceId}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>IP Address:</span>{" "}
                        <span className="text-slate-900">{foundDevice.ip}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Tipe:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.deviceType}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>SN:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.serialNumber}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Status:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.status}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Ruangan:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.room}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Lokasi Penyimpanan:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.storageLocation || "Tidak ada data"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Area:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.area}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>STO:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.sto}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Total Port:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.totalPort}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Idle Port:</span>{" "}
                        <span className="text-slate-900">
                          {foundDevice.idlePort}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {destination && (
                  <div className="pt-4 border-t border-slate-100 space-y-3 px-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Jarak Estimasi
                      </span>
                      <span className="text-xs font-black text-blue-600">
                        {distance} KM
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Estimasi BBM
                      </span>
                      <span className="text-xs font-black text-emerald-600 uppercase">
                        Rp {fuelCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Preview */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[400px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <MapContainer
                    center={[origin.lat, origin.lng]}
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {origin.lat !== 0 && (
                      <Marker position={[origin.lat, origin.lng]}>
                        <Popup>
                          <div className="text-[10px] font-black uppercase">
                            Origin: {origin.name}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {destination && routeCoordinates.length > 0 && (
                      <>
                        <Marker position={[destination.lat, destination.lng]}>
                          <Popup>
                            <div className="text-[10px] font-black uppercase">
                              Tujuan: {destination.name}
                            </div>
                          </Popup>
                        </Marker>
                        <Polyline
                          positions={routeCoordinates}
                          color="#2563eb"
                          weight={5}
                          opacity={0.7}
                        />
                        <MapRecenter
                          points={[
                            [origin.lat, origin.lng],
                            [destination.lat, destination.lng],
                          ]}
                        />
                      </>
                    )}
                  </MapContainer>
                )}
              </div>
              {/* Redesigned Technical Form - Integrated here to maintain layout flow */}
              {foundDevice && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm animate-in fade-in zoom-in-95">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Row 1: basic Info from screenshot 1 */}
                    <div className="space-y-4 pb-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <DescriptionIcon sx={{ fontSize: 16 }} /> Informasi Umum
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <CalendarMonthIcon sx={{ fontSize: 14 }} /> Tanggal
                            Maintenance
                          </label>
                          <input
                            required
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.maintenance_date}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                maintenance_date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <PersonIcon sx={{ fontSize: 14 }} /> Teknisi
                            Lapangan
                          </label>
                          <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-black text-slate-600 flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black uppercase">
                              {user?.name?.charAt(0)}
                            </div>
                            {user?.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Perangkat Segment */}
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <RouterIcon sx={{ fontSize: 16 }} /> Data Perangkat
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Tipe
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.device_type}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                device_type: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.serial_number}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                serial_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            STO
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.sto}
                            onChange={(e) =>
                              setPmrForm({ ...pmrForm, sto: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Ruang
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.room}
                            onChange={(e) =>
                              setPmrForm({ ...pmrForm, room: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            IP Address
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.ip}
                            onChange={(e) =>
                              setPmrForm({ ...pmrForm, ip: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detail Port Segment */}
                    <div className="space-y-6 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <BuildIcon sx={{ fontSize: 16 }} /> Detail Port
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Kapasitas Port
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_capacity}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_capacity: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Port Idle
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_idle}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_idle: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Port LAN
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_lan}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_lan: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Port SFP
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_sfp}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_sfp: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Port Baik
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_good}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_good: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Port Rusak
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_bad}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_bad: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="md:col-span-3 lg:col-span-4 space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Keterangan Port
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.port_notes}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                port_notes: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tes Koneksi Segment */}
                    <div className="space-y-6 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircleIcon sx={{ fontSize: 16 }} /> Tes Koneksi
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Ping DNS
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.ping_dns}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                ping_dns: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Redaman
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.attenuation}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                attenuation: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Ping Client
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.ping_client}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                ping_client: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Speed Test
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                            value={pmrForm.speed_test}
                            onChange={(e) =>
                              setPmrForm({
                                ...pmrForm,
                                speed_test: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* technical fields from screenshot 2 */}
                    <div className="space-y-6 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircleIcon sx={{ fontSize: 16 }} /> Hasil
                        Maintenance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <CheckCircleIcon sx={{ fontSize: 14 }} /> Status
                            Perangkat
                          </label>
                          <select
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                            value={pmrForm.status}
                            onChange={(e) =>
                              setPmrForm({ ...pmrForm, status: e.target.value })
                            }
                          >
                            <option>Baik</option>
                            <option>Perlu Perbaikan</option>
                            <option>Rusak</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <BuildIcon sx={{ fontSize: 14 }} /> Tindakan
                            Maintenance
                          </label>
                          <select
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                            value={pmrForm.action}
                            onChange={(e) =>
                              setPmrForm({ ...pmrForm, action: e.target.value })
                            }
                          >
                            <option value="">Pilih Tindakan</option>
                            <option>Pemasangan Baru</option>
                            <option>Pemeliharaan Rutin</option>
                            <option>Perbaikan</option>
                            <option>Penggantian</option>
                            <option>Pemindahan Perangkat</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <DescriptionIcon sx={{ fontSize: 14 }} /> Catatan
                          Maintenance
                        </label>
                        <textarea
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                          value={pmrForm.notes}
                          onChange={(e) =>
                            setPmrForm({ ...pmrForm, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 rounded-[2rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {submitting ? (
                          "MENGIRIM..."
                        ) : (
                          <>
                            <SendIcon sx={{ fontSize: 18 }} /> KIRIM LAPORAN PMR
                          </>
                        )}
                      </button>
                      <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                        Data logistik (jarak & bbm) akan tersimpan otomatis ke
                        dalam sistem
                      </p>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
