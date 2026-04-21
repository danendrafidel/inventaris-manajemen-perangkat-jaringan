import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 flex items-center justify-between gap-4">
      <p className="text-xs font-bold text-rose-700">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-black uppercase text-rose-700 hover:text-rose-900 transition-all underline decoration-2 underline-offset-4"
        >
          Retry
        </button>
      )}
    </div>
  );
}
