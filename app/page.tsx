'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';

export default function StudentHomePage() {
  const router = useRouter();
  const [cccdInput, setCccdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dữ liệu tải từ CSDL
  const [systemConfigs, setSystemConfigs] = useState({
    NAM_HOC: '2027',
    TRANG_THAI_CONG: 'AUTO',
    DEADLINE_DANG_KY: '2027-08-30 17:00:00',
    NGAY_TIEP_SINH: '25 - 26/8/2027',
    HOTLINE_KTX: '0905.865.919',
  });

  const [bacUuTienList, setBacUuTienList] = useState<any[]>([]);
  const [coSoKtxList, setCoSoKtxList] = useState<any[]>([]);
  const [lichNhapHocList, setLichNhapHocList] = useState<any[]>([]);

  // Đếm ngược thời gian
  const [timeLeft, setTimeLeft] = useState({ days: 365, hours: 6, minutes: 27, seconds: 30 });

  useEffect(() => {
    loadAllDataFromDb();
  }, []);

  useEffect(() => {
    const targetDate = new Date(systemConfigs.DEADLINE_DANG_KY).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [systemConfigs.DEADLINE_DANG_KY]);

  const loadAllDataFromDb = async () => {
    try {
      const [settingsRes, bacRes, roomRes, lichRes] = await Promise.all([
        supabase.from('system_settings').select('*').eq('is_deleted', false),
        supabase.from('danh_muc_bac_uu_tien').select('*').order('thu_tu', { ascending: true }),
        supabase.from('co_so_ktx').select('*').eq('is_deleted', false).order('created_at', { ascending: true }),
        supabase.from('lich_nhap_hoc').select('*').order('thu_tu', { ascending: true }),
      ]);

      if (settingsRes.data) {
        const configMap: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => { configMap[s.key_name] = s.value_data; });

        setSystemConfigs({
          NAM_HOC: configMap['NAM_HOC'] || '2027',
          TRANG_THAI_CONG: configMap['TRANG_THAI_CONG'] || 'AUTO',
          DEADLINE_DANG_KY: configMap['DEADLINE_DANG_KY'] || '2027-08-30 17:00:00',
          NGAY_TIEP_SINH: configMap['NGAY_TIEP_SINH'] || '25 - 26/8/2027',
          HOTLINE_KTX: configMap['HOTLINE_KTX'] || '0905.865.919',
        });
      }

      setBacUuTienList(bacRes.data || []);
      setCoSoKtxList(roomRes.data || []);
      setLichNhapHocList(lichRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu trang chủ:', err);
    }
  };

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanCccd = cccdInput.trim();

    if (!cleanCccd || cleanCccd.length < 9) {
      setErrorMessage('Vui lòng nhập số CCCD hoặc Số định danh hợp lệ!');
      return;
    }

    try {
      setLoading(true);

      const { data: student, error } = await supabase
        .from('sinh_vien')
        .select('*')
        .eq('cccd', cleanCccd)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;

      if (student) {
        localStorage.setItem('student_cccd', student.cccd);
        localStorage.setItem('student_data', JSON.stringify(student));
        router.push('/dashboard');
      } else {
        const newStudent = {
          cccd: cleanCccd,
          ho_ten: `TÂN SINH VIÊN (${cleanCccd.slice(-4)})`,
          ngay_sinh: '2008-01-01',
          gioi_tinh: 'Nam',
          ngay_cap_cccd: '2024-01-01',
          noi_cap_cccd: 'Cục Cảnh sát quản lý hành chính về trật tự xã hội',
          sdt_ca_nhan: '0900000000',
          sdt_gia_dinh: '0910000000',
          email_sv: 'sinhvien@gmail.com',
          nganh_hoc: 'Quản lý nhà nước',
          diem_xet_tuyen: 24.5,
          ho_khau_thuong_tru: 'Thành phố Hồ Chí Minh',
          trang_thai_ho_so: 'CHUA_HOAN_THIEN',
          is_deleted: false,
        };

        const { error: insertErr } = await supabase.from('sinh_vien').insert([newStudent]);
        if (insertErr) throw insertErr;

        localStorage.setItem('student_cccd', cleanCccd);
        localStorage.setItem('student_data', JSON.stringify(newStudent));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi hệ thống: ' + (err.message || 'Không thể kết nối CSDL'));
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = 'https://lh3.googleusercontent.com/d/1EhYcDVJc8jezBSiGS1jJ6XM0EXxjvFKJ';

  return (
    <div className="min-h-screen bg-[#09132B] text-white flex flex-col font-sans">
      
      {/* 1. HEADER CHUẨN THƯƠNG HIỆU */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-8 shadow-sm">
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
                CỔNG THÔNG TIN TÂN SINH VIÊN ĐẠI HỌC CHÍNH QUY NĂM {systemConfigs.NAM_HOC}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 bg-[#0E1E45] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🛡️</span> Cổng Quản trị / Duyệt đơn
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN HERO SECTION */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: GIỚI THIỆU & FORM ĐĂNG NHẬP NỔI BẬT */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <span>🎓</span> Khóa tuyển sinh {systemConfigs.NAM_HOC} • Đại học chính quy
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Đăng ký xét duyệt <br />
                <span className="text-amber-400">Ký túc xá</span> trực tuyến
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Học viện hỗ trợ không gian lưu trú an toàn, tiện nghi, chi phí ưu đãi cho tân sinh viên trúng tuyển tại các cơ sở Ký túc xá thuộc Phân hiệu TP. Hồ Chí Minh.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="px-4 py-2 bg-blue-950/80 border border-blue-800/60 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>🛏️</span> Chỉ tiêu KTX: <strong className="text-amber-400">590 chỗ trống</strong>
              </div>
              <div className="px-4 py-2 bg-blue-950/80 border border-blue-800/60 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>📅</span> Tiếp sinh: <strong className="text-amber-400">{systemConfigs.NGAY_TIEP_SINH}</strong>
              </div>
            </div>

            {/* FORM XÁC THỰC CCCD SINH VIÊN (NỔI BẬT VỚI MÀU SẮC SANG TRỌNG) */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 text-gray-900 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4 max-w-xl border-2 border-amber-400/40 ring-4 ring-amber-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8B0000] via-amber-500 to-[#0E1E45]"></div>

              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-[#8B0000] text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                  Cổng trực tuyến 24/7
                </div>
                <h3 className="text-base sm:text-xl font-black text-[#0E1E45]">
                  Đăng Nhập / Hoàn Thiện Hồ Sơ Thí Sinh
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  Nhập số Căn cước công dân hoặc Số định danh cá nhân (Số ĐDCN) đã đăng ký xét tuyển
                </p>
              </div>

              <form onSubmit={handleLoginOrRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                    <span>💳</span> Số CCCD / Số ĐDCN (*):
                  </label>
                  <input
                    type="text"
                    value={cccdInput}
                    onChange={(e) => setCccdInput(e.target.value)}
                    placeholder="Nhập đúng 12 số CCCD..."
                    required
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 focus:border-[#0E1E45] focus:ring-4 focus:ring-[#0E1E45]/10 focus:outline-none text-xs sm:text-sm font-mono font-bold text-gray-900 bg-white shadow-inner transition"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                    <span>💡</span> Nhập số CCCD để hệ thống tự động nhận diện thông tin trúng tuyển của bạn.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                    <span>⚠️</span> {errorMessage}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#8B0000] to-red-800 hover:from-red-900 hover:to-red-950 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-xl hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 tracking-wide"
                  >
                    <span>{loading ? 'Đang xác thực...' : 'Gửi hồ sơ đăng ký xét duyệt KTX'}</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: ĐẾM NGƯỢC, BẬC ƯU TIÊN & ĐỊNH MỨC KINH PHÍ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ĐẾM NGƯỢC */}
            <div className="bg-[#091430] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-amber-300">
                <span>⏳ HẠN CHÓT NHẬN ĐƠN TRỰC TUYẾN</span>
                <span className="font-mono">{systemConfigs.DEADLINE_DANG_KY}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#050C1F] p-3 rounded-xl border border-blue-900/40">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.days}</div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5">Ngày</div>
                </div>
                <div className="bg-[#050C1F] p-3 rounded-xl border border-blue-900/40">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.hours}</div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5">Giờ</div>
                </div>
                <div className="bg-[#050C1F] p-3 rounded-xl border border-blue-900/40">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.minutes}</div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5">Phút</div>
                </div>
                <div className="bg-[#050C1F] p-3 rounded-xl border border-blue-900/40">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{timeLeft.seconds}</div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold mt-0.5">Giây</div>
                </div>
              </div>
            </div>

            {/* BẬC ƯU TIÊN NẠP TỪ CSDL */}
            <div className="bg-gradient-to-br from-[#0e1c3f] via-[#0b1632] to-[#121c38] border border-blue-400/30 p-6 rounded-3xl shadow-2xl space-y-4 text-xs relative overflow-hidden ring-1 ring-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-300 tracking-wide flex items-center gap-1.5 text-sm">
                  <span>💎</span> BẬC ƯU TIÊN XÉT DUYỆT KTX {systemConfigs.NAM_HOC}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold tracking-wider">
                  Tiêu chuẩn
                </span>
              </div>

              <div className="space-y-2.5 font-medium">
                {bacUuTienList.length > 0 ? (
                  bacUuTienList.map((b, idx) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-gradient-to-r from-red-950/50 via-rose-950/30 to-transparent border-red-500/40 shadow-inner'
                          : idx === 1
                          ? 'bg-gradient-to-r from-blue-950/50 via-indigo-950/30 to-transparent border-blue-500/30'
                          : 'bg-black/30 border-blue-900/40 hover:border-blue-700/60'
                      }`}
                    >
                      <div className={`font-bold text-sm mb-0.5 ${idx === 0 ? 'text-rose-300' : idx === 1 ? 'text-blue-300' : 'text-slate-200'}`}>
                        {b.ten_bac}
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{b.mo_ta_tieu_chi}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-2">Đang cập nhật danh mục ưu tiên...</div>
                )}
              </div>
            </div>

            {/* ĐỊNH MỨC KINH PHÍ KTX NẠP TỪ CSDL */}
            <div className="bg-gradient-to-br from-[#0c1a36] via-[#09132b] to-[#0f213f] border border-blue-400/30 p-6 rounded-3xl shadow-2xl space-y-4 text-xs relative overflow-hidden ring-1 ring-white/10">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-300 tracking-wide flex items-center gap-1.5 text-sm">
                  <span>💰</span> ĐỊNH MỨC KINH PHÍ KÝ TÚC XÁ {systemConfigs.NAM_HOC}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold tracking-wider">
                  Ưu đãi
                </span>
              </div>

              <div className="space-y-3">
                {coSoKtxList.length > 0 ? (
                  coSoKtxList.map((room) => (
                    <div
                      key={room.id_toa_nha}
                      className="p-4 bg-gradient-to-r from-black/60 to-blue-950/40 border border-blue-900/60 rounded-2xl flex justify-between items-center shadow-md hover:border-blue-500/50 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-white text-sm">{room.ten_toa_nha}</div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                          {room.tong_so_giuong} chỗ • <span className="text-gray-300">Còn <strong className="text-amber-300">{room.so_giuong_trong}</strong> chỗ trống</span>
                        </div>
                      </div>
                      <div className="font-mono font-black text-amber-400 text-xs sm:text-sm bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 shrink-0">
                        {room.loai_phong}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-2">Đang cập nhật cơ sở KTX...</div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* LƯU Ý VÀ LỊCH NHẬP HỌC TRỰC TIẾP */}
        <div className="space-y-6 pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="font-bold uppercase tracking-wide">LƯU Ý QUAN TRỌNG VỀ GIẤY TỜ MINH CHỨNG:</div>
              <p className="leading-relaxed text-amber-900">
                Hệ thống trực tuyến không yêu cầu tải lên tệp mạng. Sau khi đăng ký thành công, sinh viên vui lòng bấm <strong>In đơn A4</strong>, ký tên và mang theo <strong>bản chính hoặc bản sao công chứng giấy tờ ưu tiên</strong> để nộp trực tiếp tại bàn tiếp nhận KTX khi đến làm thủ tục nhập học tại trường!
              </p>
            </div>
          </div>

          <div className="bg-[#091430] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-xs sm:text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>📅</span> LỊCH NHẬP HỌC TRỰC TIẾP TẠI SỐ 10 ĐƯỜNG 3/2, PHƯỜNG HÒA HƯNG, TP.HCM
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {lichNhapHocList.length > 0 ? (
                lichNhapHocList.map((lich) => (
                  <div key={lich.id} className="p-4 bg-black/40 border border-blue-900/40 rounded-xl space-y-1.5">
                    <div className="font-bold text-amber-400 text-sm">🕒 {lich.tieu_de_ngay}</div>
                    <p className="text-gray-300 leading-relaxed">Ngành: {lich.danh_sach_nganh}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-4 md:col-span-3">Đang cập nhật lịch nhập học...</div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* 3. FOOTER CHÂN TRANG */}
      <footer className="bg-[#050C1F] text-white py-6 px-4 sm:px-8 border-t border-blue-900/40 text-center mt-auto">
        <div className="max-w-6xl mx-auto space-y-2 text-xs">
          <div className="font-extrabold text-sm sm:text-base text-amber-400 uppercase tracking-wide">
            PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG TẠI THÀNH PHỐ HỒ CHÍ MINH
          </div>
          <p className="text-gray-300 text-[11px] sm:text-xs">
            Cơ sở chính: Số 10, đường 3/2, Phường Hòa Hưng, Quận 10, TP. Hồ Chí Minh • Hotline KTX: <strong className="text-amber-300 font-mono">{systemConfigs.HOTLINE_KTX}</strong>
          </p>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-white/10">
            © {systemConfigs.NAM_HOC} APAG Phân hiệu TP. Hồ Chí Minh. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}