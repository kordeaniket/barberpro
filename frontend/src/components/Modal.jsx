import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirmation',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  onConfirm,
  onClose,
  confirmButtonClass,
  children
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    danger: <AlertCircle className="w-6 h-6 text-red-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
  };

  const bgMap = {
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600'
  };

  const defaultConfirmBtn =
    type === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : type === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-stone-900 hover:bg-stone-800 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-float border border-stone-200/90 p-5 sm:p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl ${bgMap[type] || bgMap.warning} shrink-0 mt-0.5`}>
            {iconMap[type] || iconMap.warning}
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-stone-900 leading-snug">{title}</h3>
            {message && <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">{message}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children && <div className="pt-1">{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-o text-xs sm:text-sm py-2 px-3.5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all ${
              confirmButtonClass || defaultConfirmBtn
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

