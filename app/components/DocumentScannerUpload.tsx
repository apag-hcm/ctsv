'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

interface Props {
  label: string;
  subLabel?: string;
  currentUrl: string;
  onUploadSuccess: (url: string) => void;
  cccd: string;
  filePrefix: string; // VD: 'vneid_cu_tru', 'minh_chung_ktx'
}

export default function DocumentScannerUpload({
  label,
  subLabel,
  currentUrl,
  onUploadSuccess,
  cccd,
  filePrefix,
}: Props) {
  // Trạng thái modal và bước quét (1: Chụp, 2: Căn chỉnh/Xoay, 3: Xử lý)
  const [isOpen, setIsOpen] = useState(false);
  const [scanStep, setScanStep] = useState<'CAMERA' | 'ADJUST' | 'PREVIEW'>('CAMERA');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'IMAGE'>('PDF');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  // Khởi động Camera Scanner
  const startCamera = async () => {
    setIsOpen(true);
    setScanStep('CAMERA');
    setRotation(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      alert('Không thể mở Camera: ' + err.message + '. Bạn có thể chọn tải ảnh chụp màn hình VNeID từ thiết bị.');
      stopCamera();
    }
  };

  // Dừng Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setCapturedImage(null);
  };

  // Bước 1 -> Bước 2: Chụp ảnh từ khung Viewfinder
  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);

    // Tắt camera stream và chuyển sang bước căn chỉnh
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanStep('ADJUST');
  };

  // Xoay ảnh 90 độ
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Đóng gói thành PDF hoặc Ảnh và upload lên Supabase
  const handleProcessAndSave = async () => {
    if (!capturedImage) return;

    try {
      setUploading(true);

      // Tạo canvas áp dụng góc xoay và tăng độ sắc nét văn bản
      const img = new Image();
      img.src = capturedImage;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const isRotated90or270 = rotation === 90 || rotation === 270;
      canvas.width = isRotated90or270 ? img.height : img.width;
      canvas.height = isRotated90or270 ? img.width : img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const processedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (exportFormat === 'PDF') {
        // Tải thư viện jsPDF động từ CDN nếu chưa có
        if (!(window as any).jspdf) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Không tải được bộ xuất PDF'));
            document.head.appendChild(script);
          });
        }

        const { jsPDF } = (window as any).jspdf;
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(processedDataUrl, 'JPEG', 0, 0, canvas.width, canvas.height);
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], `${filePrefix}_${cccd}_${Date.now()}.pdf`, { type: 'application/pdf' });

        await uploadFileToSupabase(pdfFile);
      } else {
        // Xuất file ảnh JPG
        const blob = await (await fetch(processedDataUrl)).blob();
        const imgFile = new File([blob], `${filePrefix}_${cccd}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        await uploadFileToSupabase(imgFile);
      }

      stopCamera();
    } catch (err: any) {
      alert('Lỗi xử lý file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Xử lý khi sinh viên chọn file trực tiếp (Ảnh chụp màn hình VNeID / PDF từ máy)
  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileToSupabase(file);
    e.target.value = '';
  };

  // Upload lên Supabase Storage Bucket
  const uploadFileToSupabase = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${cccd}/${filePrefix}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('minh_chung_ho_so')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('minh_chung_ho_so')
        .getPublicUrl(fileName);

      const finalUrl = publicData.publicUrl;
      setPreviewUrl(finalUrl);
      onUploadSuccess(finalUrl);
      alert('🎉 Đã tải lên và lưu file minh chứng thành công!');
    } catch (err: any) {
      alert('Lỗi tải file lên máy chủ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <label className="block font-bold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* CỤM NÚT CÔNG CỤ: SCAN CAMERA + CHỌN ẢNH CHỤP MÀN HÌNH */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="px-4 py-2 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <span>📸</span> Scan tài liệu bằng Camera (Xuất PDF)
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <span>🖼️</span> Chọn Ảnh chụp màn hình VNeID / PDF
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleDirectFileSelect}
          className="hidden"
        />

        {uploading && (
          <span className="text-blue-700 font-bold flex items-center gap-1 animate-pulse">
            ⏳ Đang tải file lên CSDL...
          </span>
        )}
      </div>

      {subLabel && <p className="text-[11px] text-gray-500">{subLabel}</p>}

      {/* HIỂN THỊ LINK MINH CHỨNG ĐÃ ĐƯỢC LƯU */}
      <div className="flex gap-2">
        <input
          type="text"
          value={previewUrl || ''}
          onChange={(e) => {
            setPreviewUrl(e.target.value);
            onUploadSuccess(e.target.value);
          }}
          placeholder="Dán link ảnh Drive / VNeID hoặc Scan camera ở trên..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-mono text-[11px] bg-slate-50"
        />
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center shrink-0 hover:bg-blue-100 transition"
          >
            Xem file
          </a>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL MÔ PHỎNG GIAO DIỆN SCANNER 3 BƯỚC */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-md">
          <div className="bg-[#121212] text-white rounded-3xl max-w-lg w-full h-[90vh] max-h-[750px] flex flex-col overflow-hidden relative border border-white/10 shadow-2xl">
            
            {/* Header Scanner */}
            <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/40">
              <button
                type="button"
                onClick={stopCamera}
                className="text-white text-lg hover:text-gray-300 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {scanStep === 'CAMERA' ? '📸 Canh chụp tài liệu' : '📐 Căn chỉnh & Xuất tài liệu'}
              </div>
              {scanStep === 'ADJUST' ? (
                <button
                  type="button"
                  onClick={handleProcessAndSave}
                  disabled={uploading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {uploading ? 'Đang lưu...' : 'Xong ✓'}
                </button>
              ) : (
                <div className="w-8"></div>
              )}
            </div>

            {/* Thân Scanner */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              {scanStep === 'CAMERA' ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  
                  {/* Khung viền canh 4 góc xanh dương */}
                  <div className="absolute inset-x-8 inset-y-16 border-2 border-blue-500 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    {/* 4 góc nhọn */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br"></div>
                  </div>

                  {/* Thông báo hướng dẫn */}
                  <div className="absolute bottom-6 px-4 py-2 bg-black/70 backdrop-blur-md rounded-full text-xs text-white/90 border border-white/20 font-medium">
                    Canh 4 cạnh văn bản trong khung này và chụp.
                  </div>
                </div>
              ) : (
                /* Bước 2: Hiển thị ảnh chụp kèm 8 điểm neo căn chỉnh */
                <div className="relative w-full h-full flex items-center justify-center p-6 bg-[#1a1a1a]">
                  {capturedImage && (
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                      <img
                        src={capturedImage}
                        alt="Scanned"
                        className="max-h-[50vh] object-contain rounded-lg border-2 border-blue-500 shadow-2xl transition-transform duration-200"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                      
                      {/* 4 điểm neo tròn ở góc */}
                      <div className="absolute top-0 left-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full translate-x-1/2 -translate-y-1/2 shadow"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full -translate-x-1/2 translate-y-1/2 shadow"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full translate-x-1/2 translate-y-1/2 shadow"></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thanh điều khiển dưới đáy */}
            <div className="p-4 bg-black/80 border-t border-white/10 flex flex-col items-center gap-3">
              {scanStep === 'CAMERA' ? (
                <div className="flex items-center justify-center w-full py-2">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="w-18 h-18 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-lg"
                  >
                    <div className="w-14 h-14 rounded-full bg-white"></div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full px-4">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>🔄</span> Xoay 90°
                  </button>

                  {/* Tùy chọn định dạng lưu */}
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setExportFormat('PDF')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        exportFormat === 'PDF' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Lưu PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat('IMAGE')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        exportFormat === 'IMAGE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Lưu Ảnh (JPG)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setScanStep('CAMERA');
                      startCamera();
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Chụp lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}