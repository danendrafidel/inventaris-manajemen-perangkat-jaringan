import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { clearAuth, getStoredUser } from "../services/authService";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import InventoryIcon from "@mui/icons-material/Inventory";
import BuildIcon from "@mui/icons-material/Build";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PublicIcon from "@mui/icons-material/Public";
import RouterIcon from "@mui/icons-material/Router";
import BusinessIcon from "@mui/icons-material/Business";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [isPmrOpen, setIsPmrOpen] = useState(false);
  const location = useLocation();
  const user = getStoredUser();
  const role = user?.role;
  const isAdminOrOfficer = role === "admin" || role === "officer";

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleArea = () => setIsAreaOpen(!isAreaOpen);
  const togglePmr = () => setIsPmrOpen(!isPmrOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-1101 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600"
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-1100 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`
        fixed left-0 top-0 bottom-0 border-r border-slate-200 bg-white z-1100 transition-transform duration-300 w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        <div className="px-5 py-6 flex flex-col h-full w-full overflow-y-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200">
              I
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 tracking-tight">
                INVENTARIS
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Sistem Manajemen
              </p>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-1.5">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive("/dashboard")
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <DashboardIcon fontSize="small" /> Dashboard
            </Link>

            {isAdminOrOfficer && (
              <>
                <Link
                  to="/users"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive("/users")
                      ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <PeopleIcon fontSize="small" /> Kelola Pengguna
                </Link>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={toggleArea}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      location.pathname.startsWith("/mapping")
                        ? "bg-slate-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapIcon fontSize="small" /> Mapping Area
                    </div>
                    {isAreaOpen ? (
                      <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                    )}
                  </button>

                  {isAreaOpen && (
                    <div className="ml-9 flex flex-col gap-1 border-l-2 border-slate-100 pl-2">
                      <Link
                        to="/mapping/area"
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          isActive("/mapping/area")
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <PublicIcon sx={{ fontSize: 14 }} /> Area
                      </Link>
                      <Link
                        to="/mapping/sto"
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          isActive("/mapping/sto")
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <RouterIcon sx={{ fontSize: 14 }} /> STO
                      </Link>
                      <Link
                        to="/mapping/office"
                        onClick={() => setIsOpen(false)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          isActive("/mapping/office")
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <BusinessIcon sx={{ fontSize: 14 }} /> Kantor
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            <Link
              to="/inventory"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive("/inventory")
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <InventoryIcon fontSize="small" /> Inventaris
            </Link>

            <div className="flex flex-col gap-1">
              <button
                onClick={togglePmr}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  location.pathname.startsWith("/pmr")
                    ? "bg-slate-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BuildIcon fontSize="small" /> PMR
                </div>
                {isPmrOpen ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                )}
              </button>

              {isPmrOpen && (
                <div className="ml-9 flex flex-col gap-1 border-l-2 border-slate-100 pl-2">
                  <Link
                    to="/pmr"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      isActive("/pmr")
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <ListAltIcon sx={{ fontSize: 14 }} /> Formulir PMR
                  </Link>
                  <Link
                    to="/pmr/log"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      isActive("/pmr/log")
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <HistoryIcon sx={{ fontSize: 14 }} /> Log PMR
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive("/profile")
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <AccountCircleIcon fontSize="small" /> Profil Saya
            </Link>
          </nav>

          <div className="mt-auto pt-6 px-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm uppercase tracking-widest"
            >
              <LogoutIcon fontSize="small" /> LOGOUT SYSTEM
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
