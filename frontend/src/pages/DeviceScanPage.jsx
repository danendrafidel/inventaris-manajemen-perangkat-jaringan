import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { 
  Fingerprint, Tag, Map, LocationCity, Router, ArrowBack 
} from '@mui/icons-material';
import { fetchInventoryDevices } from '../services/inventoryService';
import QRCode from "../components/QRCode";
import StatusPill from "../components/StatusPill";

export default function DeviceScanPage() {
  const { serialNumber } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevice = async () => {
      try {
        const data = await fetchInventoryDevices({ search: serialNumber });
        if (data.items && data.items.length > 0) {
          const found = data.items.find(i => i.serialNumber === serialNumber);
          setDevice(found || null);
        }
      } catch (err) {
        console.error("Gagal memuat detail perangkat", err);
      } finally {
        setLoading(false);
      }
    };
    loadDevice();
  }, [serialNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl border border-red-200 text-red-600 font-black uppercase tracking-widest text-sm shadow-sm">
          Perangkat tidak ditemukan!
        </div>
      </div>
    );
  }

  const details = [
    { label: 'DEVICE ID', value: device.deviceId, icon: <Fingerprint /> },
    { label: 'SERIAL NUMBER', value: device.serialNumber, icon: <Tag /> },
    { label: 'AREA', value: device.area, icon: <Map /> },
    { label: 'STO', value: device.sto, icon: <LocationCity /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-6 font-black text-[10px] uppercase tracking-widest transition-colors">
          <ArrowBack sx={{ fontSize: 16 }} /> KEMBALI KE DASHBOARD
        </Link>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-linear-to-br from-slate-800 to-slate-900 text-white flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
              <Router sx={{ fontSize: 40 }} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-2">{device.name}</h1>
              <StatusPill status={device.status} />
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {details.map((item, index) => (
                <div key={index} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {item.icon} {item.label}
                  </div>
                  <div className="text-sm font-black text-slate-900 truncate">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                QR CODE ASSET
              </p>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <QRCode value={device.serialNumber} size={180} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
