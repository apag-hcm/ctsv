'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';

export default function StudentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentCccd, setStudentCccd] = useState<string>('');

  // Danh mục dùng chung
  const [danhSachQuocTich, setDanhSachQuocTich] = useState<any[]>([]);
  const [danhSachDanToc, setDanhSachDanToc] = useState<any[]>([]);
  const [danhSachBacUuTien, setDanhSachBacUuTien] = useState<any[]>([]);
  const [danhSachCoSoKtx, setDanhSachCoSoKtx] = useState<any[]>([]);
  const [danhSachHanBhyt, setDanhSachHanBhyt] = useState<any[]>([]);
  const [danhSachDoiTuongBhyt, setDanhSachDoiTuongBhyt] = useState<any[]>([]);
  const [danhSachTinhKcb, setDanhSachTinhKcb] = useState<any[]>([]);

  // Dữ liệu bệnh viện theo tỉnh
  const [danhSachBenhVienTheoTinh, setDanhSachBenhVienTheoTinh] = useState<any[]>([]);
  const [loadingBenhVien, setLoadingBenhVien] = useState(false);

  // Form State sinh viên
  const [formData, setFormData] = useState({
    // Thông tin định danh cá nhân
    cccd: '',
    ho_ten: '',
    ngay_sinh: '',
    gioi_tinh: 'Nam',
    quoc_tich: 'Việt Nam',
    dan_toc: 'Kinh',
    ngay_cap_cccd: '',
    noi_cap_cccd: 'Cục Cảnh sát QLHC về trật tự xã hội',
    sdt_ca_nhan: '',
    sdt_gia_dinh: '',
    email_sv: '',
    ho_khau_thuong_tru: '',
    nganh_hoc: '',
    diem_xet_tuyen: 24.5,

    // Ký túc xá
    dang_ky_ktx: true,
    khu_ktx_dang_ky: 'KTX 3 tầng (Số 10 đường 3/2)',
    bac_uu_tien: 'Bậc 4: Sinh viên tự túc kinh phí',
    minh_chung_url: '',

    // Bảo hiểm y tế (BHYT) & VNeID
    dang_ky_bhyt: true,
    ma_the_bhyt: '',
    han_su_dung_bhyt: 'Tham gia 12 tháng',
    doi_tuong_bhyt: 'HSSV đóng BHYT tại trường',
    tinh_kcb: '79', // Mặc định TP. Hồ Chí Minh
    tinh_kcb_ten: 'Thành phố Hồ Chí Minh',
    benh_vien_kcb: '',
    co_tam_tru_hcm: false,
    dia_chi_tam_tru_vneid: '',
    da_kham_sk_kh228: 'Đã hoàn thành khám sức khỏe',
  });

  // 1. Kiểm tra xác thực CCCD
  useEffect(() => {
    const storedCccd = localStorage.getItem('student_cccd');
    if (!storedCccd) {
      router.push('/');
      return;
    }
    setStudentCccd(storedCccd);
    loadInitialData(storedCccd);
  }, []);

  // 2. Tải toàn bộ danh mục và dữ liệu hồ sơ sinh viên
  const loadInitialData = async (cccd: string) => {
    try {
      setLoading(true);

      const [
        studentRes,
        ktxRes,
        bhytRes,
        bacRes,
        ktxRoomsRes,
        hanBhytRes,
        dtBhytRes,
        danTocRes,
        quocTichRes,
        diaChiRes,
      ] = await Promise.all([
        supabase.from('sinh_vien').select('*').eq('cccd', cccd).maybeSingle(),
        supabase.from('dang_ky_ktx').select('*').eq('cccd', cccd).maybeSingle(),
        supabase.from('dang_ky_bhyt').select('*').eq('cccd', cccd).maybeSingle(),
        supabase.from('danh_muc_bac_uu_tien').select('*').order('thu_tu', { ascending: true }),
        supabase.from('co_so_ktx').select('*').order('created_at', { ascending: true }),
        supabase.from('danh_muc_han_bhyt').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_doi_tuong_bhyt').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_dan_toc').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_quoc_gia').select('*').order('thu_tu', { ascending: true }),
        supabase.from('danh_muc_dia_chi').select('ma_tinh, ten_tinh').order('ten_tinh', { ascending: true }),
      ]);

      // Thiết lập danh mục
      setDanhSachBacUuTien((bacRes.data || []).filter((b: any) => !b.is_deleted));
      setDanhSachCoSoKtx((ktxRoomsRes.data || []).filter((r: any) => !r.is_deleted));
      setDanhSachHanBhyt((hanBhytRes.data || []).filter((h: any) => !h.is_deleted));
      setDanhSachDoiTuongBhyt((dtBhytRes.data || []).filter((d: any) => !d.is_deleted));
      setDanhSachDanToc(danTocRes.data || []);
      setDanhSachQuocTich(quocTichRes.data || []);

      // Lập danh sách tỉnh không trùng
      if (diaChiRes.data && diaChiRes.data.length > 0) {
        const mapTinh = new Map();
        diaChiRes.data.forEach((item: any) => {
          if (!mapTinh.has(item.ma_tinh)) {
            mapTinh.set(item.ma_tinh, { id: String(item.ma_tinh), ten: item.ten_tinh });
          }
        });
        setDanhSachTinhKcb(Array.from(mapTinh.values()));
      } else {
        setDanhSachTinhKcb([
          { id: '79', ten: 'Thành phố Hồ Chí Minh' },
          { id: '01', ten: 'Thành phố Hà Nội' },
          { id: '48', ten: 'Thành phố Đà Nẵng' },
          { id: '31', ten: 'Thành phố Hải Phòng' },
          { id: '92', ten: 'Thành phố Cần Thơ' },
          { id: '74', ten: 'Tỉnh Bình Dương' },
          { id: '75', ten: 'Tỉnh Đồng Nai' },
          { id: '77', ten: 'Tỉnh Bà Rịa - Vũng Tàu' },
          { id: '80', ten: 'Tỉnh Long An' },
        ]);
      }

      // Gộp dữ liệu hiện có của sinh viên
      const s = studentRes.data || {};
      const k = ktxRes.data || {};
      const b = bhytRes.data || {};

      setFormData((prev) => ({
        ...prev,
        cccd: cccd,
        ho_ten: s.ho_ten || prev.ho_ten,
        ngay_sinh: s.ngay_sinh ? s.ngay_sinh.split('T')[0] : prev.ngay_sinh,
        gioi_tinh: s.gioi_tinh || prev.gioi_tinh,
        quoc_tich: s.quoc_tich || b.quoc_tich || 'Việt Nam',
        dan_toc: s.dan_toc || b.dan_toc || 'Kinh',
        ngay_cap_cccd: s.ngay_cap_cccd ? s.ngay_cap_cccd.split('T')[0] : prev.ngay_cap_cccd,
        noi_cap_cccd: s.noi_cap_cccd || prev.noi_cap_cccd,
        sdt_ca_nhan: s.sdt_ca_nhan || prev.sdt_ca_nhan,
        sdt_gia_dinh: s.sdt_gia_dinh || prev.sdt_gia_dinh,
        email_sv: s.email_sv || prev.email_sv,
        ho_khau_thuong_tru: s.ho_khau_thuong_tru || prev.ho_khau_thuong_tru,
        nganh_hoc: s.nganh_hoc || prev.nganh_hoc,
        diem_xet_tuyen: s.diem_xet_tuyen ?? prev.diem_xet_tuyen,

        // KTX
        dang_ky_ktx: !!k.ma_ho_so,
        khu_ktx_dang_ky: k.khu_ktx_dang_ky || prev.khu_ktx_dang_ky,
        bac_uu_tien: k.bac_uu_tien || prev.bac_uu_tien,
        minh_chung_url: k.minh_chung_url || '',

        // BHYT
        dang_ky_bhyt: !!b.id || true,
        ma_the_bhyt: b.ma_the_bhyt || '',
        han_su_dung_bhyt: b.han_su_dung_bhyt || prev.han_su_dung_bhyt,
        doi_tuong_bhyt: b.doi_tuong_bhyt || prev.doi_tuong_bhyt,
        tinh_kcb: b.tinh_kcb || '79',
        tinh_kcb_ten: b.tinh_kcb_ten || 'Thành phố Hồ Chí Minh',
        benh_vien_kcb: b.benh_vien_kcb || '',
        co_tam_tru_hcm: b.co_tam_tru_hcm || false,
        dia_chi_tam_tru_vneid: b.dia_chi_tam_tru_vneid || '',
        da_kham_sk_kh228: b.da_kham_sk_kh228 || prev.da_kham_sk_kh228,
      }));
    } catch (err) {
      console.error('Lỗi khởi tạo hồ sơ:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Tự động truy vấn danh sách Bệnh viện khi đổi Tỉnh/Thành phố
  useEffect(() => {
    if (!formData.tinh_kcb) {
      setDanhSachBenhVienTheoTinh([]);
      return;
    }

    const fetchBenhVien = async () => {
      try {
        setLoadingBenhVien(true);
        const rawId = String(formData.tinh_kcb).trim();
        const numId = String(parseInt(rawId, 10));
        const padId = rawId.padStart(2, '0');

        // Tìm khớp cả dạng số nguyên lẫn dạng chuỗi chuẩn
        const { data, error } = await supabase
          .from('danh_muc_cskcb')
          .select('ma_benh_vien, ten_benh_vien, ma_tinh')
          .or(`ma_tinh.eq.${rawId},ma_tinh.eq.${numId},ma_tinh.eq.${padId}`)
          .order('ten_benh_vien', { ascending: true });

        if (error) throw error;
        setDanhSachBenhVienTheoTinh(data || []);
      } catch (err) {
        console.error('Lỗi nạp bệnh viện từ CSDL:', err);
        setDanhSachBenhVienTheoTinh([]);
      } finally {
        setLoadingBenhVien(false);
      }
    };

    fetchBenhVien();
  }, [formData.tinh_kcb]);

  // 4. Lưu dữ liệu hồ sơ trực tuyến
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Cập nhật thông tin sinh viên
      const { error: stuErr } = await supabase
        .from('sinh_vien')
        .upsert(
          {
            cccd: formData.cccd,
            ho_ten: formData.ho_ten,
            ngay_sinh: formData.ngay_sinh,
            gioi_tinh: formData.gioi_tinh,
            quoc_tich: formData.quoc_tich,
            dan_toc: formData.dan_toc,
            ngay_cap_cccd: formData.ngay_cap_cccd,
            noi_cap_cccd: formData.noi_cap_cccd,
            sdt_ca_nhan: formData.sdt_ca_nhan,
            sdt_gia_dinh: formData.sdt_gia_dinh,
            email_sv: formData.email_sv,
            ho_khau_thuong_tru: formData.ho_khau_thuong_tru,
            nganh_hoc: formData.nganh_hoc,
            diem_xet_tuyen: formData.diem_xet_tuyen,
            trang_thai_ho_so: 'HOAN_THANH',
            is_deleted: false,
          },
          { onConflict: 'cccd' }
        );

      if (stuErr) throw stuErr;

      // Cập nhật đăng ký KTX
      if (formData.dang_ky_ktx) {
        const maHoSoKtx = `KTX26-${formData.cccd.slice(-6)}`;
        await supabase
          .from('dang_ky_ktx')
          .upsert(
            {
              ma_ho_so: maHoSoKtx,
              cccd: formData.cccd,
              khu_ktx_dang_ky: formData.khu_ktx_dang_ky,
              bac_uu_tien: formData.bac_uu_tien,
              minh_chung_url: formData.minh_chung_url,
              trang_thai_duyet: 'CHO_DUYET',
              is_deleted: false,
            },
            { onConflict: 'cccd' }
          );
      }

      // Cập nhật đăng ký BHYT
      if (formData.dang_ky_bhyt) {
        await supabase
          .from('dang_ky_bhyt')
          .upsert(
            {
              cccd: formData.cccd,
              ma_the_bhyt: formData.ma_the_bhyt,
              han_su_dung_bhyt: formData.han_su_dung_bhyt,
              doi_tuong_bhyt: formData.doi_tuong_bhyt,
              tinh_kcb: formData.tinh_kcb,
              tinh_kcb_ten: formData.tinh_kcb_ten,
              benh_vien_kcb: formData.benh_vien_kcb,
              co_tam_tru_hcm: formData.co_tam_tru_hcm,
              dia_chi_tam_tru_vneid: formData.dia_chi_tam_tru_vneid,
              da_kham_sk_kh228: formData.da_kham_sk_kh228,
              quoc_tich: formData.quoc_tich,
              dan_toc: formData.dan_toc,
              is_deleted: false,
            },
            { onConflict: 'cccd' }
          );
      }

      alert('🎉 Chúc mừng bạn đã hoàn thiện hồ sơ Tân sinh viên thành công!');
    } catch (err: any) {
      console.error('Lỗi nộp hồ sơ:', err);
      alert('Lỗi lưu hồ sơ: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_cccd');
    localStorage.removeItem('student_data');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1E45] flex items-center justify-center p-4">
        <div className="text-white text-center space-y-3 font-sans">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải hồ sơ tân sinh viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1E45] p-3 sm:p-6 lg:p-8 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0E1E45] via-[#162758] to-[#0E1E45] text-white p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-[#0E1E45] text-[10px] font-black uppercase tracking-wider">
              Cổng Tân Sinh Viên
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tight uppercase">
              HỒ SƠ NHẬP HỌC & ĐĂNG KÝ BHYT / KTX
            </h1>
            <p className="text-xs text-gray-300 font-mono">
              Thí sinh: <strong className="text-white uppercase">{formData.ho_ten}</strong> • CCCD: <span className="text-amber-300">{studentCccd}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🖨️</span> In đơn A4
            </button>
            <button
              onClick={handleLogout}
              type="button"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>Thoát</span> ✕
            </button>
          </div>
        </div>

        {/* NỘI DUNG BIỂU MẪU */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 text-xs">
          
          {/* MỤC 1: THÔNG TIN ĐỊNH DANH CÁ NHÂN */}
          <div className="space-y-4">
            <div className="font-extrabold text-sm uppercase tracking-wider text-[#0E1E45] border-b pb-2 flex items-center gap-2">
              <span>👤</span> 1. THÔNG TIN ĐỊNH DANH CÁ NHÂN (THEO CSDL QUỐC GIA DÂN CƯ)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Số CCCD / Số ĐDCN (*):</label>
                <input
                  type="text"
                  value={formData.cccd}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 font-mono font-bold text-gray-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và Tên (*):</label>
                <input
                  type="text"
                  value={formData.ho_ten}
                  onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-bold text-gray-900 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ngày sinh (*):</label>
                <input
                  type="date"
                  value={formData.ngay_sinh}
                  onChange={(e) => setFormData({ ...formData, ngay_sinh: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Giới tính (*):</label>
                <select
                  value={formData.gioi_tinh}
                  onChange={(e) => setFormData({ ...formData, gioi_tinh: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quốc tịch (*):</label>
                <select
                  value={formData.quoc_tich}
                  onChange={(e) => setFormData({ ...formData, quoc_tich: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                >
                  {danhSachQuocTich.length > 0 ? (
                    danhSachQuocTich.map((q: any) => (
                      <option key={q.id || q.ten_quoc_gia} value={q.ten_quoc_gia}>
                        {q.ten_quoc_gia}
                      </option>
                    ))
                  ) : (
                    <option value="Việt Nam">Việt Nam</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Dân tộc (*):</label>
                <select
                  value={formData.dan_toc}
                  onChange={(e) => setFormData({ ...formData, dan_toc: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                >
                  {danhSachDanToc.length > 0 ? (
                    danhSachDanToc.map((d: any) => (
                      <option key={d.id || d.ten_dan_toc} value={d.ten_dan_toc}>
                        {d.ten_dan_toc}
                      </option>
                    ))
                  ) : (
                    <option value="Kinh">Kinh</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại cá nhân (*):</label>
                <input
                  type="text"
                  value={formData.sdt_ca_nhan}
                  onChange={(e) => setFormData({ ...formData, sdt_ca_nhan: e.target.value })}
                  placeholder="090..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại gia đình / PH (*):</label>
                <input
                  type="text"
                  value={formData.sdt_gia_dinh}
                  onChange={(e) => setFormData({ ...formData, sdt_gia_dinh: e.target.value })}
                  placeholder="091..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email sinh viên (*):</label>
                <input
                  type="email"
                  value={formData.email_sv}
                  onChange={(e) => setFormData({ ...formData, email_sv: e.target.value })}
                  placeholder="sinhvien@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-bold text-gray-700 mb-1">Hộ khẩu thường trú (*):</label>
                <input
                  type="text"
                  value={formData.ho_khau_thuong_tru}
                  onChange={(e) => setFormData({ ...formData, ho_khau_thuong_tru: e.target.value })}
                  placeholder="Số nhà, đường, xã/phường, quận/huyện, tỉnh/thành phố..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* MỤC 2: KHỐI BẢO HIỂM Y TẾ (BHYT) & ĐĂNG KÝ BỆNH VIỆN KCB BAN ĐẦU */}
          <div className="space-y-4">
            <div className="font-extrabold text-sm uppercase tracking-wider text-[#0E1E45] border-b pb-2 flex items-center gap-2">
              <span>🏥</span> 2. KÊ KHAI BẢO HIỂM Y TẾ (BHYT) & NƠI KHÁM CHỮA BỆNH BAN ĐẦU
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mã số thẻ BHYT (nếu có):</label>
                <input
                  type="text"
                  value={formData.ma_the_bhyt}
                  onChange={(e) => setFormData({ ...formData, ma_the_bhyt: e.target.value })}
                  placeholder="10 hoặc 15 ký tự số..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-mono font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Thời hạn thẻ BHYT (*):</label>
                <select
                  value={formData.han_su_dung_bhyt}
                  onChange={(e) => setFormData({ ...formData, han_su_dung_bhyt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                >
                  {danhSachHanBhyt.map((h: any) => (
                    <option key={h.id} value={h.ten_han}>
                      {h.ten_han}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Đối tượng tham gia BHYT (*):</label>
                <select
                  value={formData.doi_tuong_bhyt}
                  onChange={(e) => setFormData({ ...formData, doi_tuong_bhyt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] font-semibold text-gray-900"
                >
                  {danhSachDoiTuongBhyt.map((d: any) => (
                    <option key={d.id} value={d.ten_doi_tuong}>
                      {d.ten_doi_tuong}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* KHỐI ĐĂNG KÝ NƠI KCB BAN ĐẦU - TRUY VẤN ĐỘNG TỪ BẢNG danh_muc_cskcb */}
            <div className="p-4 sm:p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
              <div className="font-extrabold text-xs uppercase tracking-wider text-[#0E1E45] flex items-center gap-1.5">
                <span>📍</span> NƠI ĐĂNG KÝ KHÁM CHỮA BỆNH BAN ĐẦU (THEO CSDL BẢO HIỂM XÃ HỘI) <span className="text-red-500">*</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. TỈNH / THÀNH PHỐ */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    Tỉnh / Thành phố KCB (*):
                  </label>
                  <select
                    value={formData.tinh_kcb}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const found = danhSachTinhKcb.find((t: any) => String(t.id) === selectedVal);
                      setFormData({
                        ...formData,
                        tinh_kcb: selectedVal,
                        tinh_kcb_ten: found ? found.ten : '',
                        benh_vien_kcb: '', // Reset bệnh viện khi chuyển tỉnh
                      });
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] bg-white font-bold text-xs text-gray-900 cursor-pointer shadow-sm"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {danhSachTinhKcb.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.ten.includes(t.id) ? t.ten : `${t.id} - ${t.ten}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. BỆNH VIỆN NHẬN KCB BAN ĐẦU */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-bold text-gray-800">
                      Bệnh viện nhận KCB ban đầu (*):
                    </label>
                    {loadingBenhVien && (
                      <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                        Đang nạp bệnh viện từ CSDL...
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    list="danhSachBenhVienDatalist"
                    value={formData.benh_vien_kcb}
                    disabled={!formData.tinh_kcb || loadingBenhVien}
                    onChange={(e) => setFormData({ ...formData, benh_vien_kcb: e.target.value })}
                    placeholder={
                      !formData.tinh_kcb
                        ? 'Vui lòng chọn Tỉnh/Thành phố trước'
                        : loadingBenhVien
                        ? 'Đang tải danh sách cơ sở y tế...'
                        : 'Gõ hoặc chọn tên bệnh viện KCB...'
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] bg-white font-bold text-xs text-gray-900 disabled:bg-gray-100 shadow-sm"
                  />

                  {/* DANH SÁCH GỢI Ý TỰ ĐỘNG THEO TỈNH */}
                  <datalist id="danhSachBenhVienDatalist">
                    {danhSachBenhVienTheoTinh.map((bv) => (
                      <option key={bv.ma_benh_vien} value={`${bv.ma_benh_vien} - ${bv.ten_benh_vien}`}>
                        {bv.ten_benh_vien}
                      </option>
                    ))}
                  </datalist>

                  <p className="text-[11px] text-gray-500 mt-1.5">
                    {formData.tinh_kcb ? (
                      <>
                        Hệ thống đã nạp <strong className="text-blue-900 font-bold">{danhSachBenhVienTheoTinh.length}</strong> cơ sở y tế đủ điều kiện. Bạn có thể nhấn mũi tên hoặc gõ tên bệnh viện để tìm nhanh.
                      </>
                    ) : (
                      'Chọn Tỉnh/Thành phố để mở khóa danh mục bệnh viện tương ứng.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* ĐỊA CHỈ TẠM TRÚ VNeID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tamTruCheck"
                  checked={formData.co_tam_tru_hcm}
                  onChange={(e) => setFormData({ ...formData, co_tam_tru_hcm: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="tamTruCheck" className="font-bold text-gray-800 cursor-pointer">
                  Đã có đăng ký tạm trú tại TP. Hồ Chí Minh trên VNeID
                </label>
              </div>

              {formData.co_tam_tru_hcm && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Địa chỉ tạm trú trên VNeID:</label>
                  <input
                    type="text"
                    value={formData.dia_chi_tam_tru_vneid}
                    onChange={(e) => setFormData({ ...formData, dia_chi_tam_tru_vneid: e.target.value })}
                    placeholder="Địa chỉ ghi nhận trên ứng dụng VNeID..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* MỤC 3: ĐĂNG KÝ XÉT DUYỆT KÝ TÚC XÁ (KTX) */}
          <div className="space-y-4">
            <div className="font-extrabold text-sm uppercase tracking-wider text-[#0E1E45] border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🏢</span> 3. NGUYỆN VỌNG ĐĂNG KÝ LƯU TRÚ KÝ TÚC XÁ
              </span>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-blue-900">
                <input
                  type="checkbox"
                  checked={formData.dang_ky_ktx}
                  onChange={(e) => setFormData({ ...formData, dang_ky_ktx: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Có đăng ký KTX
              </label>
            </div>

            {formData.dang_ky_ktx ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cơ sở Ký túc xá đăng ký (*):</label>
                  <select
                    value={formData.khu_ktx_dang_ky}
                    onChange={(e) => setFormData({ ...formData, khu_ktx_dang_ky: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-900"
                  >
                    {danhSachCoSoKtx.map((c: any) => (
                      <option key={c.id_toa_nha || c.id} value={c.ten_toa_nha}>
                        {c.ten_toa_nha} ({c.loai_phong})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bậc ưu tiên xét duyệt (*):</label>
                  <select
                    value={formData.bac_uu_tien}
                    onChange={(e) => setFormData({ ...formData, bac_uu_tien: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-900"
                  >
                    {danhSachBacUuTien.map((b: any) => (
                      <option key={b.id} value={b.ten_bac}>
                        {b.ten_bac}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Thí sinh chọn không lưu trú tại Ký túc xá Học viện.</p>
            )}
          </div>

          {/* NÚT HOÀN TẤT HỒ SƠ */}
          <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-gray-500 italic">
              * Sinh viên cam đoan các thông tin kê khai trên là hoàn toàn chính xác theo căn cước công dân và CSDL bảo hiểm xã hội.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#8B0000] hover:bg-[#700000] text-white font-extrabold rounded-xl shadow-xl transition disabled:opacity-50 cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Đang lưu vào CSDL...' : 'Lưu & Hoàn Tất Hồ Sơ Nhập Học'}</span>
              <span>✓</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
