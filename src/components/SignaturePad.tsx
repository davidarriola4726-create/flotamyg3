import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, Trash2 } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  initialSignature?: string;
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  signerName?: string;
  signerRole?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  initialSignature,
  onSave,
  onClear,
  signerName,
  signerRole,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 320;
    const height = 150;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialSignature;
    } else {
      // Draw subtle guideline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, height - 30);
      ctx.lineTo(width - 20, height - 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
    }
  }, [initialSignature]);

  const saveCurrentToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-10), imgData]);
    } catch (e) {
      console.warn('Could not save canvas history:', e);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCurrentToHistory();
    setIsDrawing(true);
    setHasSignature(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSave(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.parentElement?.clientWidth || 320;
    const height = 150;

    // Redraw guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    setHasSignature(false);
    setHistory([]);
    if (onClear) onClear();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const previous = newHistory.pop();
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHistory(newHistory);
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Deshacer trazo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            title="Limpiar firma"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full rounded-lg overflow-hidden bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-inner cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full block"
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 select-none">
            Firme aquí con el dedo o puntero
          </div>
        )}
      </div>

      {(signerName || signerRole) && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">{signerName || 'Nombre del firmante'}</span>
          <span className="text-slate-400">{signerRole || 'Conformidad'}</span>
        </div>
      )}
    </div>
  );
};
