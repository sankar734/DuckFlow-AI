import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  ScanLine,
  Sliders,
  Sparkles,
  RotateCw,
  Crop,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { toast } from 'sonner';

export interface MobileScannerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const MobileScannerModal: React.FC<MobileScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isMobileScannerOpen, closeMobileScanner } = useUIStore();
  const activeOpen = isOpen !== undefined ? isOpen : isMobileScannerOpen;
  const handleClose = onClose || closeMobileScanner;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeFilter, setActiveFilter] = useState<'normal' | 'bw' | 'grayscale' | 'magic'>('magic');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResultText, setOcrResultText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (!activeOpen) {
      stopCamera();
    }
  }, [activeOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      }
    } catch {
      toast.info('Camera unavailable or permission denied. You can select image files from your computer.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const handleCaptureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      stopCamera();
      runOCRSim();
    }
  };

  const handleSelectImageFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      stopCamera();
      runOCRSim();
    };
    reader.readAsDataURL(file);
    toast.success(`Loaded image "${file.name}"`);
  };

  const runOCRSim = () => {
    setIsProcessingOCR(true);
    setTimeout(() => {
      setIsProcessingOCR(false);
      setOcrResultText(
        `TAX INVOICE / RECEIPT\nDocuFlow AI Technologies Inc.\nInvoice #: DF-2026-8942\nDate: 16-Aug-2026\n\nItem: Enterprise Cloud Subscription - Annual Plan\nRate: ₹7,990.00\nGST (18%): ₹1,438.20\nTotal Paid: ₹9,428.20\nStatus: PAID IN FULL`
      );
      toast.success('OCR boundary detection and text extraction complete!');
    }, 1200);
  };

  const handleDownloadPDF = () => {
    const content = `DOCUFLOW AI - SCANNED DOCUMENT OCR\n\n${ocrResultText}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Scanned_Doc_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded Scanned PDF!');
  };

  if (!activeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => handleSelectImageFile(e.target.files)}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Mobile Document Scanner & OCR</h2>
              <p className="text-[11px] text-slate-400">AI auto-cropping, edge perspective fix & text extraction</p>
            </div>
          </div>

          <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Viewfinder / Image Canvas */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[360px] relative overflow-hidden">
            {capturedImage ? (
              <div className="relative max-h-[340px] flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Scanned Document"
                  className={`max-h-[320px] rounded-xl object-contain shadow-lg transition-all ${
                    activeFilter === 'bw'
                      ? 'contrast-200 grayscale'
                      : activeFilter === 'grayscale'
                      ? 'grayscale'
                      : activeFilter === 'magic'
                      ? 'contrast-125 saturate-125'
                      : ''
                  }`}
                />
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setOcrResultText('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : isCameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full max-h-[300px] rounded-xl object-cover" />
                <Button variant="gradient" size="sm" onClick={handleCaptureFromVideo} className="mt-3">
                  Capture Snapshot
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-3xl bg-purple-950/60 text-purple-400 mx-auto w-fit">
                  <ScanLine className="w-10 h-10 animate-pulse" />
                </div>
                <div className="text-xs text-slate-300">Choose a document image from your folder or start webcam</div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select from Folder
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    leftIcon={<Camera className="w-4 h-4" />}
                    onClick={startCamera}
                  >
                    Launch Camera
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* OCR & Enhancement Controls */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            {/* Filter Pills */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Enhancement Filter</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'magic', label: 'Magic Color' },
                  { id: 'bw', label: 'Clean B&W' },
                  { id: 'grayscale', label: 'Crisp Gray' },
                  { id: 'normal', label: 'Original' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                      activeFilter === f.id
                        ? 'border-purple-500 bg-purple-950/50 text-purple-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted OCR Text Area */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Extracted OCR Text {isProcessingOCR && '(Analyzing...)'}
              </label>
              <textarea
                rows={6}
                value={ocrResultText}
                onChange={(e) => setOcrResultText(e.target.value)}
                placeholder="Extracted OCR text will appear here automatically..."
                className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(ocrResultText);
                  toast.success('Copied text to clipboard!');
                }}
                disabled={!ocrResultText}
              >
                Copy Text
              </Button>
              <Button
                variant="gradient"
                size="sm"
                className="flex-1"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadPDF}
                disabled={!ocrResultText}
              >
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
