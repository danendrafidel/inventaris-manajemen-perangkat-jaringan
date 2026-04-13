import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/authService";
import { fetchAllStos, fetchAllAreas } from "../services/areaService";
import { fetchInventoryDevices } from "../services/inventoryService";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
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

  const [origin, setOrigin] = useState({ name: "", lat: 0, lng: 0 });
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundDevice, setFoundDevice] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
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
      try {
        const [stoData, areaData] = await Promise.all([
          fetchAllStos(),
          fetchAllAreas(),
        ]);
        setStos(stoData);

        // Auto-set origin based on user area from database
        const userArea = areaData.find((a) => a.name === user.area);
        if (userArea) {
          setOrigin({
            name: `Kantor ${userArea.name}`,
            lat: parseFloat(userArea.latitude),
            lng: parseFloat(userArea.longitude),
          });
        }
      } catch (err) {
        showNotify("Gagal memuat data pendukung", "error");
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
          const dist = (route.distance / 1000);
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
      // Restrict scope for non-admin users
      if (user.role !== 'admin') {
        params.area = user.area;
      }
      const data = await fetchInventoryDevices(params);
      if (data.items.length > 0) {
        setSearchResults(data.items);
        showNotify(`Ditemukan ${data.items.length} perangkat`);
      } else {
        setSearchResults([]);
        showNotify("Perangkat tidak ditemukan", "error");
      }
    } catch (err) {
      showNotify("Gagal mencari perangkat", "error");
    }
  };

  const selectDevice = (device) => {
    const sto = stos.find(s => s.name === device.sto);
    if (sto) {
        setFoundDevice(device);
        setDestination({
            name: sto.name,
            lat: parseFloat(sto.latitude),
            lng: parseFloat(sto.longitude)
        });
        setSearchResults([]);
        setSearchTerm(device.name);
        showNotify(`Perangkat terpilih: ${device.name}`);
    } else {
        showNotify("Lokasi STO perangkat tidak valid", "error");
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 md:hidden" />
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                PMR / <span className="text-blue-600">FORMULIR</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Preventive Maintenance Perangkat
              </h1>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Petugas Lapangan
                </p>
                <h2 className="text-lg font-black text-slate-900">{user?.name}</h2>
              </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kantor Asal</p>
                <p className="text-sm font-bold text-slate-700">{origin.name || "-"}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{origin.lat !== 0 ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}` : "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cari Perangkat</label>
                  <div className="flex gap-2">
                    <input 
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100" 
                      placeholder="Masukkan ID/Nama Perangkat"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="button" onClick={handleSearchDevice} className="px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">CARI</button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border rounded-xl divide-y">
                        {searchResults.map(d => (
                            <button key={d.id} onClick={() => selectDevice(d)} className="w-full p-3 text-left text-xs font-bold hover:bg-indigo-50 border-b">
                                <div className="font-black text-slate-900">{d.name}</div>
                                <div className="text-[10px] text-slate-500">ID: {d.deviceId} | STO: {d.sto}</div>
                            </button>
                        ))}
                    </div>
                )}

                {foundDevice && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Detail Perangkat</p>
                        <div className="grid grid-cols-1 gap-1 text-[11px] font-bold text-slate-700">
                            <p className="flex justify-between"><span>Nama:</span> <span className="text-slate-900">{foundDevice.name}</span></p>
                            <p className="flex justify-between"><span>ID Perangkat:</span> <span className="text-slate-900">{foundDevice.deviceId}</span></p>
                            <p className="flex justify-between"><span>IP Address:</span> <span className="text-slate-900">{foundDevice.ip}</span></p>
                            <p className="flex justify-between"><span>Tipe:</span> <span className="text-slate-900">{foundDevice.deviceType}</span></p>
                            <p className="flex justify-between"><span>SN:</span> <span className="text-slate-900">{foundDevice.serialNumber}</span></p>
                            <p className="flex justify-between"><span>Status:</span> <span className="text-slate-900">{foundDevice.status}</span></p>
                            <p className="flex justify-between"><span>Ruangan:</span> <span className="text-slate-900">{foundDevice.room}</span></p>
                            <p className="flex justify-between"><span>Kategori:</span> <span className="text-slate-900">{foundDevice.kind}</span></p>
                            <p className="flex justify-between"><span>Area:</span> <span className="text-slate-900">{foundDevice.area}</span></p>
                            <p className="flex justify-between"><span>STO:</span> <span className="text-slate-900">{foundDevice.sto}</span></p>
                            <p className="flex justify-between"><span>Total Port:</span> <span className="text-slate-900">{foundDevice.totalPort}</span></p>
                            <p className="flex justify-between"><span>Idle Port:</span> <span className="text-slate-900">{foundDevice.idlePort}</span></p>
                        </div>
                    </div>
                )}

                {destination && (
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Jarak Estimasi</span>
                            <span className="text-sm font-black text-blue-600">{distance} KM</span>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Estimasi Biaya Bensin</span>
                            <span className="text-sm font-black text-emerald-600">Rp {fuelCost.toLocaleString()}</span>
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[500px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <MapContainer center={[origin.lat, origin.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {origin.lat !== 0 && (
                      <Marker position={[origin.lat, origin.lng]}>
                        <Popup>
                            <div className="text-xs font-bold">
                                <b>Kantor Asal</b><br/>{origin.name}
                                <p className="text-[10px] text-slate-500 mt-1">{origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</p>
                            </div>
                        </Popup>
                      </Marker>
                    )}
                    {destination && routeCoordinates.length > 0 && (
                      <>
                        <Marker position={[destination.lat, destination.lng]}>
                            <Popup>
                                <div className="text-xs font-bold">
                                    <b>STO Tujuan</b><br/>{destination.name}
                                    <p className="text-[10px] text-slate-500 mt-1">{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
                                </div>
                            </Popup>
                        </Marker>
                        <Polyline positions={routeCoordinates} color="#2563eb" weight={5} opacity={0.8} />
                        <MapRecenter points={[[origin.lat, origin.lng], [destination.lat, destination.lng]]} />
                      </>
                    )}
                  </MapContainer>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
