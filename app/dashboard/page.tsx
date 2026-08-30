'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';

// =========================================================================
// 1. COMPONENT HEADER CHUẨN NHẬN DIỆN APAG (ĐÃ IN ĐẬM PHÂN HIỆU)
// =========================================================================
function AppHeader({
  namHoc = '2027',
  isLoggedIn = false,
  onLogout,
}: {
  namHoc?: string;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}) {
  const logoUrl = 'https://lh3.googleusercontent.com/d/1EhYcDVJc8jezBSiGS1jJ6XM0EXxjvFKJ';

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-8 shadow-sm web-ui-only sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3.5">
          <img
            src={logoUrl}
            alt="Logo APAG"
            className="h-11 w-auto object-contain shrink-0"
          />
          <div className="border-l border-gray-300 pl-3.5">
            <h1 className="text-xs sm:text-sm font-black text-[#0E1E45] uppercase tracking-tight leading-tight">
              HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
            </h1>
            {/* ĐÃ IN ĐẬM DÒNG PHÂN HIỆU */}
            <h2 className="text-[11px] sm:text-xs font-black text-[#8B0000] uppercase tracking-tight leading-tight mt-0.5">
              PHÂN HIỆU TẠI THÀNH PHỐ HỒ CHÍ MINH
            </h2>
            <div className="text-[10px] sm:text-[11px] font-extrabold text-[#D97706] uppercase tracking-wider mt-0.5">
              CỔNG THÔNG TIN TÂN SINH VIÊN ĐẠI HỌC CHÍNH QUY NĂM {namHoc}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="px-3.5 py-1.5 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>🛡️</span> Hội đồng duyệt
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// =========================================================================
// 2. COMPONENT FOOTER CHUẨN APAG
// =========================================================================
function AppFooter({
  namHoc = '2027',
  hotline = '0905.865.919',
}: {
  namHoc?: string;
  hotline?: string;
}) {
  return (
    <footer className="bg-[#09132B] text-white py-6 px-4 sm:px-8 border-t border-blue-900/40 text-center web-ui-only mt-auto">
      <div className="max-w-6xl mx-auto space-y-2 text-xs">
        <div className="font-extrabold text-sm sm:text-base text-amber-400 uppercase tracking-wide">
          PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG TẠI THÀNH PHỐ HỒ CHÍ MINH
        </div>
        <p className="text-gray-300 text-[11px] sm:text-xs">
          Cơ sở chính: Số 10, đường 3/2, Phường Hòa Hưng, Quận 10, TP. Hồ Chí Minh • Hotline KTX: <strong className="text-amber-300 font-mono">{hotline}</strong>
        </p>
        <div className="text-[11px] text-gray-400 pt-1 border-t border-white/10">
          © {namHoc} APAG Phân hiệu TP. Hồ Chí Minh. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

// =========================================================================
// 3. TRANG DASHBOARD CHÍNH CHO TÂN SINH VIÊN
// =========================================================================
export default function StudentDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cấu hình động từ CSDL
  const [systemConfigs, setSystemConfigs] = useState({
    NAM_HOC: '2027',
    HOTLINE_KTX: '0905.865.919',
  });

  // Dữ liệu sinh viên, Đơn KTX & Đơn BHYT
  const [studentData, setStudentData] = useState<any>(null);
  const [dormReg, setDormReg] = useState<any>(null);
  const [bhytReg, setBhytReg] = useState<any>(null);

  // Danh mục động nạp trực tiếp từ Supabase
  const [coSoKtxList, setCoSoKtxList] = useState<any[]>([]);
  const [bacUuTienList, setBacUuTienList] = useState<any[]>([]);
  const [nganhHocList, setNganhHocList] = useState<any[]>([]);
  const [hanBhytList, setHanBhytList] = useState<any[]>([]);
  const [doiTuongBhytList, setDoiTuongBhytList] = useState<any[]>([]);
  const [diaChiList, setDiaChiList] = useState<any[]>([]);
  const [quocGiaList, setQuocGiaList] = useState<string[]>([]);
  const [danTocList, setDanTocList] = useState<string[]>([]);

  // Tùy chọn Nơi cấp CCCD
  const [noiCapType, setNoiCapType] = useState<string>('');
  const [customNoiCap, setCustomNoiCap] = useState<string>('');

  // Trạng thái Scanner Camera Đa Trang
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanTarget, setActiveScanTarget] = useState<'VNEID' | 'KTX'>('VNEID');
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'IMAGE'>('PDF');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputVneidRef = useRef<HTMLInputElement | null>(null);
  const fileInputKtxRef = useRef<HTMLInputElement | null>(null);

  // State Form thông tin tổng hợp
  const [formData, setFormData] = useState({
    ma_sv: '',
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: '',
    ngay_cap_cccd: '',
    noi_cap_cccd: '',
    sdt_ca_nhan: '',
    sdt_gia_dinh: '',
    email_sv: '',

    nganh_hoc: '',
    diem_xet_tuyen: '' as any,

    dia_chi_chi_tiet_tt: '',
    tinh_thanh_tt: '',
    phuong_xa_tt: '',

    co_tam_tru: false,
    dia_chi_chi_tiet_tam_tru: '',
    tinh_thanh_tam_tru: 'Thành phố Hồ Chí Minh',
    phuong_xa_tam_tru: '',

    anh_minh_chung_vneid_urls: [] as string[],

    dang_ky_ktx_choice: false,
    id_toa_nha: '',
    khu_ktx_dang_ky: '',
    bac_uu_tien: '',
    minh_chung_ktx_urls: [] as string[],

    ma_the_bhyt: '',
    han_su_dung_bhyt: '',
    doi_tuong_bhyt: '',
    da_kham_sk_kh228: '',
    quoc_tich: '',
    dan_toc: '',
  });

  useEffect(() => {
    setMounted(true);
    const storedCccd = localStorage.getItem('student_cccd');
    if (!storedCccd) {
      router.push('/');
      return;
    }
    loadStudentInfo(storedCccd);
    loadAllMasterData();
  }, [router]);

  const loadAllMasterData = async () => {
    try {
      let allDiaChi: any[] = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('danh_muc_dia_chi')
          .select('ma_xa, ten_xa, cap_hanh_chinh, ma_tinh, ten_tinh')
          .range(from, from + step - 1);

        if (error) break;
        if (!data || data.length === 0) break;
        allDiaChi = allDiaChi.concat(data);
        if (data.length < step) break;
        from += step;
      }
      setDiaChiList(allDiaChi);

      const [qgRes, dtRes, nganhRes, hanRes, dtBhytRes, roomRes, bacRes, settingsRes] = await Promise.all([
        supabase.from('danh_muc_quoc_gia').select('ten_quoc_gia').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_dan_toc').select('ten_dan_toc').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_nganh_hoc').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_han_bhyt').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_doi_tuong_bhyt').select('*').order('thu_tu', { ascending: true }),
        supabase.from('co_so_ktx').select('*').eq('is_deleted', false).order('created_at', { ascending: true }),
        supabase.from('danh_muc_bac_uu_tien').select('*').order('thu_tu', { ascending: true }),
        supabase.from('system_settings').select('*').eq('is_deleted', false),
      ]);

      setQuocGiaList(qgRes.data ? qgRes.data.map((q) => q.ten_quoc_gia) : ['Việt Nam', 'Lào', 'Campuchia', 'Khác']);
      setDanTocList(dtRes.data ? dtRes.data.map((d) => d.ten_dan_toc) : ['Kinh', 'Tày', 'Thái', 'Mường', 'Khác']);
      setNganhHocList(nganhRes.data || []);
      setHanBhytList(hanRes.data || []);
      setDoiTuongBhytList(dtBhytRes.data || []);
      setCoSoKtxList(roomRes.data || []);
      setBacUuTienList(bacRes.data || []);

      if (settingsRes.data) {
        const configMap: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => { configMap[s.key_name] = s.value_data; });
        setSystemConfigs({
          NAM_HOC: configMap['NAM_HOC'] || '2027',
          HOTLINE_KTX: configMap['HOTLINE_KTX'] || '0905.865.919',
        });
      }
    } catch (err) {
      console.error('Lỗi tải danh mục hệ thống:', err);
    }
  };

  const loadStudentInfo = async (cccd: string) => {
    setLoading(true);
    try {
      const { data: st, error: stError } = await supabase
        .from('sinh_vien')
        .select('*')
        .eq('cccd', cccd)
        .eq('is_deleted', false)
        .maybeSingle();

      if (stError) throw stError;
      if (!st) {
        alert('Không tìm thấy thông tin sinh viên!');
        router.push('/');
        return;
      }

      setStudentData(st);

      let chiTietTT = '';
      let tinhTT = '';
      let xaTT = '';
      if (st.ho_khau_thuong_tru) {
        const parts = st.ho_khau_thuong_tru.split(',').map((p: string) => p.trim());
        if (parts.length >= 3) {
          tinhTT = parts[parts.length - 1] || '';
          xaTT = parts[parts.length - 2] || '';
          chiTietTT = parts.slice(0, parts.length - 2).join(', ');
        } else {
          chiTietTT = st.ho_khau_thuong_tru;
        }
      }

      const { data: ktx } = await supabase.from('dang_ky_ktx').select('*').eq('cccd', cccd).eq('is_deleted', false).maybeSingle();
      if (ktx) setDormReg(ktx);

      const { data: bhyt } = await supabase.from('dang_ky_bhyt').select('*').eq('cccd', cccd).eq('is_deleted', false).maybeSingle();
      if (bhyt) setBhytReg(bhyt);

      let chiTietTamTru = '';
      let tinhTamTru = 'Thành phố Hồ Chí Minh';
      let xaTamTru = '';
      const rawTamTru = bhyt?.dia_chi_tam_tru_vneid || st.dia_chi_tam_tru || '';
      if (rawTamTru) {
        const parts = rawTamTru.split(',').map((p: string) => p.trim());
        if (parts.length >= 3) {
          tinhTamTru = parts[parts.length - 1] || 'Thành phố Hồ Chí Minh';
          xaTamTru = parts[parts.length - 2] || '';
          chiTietTamTru = parts.slice(0, parts.length - 2).join(', ');
        } else {
          chiTietTamTru = rawTamTru;
        }
      }

      const parseUrls = (raw: any): string[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          if (raw.startsWith('[') && raw.endsWith(']')) {
            try { return JSON.parse(raw); } catch (e) { return [raw]; }
          }
          return [raw];
        }
        return [];
      };

      const vneidList = parseUrls(bhyt?.anh_minh_chung_vneid_url);
      const ktxProofList = parseUrls(ktx?.minh_chung_url);

      const noiCapValue = st.noi_cap_cccd || '';
      const defaultOptions = [
        'Cục Cảnh sát quản lý hành chính về trật tự xã hội',
        'Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư',
        'Bộ Công an',
      ];

      if (defaultOptions.includes(noiCapValue)) {
        setNoiCapType(noiCapValue);
      } else if (noiCapValue.startsWith('Công an')) {
        setNoiCapType('Công an tỉnh / thành phố');
        setCustomNoiCap(noiCapValue);
      } else if (noiCapValue) {
        setNoiCapType('KHAC');
        setCustomNoiCap(noiCapValue);
      } else {
        setNoiCapType('');
      }

      setFormData({
        ma_sv: st.ma_sv || '',
        ho_ten: st.ho_ten || '',
        ngay_sinh: st.ngay_sinh ? st.ngay_sinh.split('T')[0] : '',
        gioi_tinh: st.gioi_tinh || '',
        ngay_cap_cccd: st.ngay_cap_cccd ? st.ngay_cap_cccd.split('T')[0] : '',
        noi_cap_cccd: noiCapValue,
        sdt_ca_nhan: st.sdt_ca_nhan || '',
        sdt_gia_dinh: st.sdt_gia_dinh || '',
        email_sv: st.email_sv || '',
        nganh_hoc: st.nganh_hoc || '',
        diem_xet_tuyen: st.diem_xet_tuyen !== null && st.diem_xet_tuyen !== undefined ? Number(st.diem_xet_tuyen) : '',
        dia_chi_chi_tiet_tt: chiTietTT,
        tinh_thanh_tt: tinhTT,
        phuong_xa_tt: xaTT,

        co_tam_tru: bhyt ? Boolean(bhyt.co_tam_tru_hcm) : Boolean(rawTamTru),
        dia_chi_chi_tiet_tam_tru: chiTietTamTru,
        tinh_thanh_tam_tru: tinhTamTru,
        phuong_xa_tam_tru: xaTamTru,
        anh_minh_chung_vneid_urls: vneidList,

        dang_ky_ktx_choice: !!ktx,
        id_toa_nha: ktx?.id_toa_nha || '',
        khu_ktx_dang_ky: ktx?.khu_ktx_dang_ky || '',
        bac_uu_tien: ktx?.bac_uu_tien || '',
        minh_chung_ktx_urls: ktxProofList,

        ma_the_bhyt: bhyt?.ma_the_bhyt || '',
        han_su_dung_bhyt: bhyt?.han_su_dung_bhyt || '',
        doi_tuong_bhyt: bhyt?.doi_tuong_bhyt || '',
        da_kham_sk_kh228: bhyt?.da_kham_sk_kh228 || '',
        quoc_tich: bhyt?.quoc_tich || '',
        dan_toc: bhyt?.dan_toc || '',
      });
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu:', err);
      setMessage({ type: 'error', text: 'Lỗi tải dữ liệu: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const distinctTinhThanh = useMemo(() => {
    const map = new Map<string, string>();
    diaChiList.forEach((item) => {
      if (item.ten_tinh) {
        map.set(item.ten_tinh, item.ten_tinh);
      }
    });
    return Array.from(map.values()).sort();
  }, [diaChiList]);

  const filteredPhuongXaTT = useMemo(() => {
    if (!formData.tinh_thanh_tt) return diaChiList.slice(0, 100).map((d) => d.ten_xa);
    const list = diaChiList.filter((d) => d.ten_tinh.toLowerCase() === formData.tinh_thanh_tt.toLowerCase());
    return list.map((d) => d.ten_xa).sort();
  }, [diaChiList, formData.tinh_thanh_tt]);

  const filteredPhuongXaTamTru = useMemo(() => {
    if (!formData.tinh_thanh_tam_tru) return diaChiList.slice(0, 100).map((d) => d.ten_xa);
    const list = diaChiList.filter((d) => d.ten_tinh.toLowerCase() === formData.tinh_thanh_tam_tru.toLowerCase());
    return list.map((d) => d.ten_xa).sort();
  }, [diaChiList, formData.tinh_thanh_tam_tru]);

  const autoCleanDetailAddress = (field: 'dia_chi_chi_tiet_tt' | 'dia_chi_chi_tiet_tam_tru', wardVal: string, provVal: string) => {
    let cleaned = formData[field].trim();
    if (!cleaned) return;

    if (wardVal) {
      const wardRegex = new RegExp(wardVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(wardRegex, '');
    }

    if (provVal) {
      const provRegex = new RegExp(provVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleaned = cleaned.replace(provRegex, '');
    }

    cleaned = cleaned.replace(/(,\s*|\s+)(phường|xã|thị trấn|quận|huyện|thị xã|thành phố|tỉnh|tp)\b.*$/gi, '');
    cleaned = cleaned.replace(/[\s,.-]+$/, '').trim();

    setFormData((prev) => ({ ...prev, [field]: cleaned }));
  };

  const handleNoiCapChange = (type: string) => {
    setNoiCapType(type);
    if (type === 'KHAC') {
      setFormData((prev) => ({ ...prev, noi_cap_cccd: customNoiCap || '' }));
    } else if (type === 'Công an tỉnh / thành phố') {
      const val = customNoiCap ? `Công an ${customNoiCap}` : (formData.tinh_thanh_tt ? `Công an ${formData.tinh_thanh_tt}` : 'Công an TP. Hồ Chí Minh');
      setFormData((prev) => ({ ...prev, noi_cap_cccd: val }));
    } else {
      setFormData((prev) => ({ ...prev, noi_cap_cccd: type }));
    }
  };

  // SCANNER ENGINE
  const openScanner = async (target: 'VNEID' | 'KTX') => {
    setActiveScanTarget(target);
    setIsScannerOpen(true);
    setScannedPages([]);
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
      alert('Không thể mở Camera: ' + err.message + '. Bạn có thể chọn tải ảnh/PDF từ thiết bị.');
      closeScanner();
    }
  };

  const closeScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScannerOpen(false);
    setScannedPages([]);
  };

  const handleCaptureOnePage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setScannedPages((prev) => [...prev, dataUrl]);
  };

  const handleMergeAndSaveAllPages = async () => {
    if (scannedPages.length === 0) return;

    try {
      setUploadingDoc(true);
      const prefix = activeScanTarget === 'VNEID' ? 'vneid' : 'ktx_minhchung';

      if (exportFormat === 'PDF') {
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
        let pdf: any = null;

        for (let i = 0; i < scannedPages.length; i++) {
          const pageData = scannedPages[i];
          const img = new Image();
          img.src = pageData;
          await new Promise((res) => (img.onload = res));

          const orientation = img.width > img.height ? 'landscape' : 'portrait';

          if (i === 0) {
            pdf = new jsPDF({ orientation, unit: 'px', format: [img.width, img.height] });
            pdf.addImage(pageData, 'JPEG', 0, 0, img.width, img.height);
          } else {
            pdf.addPage([img.width, img.height], orientation);
            pdf.addImage(pageData, 'JPEG', 0, 0, img.width, img.height);
          }
        }

        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], `${prefix}_${studentData?.cccd || 'temp'}_${Date.now()}.pdf`, { type: 'application/pdf' });
        await uploadSingleFile(pdfFile, activeScanTarget);
      } else {
        for (let i = 0; i < scannedPages.length; i++) {
          const blob = await (await fetch(scannedPages[i])).blob();
          const imgFile = new File([blob], `${prefix}_trang${i + 1}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          await uploadSingleFile(imgFile, activeScanTarget);
        }
      }

      closeScanner();
    } catch (err: any) {
      alert('Lỗi xuất tài liệu: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const uploadSingleFile = async (file: File, target: 'VNEID' | 'KTX') => {
    const fileExt = file.name.split('.').pop();
    const prefix = target === 'VNEID' ? 'vneid' : 'ktx_minhchung';
    const fileName = `${studentData?.cccd || 'temp'}/${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from('minh_chung_ho_so').upload(fileName, file, { upsert: true });
    if (error) throw error;

    const { data: publicData } = supabase.storage.from('minh_chung_ho_so').getPublicUrl(fileName);
    const finalUrl = publicData.publicUrl;

    if (target === 'VNEID') {
      setFormData((prev) => ({
        ...prev,
        anh_minh_chung_vneid_urls: [...prev.anh_minh_chung_vneid_urls, finalUrl],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        minh_chung_ktx_urls: [...prev.minh_chung_ktx_urls, finalUrl],
      }));
    }
  };

  const handleSelectMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>, target: 'VNEID' | 'KTX') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingDoc(true);
      for (let i = 0; i < files.length; i++) {
        await uploadSingleFile(files[i], target);
      }
      alert(`🎉 Đã tải lên thành công ${files.length} tệp đính kèm!`);
    } catch (err: any) {
      alert('Lỗi tải tệp: ' + err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (target: 'VNEID' | 'KTX', indexToRemove: number) => {
    if (target === 'VNEID') {
      setFormData((prev) => ({
        ...prev,
        anh_minh_chung_vneid_urls: prev.anh_minh_chung_vneid_urls.filter((_, idx) => idx !== indexToRemove),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        minh_chung_ktx_urls: prev.minh_chung_ktx_urls.filter((_, idx) => idx !== indexToRemove),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const fullAddressTT = [formData.dia_chi_chi_tiet_tt, formData.phuong_xa_tt, formData.tinh_thanh_tt].filter(Boolean).join(', ');
      const fullAddressTamTru = formData.co_tam_tru
        ? [formData.dia_chi_chi_tiet_tam_tru, formData.phuong_xa_tam_tru, formData.tinh_thanh_tam_tru].filter(Boolean).join(', ')
        : null;

      const finalNoiCap = (noiCapType === 'KHAC' || noiCapType === 'Công an tỉnh / thành phố')
        ? customNoiCap || formData.noi_cap_cccd
        : noiCapType;

      const vneidUrlsPayload = formData.anh_minh_chung_vneid_urls.length > 1
        ? JSON.stringify(formData.anh_minh_chung_vneid_urls)
        : (formData.anh_minh_chung_vneid_urls[0] || null);

      const ktxUrlsPayload = formData.minh_chung_ktx_urls.length > 1
        ? JSON.stringify(formData.minh_chung_ktx_urls)
        : (formData.minh_chung_ktx_urls[0] || dormReg?.minh_chung_url || 'https://drive.google.com');

      const { error: updateError } = await supabase
        .from('sinh_vien')
        .update({
          ho_ten: formData.ho_ten.trim().toUpperCase(),
          ngay_sinh: formData.ngay_sinh || null,
          gioi_tinh: formData.gioi_tinh,
          ngay_cap_cccd: formData.ngay_cap_cccd || null,
          noi_cap_cccd: finalNoiCap.trim(),
          sdt_ca_nhan: formData.sdt_ca_nhan.trim(),
          sdt_gia_dinh: formData.sdt_gia_dinh.trim(),
          email_sv: formData.email_sv.trim().toLowerCase(),
          nganh_hoc: formData.nganh_hoc,
          diem_xet_tuyen: parseFloat(String(formData.diem_xet_tuyen)) || 0,
          ho_khau_thuong_tru: fullAddressTT,
          dia_chi_tam_tru: fullAddressTamTru,
          trang_thai_ho_so: 'DA_HOAN_THIEN',
        })
        .eq('cccd', studentData.cccd);

      if (updateError) throw updateError;

      if (formData.dang_ky_ktx_choice) {
        const maHoSo = dormReg?.ma_ho_so || `KTX26-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const selectedRoom = coSoKtxList.find((r) => r.id_toa_nha === formData.id_toa_nha);
        const tenKhu = selectedRoom ? `${selectedRoom.ten_toa_nha} (${selectedRoom.loai_phong})` : formData.khu_ktx_dang_ky;

        const { error: ktxError } = await supabase
          .from('dang_ky_ktx')
          .upsert({
            ma_ho_so: maHoSo,
            cccd: studentData.cccd,
            id_toa_nha: formData.id_toa_nha || null,
            khu_ktx_dang_ky: tenKhu,
            bac_uu_tien: formData.bac_uu_tien,
            minh_chung_url: ktxUrlsPayload,
            trang_thai_duyet: dormReg?.trang_thai_duyet || 'CHO_DUYET',
            is_deleted: false,
            thoi_gian_nop: new Date().toISOString(),
          }, { onConflict: 'cccd' });

        if (ktxError) throw ktxError;
      } else {
        await supabase.from('dang_ky_ktx').delete().eq('cccd', studentData.cccd);
        setDormReg(null);
      }

      const { error: bhytError } = await supabase
        .from('dang_ky_bhyt')
        .upsert({
          cccd: studentData.cccd,
          co_tam_tru_hcm: formData.co_tam_tru,
          dia_chi_tam_tru_vneid: fullAddressTamTru,
          anh_minh_chung_vneid_url: vneidUrlsPayload,
          ma_the_bhyt: formData.ma_the_bhyt.trim().toUpperCase(),
          han_su_dung_bhyt: formData.han_su_dung_bhyt,
          doi_tuong_bhyt: formData.doi_tuong_bhyt,
          da_kham_sk_kh228: formData.da_kham_sk_kh228,
          quoc_tich: formData.quoc_tich,
          dan_toc: formData.dan_toc,
          trang_thai_duyet: bhytReg?.trang_thai_duyet || 'CHO_DUYET',
          is_deleted: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'cccd' });

      if (bhytError) throw bhytError;

      setMessage({ type: 'success', text: '🎉 Hồ sơ sinh viên, thông tin KTX & BHYT đã được cập nhật thành công!' });
      loadStudentInfo(studentData.cccd);
    } catch (err: any) {
      console.error('Lỗi lưu hồ sơ:', err);
      setMessage({ type: 'error', text: 'Lỗi lưu thông tin: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_cccd');
    localStorage.removeItem('student_data');
    router.push('/');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0E1E45] flex items-center justify-center text-white font-bold text-sm">
        Đang nạp dữ liệu hồ sơ thí sinh...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 flex flex-col font-sans">
      <style jsx global>{`
        #printA4Template {
          display: none;
        }
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
          }
          .web-ui-only {
            display: none !important;
          }
          #printA4Template {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 15mm 15mm 20mm !important;
            background: white !important;
            color: black !important;
            font-family: 'Times New Roman', Times, serif !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* 1. HEADER CHUẨN NHẬN DIỆN THƯƠNG HIỆU */}
      <AppHeader
        namHoc={systemConfigs.NAM_HOC}
        isLoggedIn={true}
        onLogout={handleLogout}
      />

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 web-ui-only">
        
        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-bold border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* MỤC 1: THÔNG TIN CÁ NHÂN & THÔNG TIN TRÚNG TUYỂN */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[#0E1E45] flex items-center gap-2">
                <span>📝</span> 1. THÔNG TIN CÁ NHÂN TÂN SINH VIÊN
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vui lòng kiểm tra và điền đầy đủ các mục có dấu (*) để hoàn tất hồ sơ
              </p>
            </div>

            <div className="space-y-4 text-xs font-medium text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Mã Sinh Viên (MSSV)</label>
                  <input
                    type="text"
                    value={formData.ma_sv || ''}
                    placeholder="Tự động hiển thị..."
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-slate-50 text-gray-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ho_ten || ''}
                    onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                    placeholder="NGUYỄN VĂN A"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none uppercase font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* NGÀNH TRÚNG TUYỂN & ĐIỂM XÉT TUYỂN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Ngành trúng tuyển <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.nganh_hoc}
                    onChange={(e) => setFormData({ ...formData, nganh_hoc: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-semibold cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn ngành học --</option>
                    {nganhHocList.map((ng) => (
                      <option key={ng.id} value={ng.ten_nganh}>
                        {ng.ten_nganh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Điểm xét tuyển <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="40"
                    value={formData.diem_xet_tuyen}
                    onChange={(e) => setFormData({ ...formData, diem_xet_tuyen: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="Ví dụ: 24.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ngay_sinh || ''}
                    onChange={(e) => setFormData({ ...formData, ngay_sinh: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gioi_tinh || ''}
                    onChange={(e) => setFormData({ ...formData, gioi_tinh: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-semibold bg-white cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Ngày cấp CCCD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ngay_cap_cccd || ''}
                    onChange={(e) => setFormData({ ...formData, ngay_cap_cccd: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Nơi cấp CCCD <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={noiCapType}
                    onChange={(e) => handleNoiCapChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 bg-white font-medium cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn hoặc nhập nơi cấp --</option>
                    <option value="Cục Cảnh sát quản lý hành chính về trật tự xã hội">
                      1. Cục Cảnh sát quản lý hành chính về trật tự xã hội (Thẻ gắn chip từ 10/10/2018)
                    </option>
                    <option value="Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư">
                      2. Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư (Mã vạch 01/01/2016 - 10/10/2018)
                    </option>
                    <option value="Bộ Công an">3. Bộ Công an</option>
                    <option value="Công an tỉnh / thành phố">4. Công an tỉnh / thành phố trực thuộc Trung ương</option>
                    <option value="KHAC">5. Khác (Sinh viên tự nhập theo mặt sau CCCD)</option>
                  </select>

                  {(noiCapType === 'KHAC' || noiCapType === 'Công an tỉnh / thành phố') && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder={
                          noiCapType === 'Công an tỉnh / thành phố'
                            ? 'Ví dụ: Công an TP. Hồ Chí Minh hoặc Công an tỉnh Đồng Nai'
                            : 'Nhập chính xác cơ quan cấp ghi ở mặt sau thẻ CCCD...'
                        }
                        value={customNoiCap}
                        onChange={(e) => {
                          setCustomNoiCap(e.target.value);
                          setFormData((prev) => ({ ...prev, noi_cap_cccd: e.target.value }));
                        }}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-amber-300 bg-amber-50/50 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    SĐT cá nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.sdt_ca_nhan || ''}
                    onChange={(e) => setFormData({ ...formData, sdt_ca_nhan: e.target.value })}
                    placeholder="0905xxxxxx"
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    SĐT gia đình <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.sdt_gia_dinh || ''}
                    onChange={(e) => setFormData({ ...formData, sdt_gia_dinh: e.target.value })}
                    placeholder="0913xxxxxx"
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Email liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email_sv || ''}
                    onChange={(e) => setFormData({ ...formData, email_sv: e.target.value })}
                    placeholder="sinhvien@gmail.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800"
                  />
                </div>
              </div>

              {/* ĐỊA CHỈ THƯỜNG TRÚ */}
              <div className="pt-3 border-t border-gray-100">
                <div className="font-bold text-xs uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                  <span>📍</span> Hộ khẩu thường trú (Theo CCCD / VNeID) <span className="text-red-500">*</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-6 space-y-1">
                    <label className="block font-bold text-gray-700 mb-1.5 leading-tight">
                      Địa chỉ chi tiết (Thôn/Xóm/Số nhà/Tên đường) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.dia_chi_chi_tiet_tt}
                      onChange={(e) => setFormData({ ...formData, dia_chi_chi_tiet_tt: e.target.value })}
                      onBlur={() => autoCleanDetailAddress('dia_chi_chi_tiet_tt', formData.phuong_xa_tt, formData.tinh_thanh_tt)}
                      placeholder="Ví dụ: Số 123 đường ABC"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800"
                    />
                    <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 pt-0.5">
                      <span>⚠️</span> Lưu ý: Không nhập tên Phường/Xã hay Tỉnh/Thành vào ô này.
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Tỉnh / Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="tinhThanhListTT"
                      value={formData.tinh_thanh_tt}
                      onChange={(e) => setFormData({ ...formData, tinh_thanh_tt: e.target.value, phuong_xa_tt: '' })}
                      placeholder="Gõ tìm Tỉnh/Thành..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-semibold"
                    />
                    <datalist id="tinhThanhListTT">
                      {distinctTinhThanh.map((tinh) => (
                        <option key={`tt-${tinh}`} value={tinh} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Phường / Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="phuongXaListTT"
                      value={formData.phuong_xa_tt}
                      onChange={(e) => setFormData({ ...formData, phuong_xa_tt: e.target.value })}
                      placeholder="Gõ tìm Phường/Xã..."
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none text-gray-800 font-semibold"
                    />
                    <datalist id="phuongXaListTT">
                      {filteredPhuongXaTT.map((xa, idx) => (
                        <option key={`tt-xa-${xa}-${idx}`} value={xa} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* ĐỊA CHỈ TẠM TRÚ */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Sinh viên có TẠM TRÚ tại Thành phố Hồ Chí Minh không? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.co_tam_tru ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, co_tam_tru: e.target.value === 'true' })}
                    className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-semibold cursor-pointer"
                  >
                    <option value="false">Không (Thường trú tại tỉnh hoặc đang ở KTX)</option>
                    <option value="true">Có (Đang tạm trú / thuê trọ ngoài)</option>
                  </select>
                </div>

                {formData.co_tam_tru && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                    <div className="font-bold text-xs uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                      <span>🏠</span> Địa chỉ Tạm trú (Xác định trên VNeID) <span className="text-red-500">*</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-6 space-y-1">
                        <label className="block font-bold text-gray-700 mb-1.5 leading-tight">
                          Địa chỉ chi tiết (Thôn/Xóm/Số nhà/Tên đường) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.dia_chi_chi_tiet_tam_tru}
                          onChange={(e) => setFormData({ ...formData, dia_chi_chi_tiet_tam_tru: e.target.value })}
                          onBlur={() => autoCleanDetailAddress('dia_chi_chi_tiet_tam_tru', formData.phuong_xa_tam_tru, formData.tinh_thanh_tam_tru)}
                          placeholder="Ví dụ: Số 181 Đường Lê Đức Thọ"
                          required={formData.co_tam_tru}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white text-gray-800"
                        />
                        <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 pt-0.5">
                          <span>⚠️</span> Lưu ý: Không nhập tên Phường/Xã hay Tỉnh/Thành vào ô này.
                        </p>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block font-bold text-gray-700 mb-1.5">
                          Tỉnh / Thành phố <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          list="tinhThanhListTamTru"
                          value={formData.tinh_thanh_tam_tru}
                          onChange={(e) => setFormData({ ...formData, tinh_thanh_tam_tru: e.target.value, phuong_xa_tam_tru: '' })}
                          placeholder="Gõ tìm Tỉnh/Thành..."
                          required={formData.co_tam_tru}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white text-gray-800 font-semibold"
                        />
                        <datalist id="tinhThanhListTamTru">
                          {distinctTinhThanh.map((tinh) => (
                            <option key={`tamtru-${tinh}`} value={tinh} />
                          ))}
                        </datalist>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block font-bold text-gray-700 mb-1.5">
                          Phường / Xã <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          list="phuongXaListTamTru"
                          value={formData.phuong_xa_tam_tru}
                          onChange={(e) => setFormData({ ...formData, phuong_xa_tam_tru: e.target.value })}
                          placeholder="Gõ tìm Phường/Xã..."
                          required={formData.co_tam_tru}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white text-gray-800 font-semibold"
                        />
                        <datalist id="phuongXaListTamTru">
                          {filteredPhuongXaTamTru.map((xa, idx) => (
                            <option key={`tamtru-xa-${xa}-${idx}`} value={xa} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SCAN MINH CHỨNG VNeID */}
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <label className="block font-bold text-gray-700">
                  Ảnh chụp / Minh chứng: Nơi thường trú, Nơi Tạm trú CCCD trên VNeID <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openScanner('VNEID')}
                    className="px-4 py-2 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>📸</span> Scan Camera nhiều trang (Gộp PDF)
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputVneidRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>🖼️</span> Chọn nhiều ảnh / File PDF
                  </button>

                  <input
                    ref={fileInputVneidRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleSelectMultipleFiles(e, 'VNEID')}
                    className="hidden"
                  />

                  {uploadingDoc && activeScanTarget === 'VNEID' && (
                    <span className="text-blue-700 font-bold flex items-center gap-1 animate-pulse">
                      ⏳ Đang tải file lên CSDL Supabase...
                    </span>
                  )}
                </div>

                {formData.anh_minh_chung_vneid_urls.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {formData.anh_minh_chung_vneid_urls.map((url, idx) => (
                      <div key={`vneid-file-${idx}`} className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-emerald-700 font-bold">📄 Tệp {idx + 1}:</span>
                          <span className="text-emerald-900 font-mono truncate max-w-xs sm:max-w-md">{url}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 transition text-[11px]"
                          >
                            👁️ Xem
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('VNEID', idx)}
                            className="px-2 py-1 text-red-600 hover:bg-red-100 rounded-lg font-bold transition text-[11px]"
                          >
                            ✕ Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <span>💡</span> Bạn có thể chụp liên tiếp nhiều trang hoặc chọn cùng lúc nhiều ảnh màn hình VNeID mức 2.
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* MỤC 2: ĐĂNG KÝ NGUYỆN VỌNG KTX */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0E1E45] flex items-center gap-2">
                  <span>🏢</span> 2. ĐĂNG KÝ NGUYỆN VỌNG KTX
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lựa chọn cơ sở Ký túc xá để Hội đồng xét duyệt chỗ ở
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dang_ky_ktx_choice}
                  onChange={(e) => setFormData({ ...formData, dang_ky_ktx_choice: e.target.checked })}
                  className="w-4 h-4 text-[#8B0000] rounded focus:ring-[#8B0000]"
                />
                <span>Tôi có nguyện vọng ở KTX</span>
              </label>
            </div>

            {dormReg && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="font-bold text-xs sm:text-sm flex flex-wrap items-center gap-2">
                    <span>📋</span>
                    <span>MÃ HỒ SƠ KTX: <strong className="font-mono text-red-700">{dormReg.ma_ho_so}</strong></span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dormReg.trang_thai_duyet === 'DA_DUYET'
                        ? 'bg-emerald-200 text-emerald-900'
                        : dormReg.trang_thai_duyet === 'TU_CHOI'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {dormReg.trang_thai_duyet === 'DA_DUYET' ? '✓ ĐÃ DUYỆT' : dormReg.trang_thai_duyet === 'TU_CHOI' ? '✕ TỪ CHỐI' : '⏳ ĐANG CHỜ DUYỆT'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    Khu vực đăng ký: <strong>{dormReg.khu_ktx_dang_ky}</strong> • Bậc: {dormReg.bac_uu_tien}
                  </p>
                  {dormReg.ly_do_tu_choi && (
                    <p className="text-xs text-red-600 font-semibold mt-1">Lý do từ chối: {dormReg.ly_do_tu_choi}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow transition shrink-0 cursor-pointer"
                >
                  📄 In Phiếu Tiếp Nhận A4
                </button>
              </div>
            )}

            {formData.dang_ky_ktx_choice && (
              <div className="space-y-4 pt-2 text-xs font-medium text-gray-700">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Bậc ưu tiên xét duyệt KTX <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bac_uu_tien}
                    onChange={(e) => setFormData({ ...formData, bac_uu_tien: e.target.value })}
                    required={formData.dang_ky_ktx_choice}
                    className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-semibold cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn bậc ưu tiên --</option>
                    {bacUuTienList.map((b) => (
                      <option key={b.id} value={b.ten_bac}>
                        {b.ten_bac}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Khu Ký túc xá đăng ký <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.id_toa_nha}
                    onChange={(e) => {
                      const selected = coSoKtxList.find((r) => r.id_toa_nha === e.target.value);
                      setFormData({
                        ...formData,
                        id_toa_nha: e.target.value,
                        khu_ktx_dang_ky: selected ? `${selected.ten_toa_nha} (${selected.loai_phong})` : '',
                      });
                    }}
                    required={formData.dang_ky_ktx_choice}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-semibold cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn cơ sở KTX đăng ký --</option>
                    {coSoKtxList.map((room) => (
                      <option key={room.id_toa_nha} value={room.id_toa_nha}>
                        {room.ten_toa_nha} ({room.loai_phong}) – Còn {room.so_giuong_trong} chỗ
                      </option>
                    ))}
                  </select>
                </div>

                {/* MINH CHỨNG KTX */}
                <div className="pt-2 border-t border-gray-100 space-y-2.5">
                  <label className="block font-bold text-gray-700">
                    Minh chứng Bậc ưu tiên KTX (Sổ hộ nghèo, con TB/LS, Tuyển thẳng...)
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openScanner('KTX')}
                      className="px-4 py-2 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <span>📸</span> Scan Camera nhiều trang (Gộp PDF)
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputKtxRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <span>📁</span> Chọn nhiều tệp / File PDF
                    </button>

                    <input
                      ref={fileInputKtxRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleSelectMultipleFiles(e, 'KTX')}
                      className="hidden"
                    />

                    {uploadingDoc && activeScanTarget === 'KTX' && (
                      <span className="text-blue-700 font-bold flex items-center gap-1 animate-pulse">
                        ⏳ Đang tải file minh chứng lên CSDL...
                      </span>
                    )}
                  </div>

                  {formData.minh_chung_ktx_urls.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {formData.minh_chung_ktx_urls.map((url, idx) => (
                        <div key={`ktx-file-${idx}`} className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-emerald-700 font-bold">📄 Minh chứng {idx + 1}:</span>
                            <span className="text-emerald-900 font-mono truncate max-w-xs sm:max-w-md">{url}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 transition text-[11px]"
                            >
                              👁️ Xem
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('KTX', idx)}
                              className="px-2 py-1 text-red-600 hover:bg-red-100 rounded-lg font-bold transition text-[11px]"
                            >
                              ✕ Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">
                      💡 Sinh viên diện Bậc 1, 2, 3 vui lòng scan hoặc chụp tải lên toàn bộ các trang giấy tờ minh chứng.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MỤC 3: BHYT & SỨC KHỎE */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0E1E45] flex items-center gap-2">
                  <span>🏥</span> 3. KÊ KHAI THÔNG TIN BẢO HIỂM Y TẾ (BHYT)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Phục vụ công tác cấp thẻ BHYT học sinh - sinh viên và quyền lợi chăm sóc sức khỏe ban đầu
                </p>
              </div>
              {bhytReg && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  bhytReg.trang_thai_duyet === 'DA_DUYET'
                    ? 'bg-emerald-100 text-emerald-800'
                    : bhytReg.trang_thai_duyet === 'TU_CHOI'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  BHYT: {bhytReg.trang_thai_duyet === 'DA_DUYET' ? 'Đã duyệt' : bhytReg.trang_thai_duyet === 'TU_CHOI' ? 'Từ chối' : 'Chờ duyệt'}
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs font-medium text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Mã thẻ BHYT trên VssID hoặc VNeID (gồm cả chữ và số) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ma_the_bhyt}
                    onChange={(e) => setFormData({ ...formData, ma_the_bhyt: e.target.value.toUpperCase() })}
                    placeholder="VÍ DỤ: SV479..., AK282..., GD479..., DN479..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none uppercase font-mono font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Giá trị sử dụng thẻ BHYT hiện tại trên VssID hoặc VNeID <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.han_su_dung_bhyt}
                    onChange={(e) => setFormData({ ...formData, han_su_dung_bhyt: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn hạn sử dụng thẻ --</option>
                    {hanBhytList.map((h) => (
                      <option key={h.id} value={h.ten_han}>
                        {h.ten_han}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Đối tượng tham gia BHYT năm học 2026 - 2027 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.doi_tuong_bhyt}
                  onChange={(e) => setFormData({ ...formData, doi_tuong_bhyt: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-semibold cursor-pointer"
                >
                  <option value="" disabled>-- Chọn đối tượng tham gia BHYT --</option>
                  {doiTuongBhytList.map((dt) => (
                    <option key={dt.id} value={dt.ten_doi_tuong}>
                      {dt.ten_doi_tuong}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 min-h-[36px] flex items-end leading-tight">
                    <span>Khám SK theo KH số 228/KH-UBND của UBND TP.HCM tại địa phương? <span className="text-red-500">*</span></span>
                  </label>
                  <select
                    value={formData.da_kham_sk_kh228}
                    onChange={(e) => setFormData({ ...formData, da_kham_sk_kh228: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="" disabled>-- Chọn tình trạng --</option>
                    <option value="Chưa tham gia">Chưa tham gia</option>
                    <option value="Đã tham gia">Đã tham gia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 min-h-[36px] flex items-end">
                    <span>Quốc tịch <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    list="quocTichDbList"
                    value={formData.quoc_tich}
                    onChange={(e) => setFormData({ ...formData, quoc_tich: e.target.value })}
                    placeholder="Gõ tìm hoặc chọn Quốc tịch..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none font-medium bg-white"
                  />
                  <datalist id="quocTichDbList">
                    {quocGiaList.map((qt) => (
                      <option key={qt} value={qt} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 min-h-[36px] flex items-end">
                    <span>Dân tộc <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    list="danTocDbList"
                    value={formData.dan_toc}
                    onChange={(e) => setFormData({ ...formData, dan_toc: e.target.value })}
                    placeholder="Gõ tìm hoặc chọn Dân tộc..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none font-medium bg-white"
                  />
                  <datalist id="danTocDbList">
                    {danTocList.map((dt) => (
                      <option key={dt} value={dt} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs sm:text-sm cursor-pointer flex items-center gap-2"
            >
              <span>💾</span>
              <span>{submitting ? 'Đang lưu hồ sơ...' : 'Lưu & Hoàn Thiện Hồ Sơ'}</span>
            </button>
          </div>
        </form>
      </main>

      {/* FOOTER CHÂN TRANG */}
      <AppFooter namHoc={systemConfigs.NAM_HOC} hotline={systemConfigs.HOTLINE_KTX} />

      {/* MODAL SCANNER CAMERA ĐA TRANG */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-md">
          <div className="bg-[#121212] text-white rounded-3xl max-w-lg w-full h-[90vh] max-h-[750px] flex flex-col overflow-hidden relative border border-white/10 shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/40">
              <button
                type="button"
                onClick={closeScanner}
                className="text-white text-lg hover:text-gray-300 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {activeScanTarget === 'VNEID' ? '📸 Scan Cư trú VNeID' : '📸 Scan Minh chứng Ưu tiên KTX'} 
                {scannedPages.length > 0 && ` (Đã chụp ${scannedPages.length} trang)`}
              </div>
              {scannedPages.length > 0 ? (
                <button
                  type="button"
                  onClick={handleMergeAndSaveAllPages}
                  disabled={uploadingDoc}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  {uploadingDoc ? 'Đang lưu...' : `Lưu ${scannedPages.length} Trang ✓`}
                </button>
              ) : (
                <div className="w-8"></div>
              )}
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                
                <div className="absolute inset-x-8 inset-y-16 border-2 border-blue-500 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br"></div>
                </div>

                <div className="absolute bottom-4 inset-x-4 flex justify-between items-center">
                  <div className="px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-[11px] text-white/90 border border-white/20">
                    Canh 4 góc và bấm nút chụp
                  </div>

                  {scannedPages.length > 0 && (
                    <div className="flex items-center gap-1 bg-black/70 p-1 rounded-xl border border-white/20 overflow-x-auto max-w-[150px]">
                      {scannedPages.map((p, idx) => (
                        <div key={idx} className="relative w-8 h-10 rounded border border-blue-400 overflow-hidden shrink-0">
                          <img src={p} alt={`Trang ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-blue-600 text-[8px] px-1 font-bold">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/80 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setExportFormat('PDF')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    exportFormat === 'PDF' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Gộp 1 File PDF
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('IMAGE')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    exportFormat === 'IMAGE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Từng Ảnh JPG
                </button>
              </div>

              <button
                type="button"
                onClick={handleCaptureOnePage}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-lg"
                title="Bấm để chụp thêm trang"
              >
                <div className="w-12 h-12 rounded-full bg-white"></div>
              </button>

              {scannedPages.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setScannedPages((prev) => prev.slice(0, -1))}
                  className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Xóa trang cuối
                </button>
              ) : (
                <div className="w-16"></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. TEMPLATE IN ĐƠN A4 PHÁP LÝ */}
      <div id="printA4Template">
        <div style={{ fontFamily: "'Times New Roman', Times, serif", color: 'black', lineHeight: '1.4', fontSize: '12pt', boxSizing: 'border-box', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '48%', textAlign: 'center', verticalAlign: 'top', paddingRight: '5px' }}>
                  <div style={{ fontSize: '11.5pt', fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.25', color: 'black' }}>
                    HỌC VIỆN HÀNH CHÍNH<br />VÀ QUẢN TRỊ CÔNG
                  </div>
                  <div style={{ fontSize: '11.5pt', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.25', marginTop: '2px', color: 'black' }}>
                    PHÂN HIỆU HỌC VIỆN<br />HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG<br />TẠI THÀNH PHỐ HỒ CHÍ MINH
                  </div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '1px', color: 'black' }}>*</div>
                </td>
                <td style={{ width: '52%', textAlign: 'center', verticalAlign: 'top', paddingLeft: '5px' }}>
                  <div style={{ fontSize: '12.5pt', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", color: 'black', lineHeight: '1.2' }}>
                    ĐẢNG CỘNG SẢN VIỆT NAM
                  </div>
                  <div style={{ width: '220px', borderBottom: '1.5px solid black', margin: '3px auto 5px auto' }}></div>
                  <div style={{ fontSize: '11.5pt', fontStyle: 'italic', fontFamily: "'Times New Roman', Times, serif", color: 'black' }}>
                    TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {String(new Date().getMonth() + 1).padStart(2, '0')} năm {new Date().getFullYear()}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
              ĐƠN ĐĂNG KÝ Ở KÝ TÚC XÁ NĂM HỌC 2027
            </h2>
            <div style={{ fontSize: '10.5pt', fontStyle: 'italic', marginTop: '2px' }}>
              (Mã tiếp nhận trực tuyến: <strong style={{ fontSize: '11pt', color: 'black' }}>{dormReg?.ma_ho_so || 'KTX26-0024'}</strong>)
            </div>
          </div>

          <div style={{ fontSize: '11.5pt', marginBottom: '6px', lineHeight: '1.35' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '75px', verticalAlign: 'top', fontWeight: 'bold' }}>Kính gửi:</td>
                  <td style={{ verticalAlign: 'top' }}>
                    - Ban Giám đốc Phân hiệu Học viện Hành chính và Quản trị công tại Thành phố Hồ Chí Minh;<br />
                    - Phòng Quản trị;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '11.5pt', lineHeight: '1.45', textAlign: 'justify' }}>
            <div style={{ marginBottom: '3px' }}>Tôi tên: <strong style={{ textTransform: 'uppercase' }}>{formData.ho_ten || studentData.ho_ten}</strong></div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>Mã sinh viên (MSSV): <strong>{formData.ma_sv || studentData.ma_sv || 'N/A'}</strong></td>
                  <td style={{ width: '50%' }}>Giới tính: <span>{formData.gioi_tinh || studentData.gioi_tinh}</span></td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '3px' }}>Ngày sinh: <span>{formData.ngay_sinh ? formData.ngay_sinh.split('-').reverse().join('/') : ''}</span></div>
            <div style={{ marginBottom: '3px' }}>Ngành học: <strong>{formData.nganh_hoc || studentData.nganh_hoc || 'Quản lý nhà nước'}</strong></div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '45%' }}>Số CCCD: <strong style={{ fontFamily: 'monospace' }}>{studentData.cccd}</strong></td>
                  <td style={{ width: '25%' }}>Ngày cấp: <span>{formData.ngay_cap_cccd ? formData.ngay_cap_cccd.split('-').reverse().join('/') : ''}</span></td>
                  <td style={{ width: '30%' }}>Nơi cấp: <span>{formData.noi_cap_cccd}</span></td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '3px' }}>
              Hộ khẩu thường trú: <span>{[formData.dia_chi_chi_tiet_tt, formData.phuong_xa_tt, formData.tinh_thanh_tt].filter(Boolean).join(', ') || studentData.ho_khau_thuong_tru}</span>
            </div>

            {formData.co_tam_tru && (
              <div style={{ marginBottom: '3px' }}>
                Địa chỉ tạm trú: <span>{[formData.dia_chi_chi_tiet_tam_tru, formData.phuong_xa_tam_tru, formData.tinh_thanh_tam_tru].filter(Boolean).join(', ')}</span>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>Số điện thoại cá nhân: <strong>{formData.sdt_ca_nhan || studentData.sdt_ca_nhan}</strong></td>
                  <td style={{ width: '50%' }}>Số điện thoại gia đình: <span>{formData.sdt_gia_dinh || studentData.sdt_gia_dinh}</span></td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '3px' }}>Khu Ký túc xá đăng ký: <strong>{dormReg?.khu_ktx_dang_ky || formData.khu_ktx_dang_ky || 'KTX 3 tầng (Số 10 đường 3/2)'}</strong></div>
            <div style={{ marginBottom: '3px' }}>Bậc ưu tiên xét duyệt KTX: <span style={{ fontStyle: 'italic' }}>{dormReg?.bac_uu_tien || formData.bac_uu_tien}</span></div>
            
            <p style={{ marginTop: '5px', textIndent: '25px', textAlign: 'justify', lineHeight: '1.35', marginBottom: '3px' }}>
              Tôi làm đơn này được đăng ký ở tại Ký túc xá để tiện sinh hoạt và học tập. Tôi xin cam kết ở đúng số phòng - số giường đã được xếp, thực hiện nghiêm túc nội quy Ký túc xá, thanh toán đầy đủ các khoản phí và trả phòng đúng thời gian quy định. Em xin mang theo giấy tờ minh chứng diện ưu tiên bản chính/bản sao công chứng để nộp trực tiếp khi làm thủ tục nhập học.
            </p>
            
            <div style={{ textAlign: 'left', marginTop: '2px' }}>Trân trọng.</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: '11.5pt' }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>XÁC NHẬN CỦA HỘI ĐỒNG KTX</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                </td>
                <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', fontSize: '11.5pt' }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>NGƯỜI LÀM ĐƠN</div>
                  <div style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {formData.ho_ten || studentData.ho_ten}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '10px', borderTop: '1px dashed #777', paddingTop: '3px', fontSize: '8.5pt', fontStyle: 'italic', color: '#444' }}>
            * Thí sinh in đơn này khổ A4 và nộp kèm bản cứng giấy tờ minh chứng diện ưu tiên khi làm thủ tục nhập học trực tiếp tại số 10 đường 3/2.
          </div>
        </div>
      </div>
    </div>
  );
}