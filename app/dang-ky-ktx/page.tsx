'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function DangKyKTXPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  // State Bước 2: Diện ưu tiên
  const [priority, setPriority] = useState('Không');
  const [proofUrl, setProofUrl] = useState('');

  // State Bước 3: Thông tin BHYT & KCB (Chuẩn D03-TS)
  const [bhytData, setBhytData] = useState({
    ma_so_bhxh: '',
    doi_tuong_bhyt: 'Học sinh, sinh viên',
    tinh_kcb: '79', // Mặc định TP.HCM
    tinh_kcb_ten: 'Thành phố Hồ Chí Minh',
    benh_vien_kcb: '',
    quoc_tich: 'Việt Nam',
    dan_toc: 'Kinh',
    dia_chi_thuong_tru: '',
  });

  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  // Danh mục Tỉnh và Bệnh viện mẫu KCB
  const danhSachTinh = [
    { id: '79', ten: 'Thành phố Hồ Chí Minh' },
    { id: '75', ten: 'Tỉnh Đồng Nai' },
    { id: '74', ten: 'Tỉnh Bình Dương' },
    { id: '72', ten: 'Tỉnh Tây Ninh' },
  ];

  const danhSachBenhVien: Record<string, { id: string; ten: string }[]> = {
    '79': [
      { id: '79001', ten: 'Bệnh viện Chợ Rẫy' },
      { id: '79002', ten: 'Bệnh viện Nhân dân 115' },
      { id: '79003', ten: 'Bệnh viện Đại học Y Dược TP.HCM' },
      { id: '79004', ten: 'Bệnh viện Thống Nhất' },
    ],
    '75': [
      { id: '75001', ten: 'Bệnh viện Đa khoa Đồng Nai' },
      { id: '75002', ten: 'Bệnh viện Nhi đồng Đồng Nai' },
    ],
    '74': [
      { id: '74001', ten: 'Bệnh viện Đa khoa tỉnh Bình Dương' },
    ],
    '72': [
      { id: '72001', ten: 'Bệnh viện Đa khoa tỉnh Tây Ninh' },
    ],
  };

  useEffect(() => {
    const rawData = localStorage.getItem('student_data');
    if (!rawData) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(rawData);
    setStudent(parsed);
    if (parsed.ho_khau_thuong_tru || parsed.dia_chi) {
      setBhytData((prev) => ({
        ...prev,
        dia_chi_thuong_tru: parsed.ho_khau_thuong_tru || parsed.dia_chi || '',
      }));
    }

    // Tải danh sách phòng KTX khả dụng
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('dorm_rooms')
        .select('*')
        .eq('gioi_tinh_phong', parsed.gioi_tinh || 'Nam')
        .gt('so_giuong_trong', 0);
      setRooms(data || []);
    };
    fetchRooms();
  }, [router]);

  const handleBhytChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'tinh_kcb') {
      const selectedTinhObj = danhSachTinh.find((t) => t.id === value);
      setBhytData((prev) => ({
        ...prev,
        tinh_kcb: value,
        tinh_kcb_ten: selectedTinhObj ? selectedTinhObj.ten : '',
        benh_vien_kcb: '', // Reset bệnh viện khi đổi tỉnh
      }));
    } else {
      setBhytData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async () => {
    if (!selectedRoom) return;
    setLoading(true);

    try {
      // 1. Lưu thông tin BHYT chi tiết vào bảng dang_ky_bhyt
      await supabase.from('dang_ky_bhyt').upsert(
        {
          cccd: student.cccd,
          ma_so_bhxh: bhytData.ma_so_bhxh,
          doi_tuong_bhyt: bhytData.doi_tuong_bhyt,
          tinh_kcb: bhytData.tinh_kcb_ten,
          tinh_kcb_id: bhytData.tinh_kcb,
          benh_vien_kcb: bhytData.benh_vien_kcb,
          quoc_tich: bhytData.quoc_tich,
          dan_toc: bhytData.dan_toc,
          dia_chi_thuong_tru: bhytData.dia_chi_thuong_tru,
          is_deleted: false,
        },
        { onConflict: 'cccd' }
      );

      // 2. Gọi Stored Procedure giữ chỗ KTX chống Race Condition
      const { data, error } = await supabase.rpc('register_dorm_bed', {
        p_student_cccd: student.cccd,
        p_room_id: selectedRoom.id,
        p_priority_type: priority,
        p_proof_url: proofUrl,
      });

      if (error || !data.success) {
        alert(data?.message || 'Có lỗi xảy ra trong quá trình giữ chỗ.');
      } else {
        setRegistrationSuccess({
          regId: data.registration_id,
          room: selectedRoom,
          time: new Date().toLocaleDateString('vi-VN'),
        });
        setStep(5); // Chuyển sang màn hình hoàn tất & In A4
      }
    } catch (err: any) {
      alert('Lỗi hệ thống: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* GIAO DIỆN BƯỚC ĐĂNG KÝ (ẨN KHI IN) */}
      <div className="no-print">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Hoàn Thiện Hồ Sơ KTX & Kê Khai BHYT
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:underline cursor-pointer"
          >
            ← Quay lại Dashboard
          </button>
        </div>

        {/* Thanh tiến trình Step-by-step */}
        <div className="flex justify-between items-center mb-8 border-b pb-4 overflow-x-auto gap-2">
          {[
            '1. Chọn Phòng',
            '2. Ưu Tiên',
            '3. Kê Khai BHYT',
            '4. Xác Nhận',
            '5. In Đơn A4',
          ].map((name, i) => (
            <div
              key={i}
              className={`text-xs sm:text-sm font-semibold whitespace-nowrap px-2 ${
                step === i + 1
                  ? 'text-[#8B0000] border-b-2 border-[#8B0000] pb-2'
                  : 'text-gray-400'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* BƯỚC 1: CHỌN PHÒNG */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">
              Danh sách phòng phù hợp ({student.gioi_tinh}):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoom(r)}
                  className={`p-5 rounded-xl border cursor-pointer transition ${
                    selectedRoom?.id === r.id
                      ? 'border-[#8B0000] bg-red-50 ring-2 ring-[#8B0000]'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">
                        {r.toa_nha} - {r.so_phong}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {r.loai_phong}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                      Còn {r.so_giuong_trong} chỗ
                    </span>
                  </div>
                  <div className="mt-4 font-semibold text-[#8B0000]">
                    {Number(r.gia_tien).toLocaleString('vi-VN')} VNĐ / tháng
                  </div>
                </div>
              ))}
            </div>
            <button
              disabled={!selectedRoom}
              onClick={() => setStep(2)}
              className="mt-6 bg-[#8B0000] text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              Tiếp tục Bước 2 →
            </button>
          </div>
        )}

        {/* BƯỚC 2: DIỆN ƯU TIÊN */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 max-w-xl">
            <h3 className="font-bold text-gray-800">Khai báo diện ưu tiên</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Đối tượng ưu tiên:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="Không">Không thuộc diện ưu tiên</option>
                <option value="Hộ nghèo/Cận nghèo">Hộ nghèo / Cận nghèo</option>
                <option value="Gia đình chính sách/Thương binh">
                  Con gia đình chính sách / Thương binh
                </option>
                <option value="Vùng sâu vùng xa">
                  Hộ khẩu thường trú vùng đặc biệt khó khăn
                </option>
              </select>
            </div>
            {priority !== 'Không' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Đường dẫn minh chứng (Google Drive / Ảnh):
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 cursor-pointer"
              >
                ← Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              >
                Tiếp tục Kê khai BHYT →
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: KÊ KHAI BHYT & NƠI KCB BAN ĐẦU (CHUẨN MẪU D03-TS) */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 space-y-6 max-w-2xl">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>🏥</span> Kê Khai Thông Tin BHYT & Nơi Đăng Ký KCB Ban Đầu
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Thông tin này sẽ tự động đổ vào biểu mẫu kê khai D03-TS nộp lên cơ quan Bảo hiểm xã hội.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mã số BHXH (10 số nếu đã có thẻ cũ):
                  </label>
                  <input
                    type="text"
                    name="ma_so_bhxh"
                    value={bhytData.ma_so_bhxh}
                    onChange={handleBhytChange}
                    placeholder="VD: 792xxxxxxx"
                    maxLength={10}
                    className="w-full px-3 py-2.5 border rounded-xl font-mono focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Đối tượng tham gia BHYT (*):
                  </label>
                  <select
                    name="doi_tuong_bhyt"
                    value={bhytData.doi_tuong_bhyt}
                    onChange={handleBhytChange}
                    className="w-full px-3 py-2.5 border rounded-xl font-semibold focus:outline-none"
                  >
                    <option value="Học sinh, sinh viên">Học sinh, sinh viên</option>
                    <option value="Cận nghèo / Chính sách">Cận nghèo / Hộ gia đình chính sách</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tỉnh / Thành phố KCB ban đầu (*):
                  </label>
                  <select
                    name="tinh_kcb"
                    value={bhytData.tinh_kcb}
                    onChange={handleBhytChange}
                    className="w-full px-3 py-2.5 border rounded-xl font-semibold focus:outline-none"
                  >
                    {danhSachTinh.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Bệnh viện nhận KCB ban đầu (*):
                  </label>
                  <select
                    name="benh_vien_kcb"
                    value={bhytData.benh_vien_kcb}
                    onChange={handleBhytChange}
                    required
                    className="w-full px-3 py-2.5 border rounded-xl font-semibold focus:outline-none"
                  >
                    <option value="">-- Chọn bệnh viện KCB --</option>
                    {(danhSachBenhVien[bhytData.tinh_kcb] || []).map((bv) => (
                      <option key={bv.id} value={bv.ten}>
                        {bv.ten}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quốc tịch:</label>
                  <input
                    type="text"
                    name="quoc_tich"
                    value={bhytData.quoc_tich}
                    onChange={handleBhytChange}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dân tộc:</label>
                  <input
                    type="text"
                    name="dan_toc"
                    value={bhytData.dan_toc}
                    onChange={handleBhytChange}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Địa chỉ nhận thẻ / Thường trú chi tiết (*):
                </label>
                <input
                  type="text"
                  name="dia_chi_thuong_tru"
                  value={bhytData.dia_chi_thuong_tru}
                  onChange={handleBhytChange}
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện..."
                  required
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded-xl text-sm text-gray-600 cursor-pointer"
              >
                ← Quay lại
              </button>
              <button
                disabled={!bhytData.benh_vien_kcb}
                onClick={() => setStep(4)}
                className="bg-[#8B0000] text-white px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                Xem lại & Xác nhận →
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: XÁC NHẬN */}
        {step === 4 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 max-w-xl">
            <h3 className="font-bold text-gray-800 text-lg">
              Xác nhận thông tin đăng ký
            </h3>
            <div className="text-xs sm:text-sm space-y-2 text-gray-700 bg-gray-50 p-4 rounded-xl">
              <p><strong>Họ tên:</strong> {student.ho_ten}</p>
              <p><strong>CCCD:</strong> {student.cccd}</p>
              <p><strong>Phòng đăng ký:</strong> {selectedRoom?.toa_nha} - {selectedRoom?.so_phong}</p>
              <p><strong>Mức phí KTX:</strong> {Number(selectedRoom?.gia_tien).toLocaleString('vi-VN')} VNĐ/tháng</p>
              <p><strong>Diện ưu tiên:</strong> {priority}</p>
              <p><strong>Bệnh viện KCB BHYT:</strong> {bhytData.benh_vien_kcb} ({bhytData.tinh_kcb_ten})</p>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 cursor-pointer"
              >
                Sửa lại
              </button>
              <button
                disabled={loading}
                onClick={handleRegister}
                className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {loading ? 'Đang ghi nhận...' : 'Nộp Đơn Đăng Ký'}
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 5: THÀNH CÔNG VÀ NÚT IN */}
        {step === 5 && (
          <div className="bg-white p-6 rounded-xl border border-green-200 bg-green-50/30 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-bold text-green-800">
              Đăng Ký & Kê Khai BHYT Thành Công!
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Hệ thống đã lưu thông tin giữ chỗ KTX và dữ liệu BHYT mẫu D03-TS của bạn. Vui lòng in đơn A4 dưới đây để nộp.
            </p>
            <div className="pt-4 flex justify-center space-x-4">
              <button
                onClick={() => window.print()}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-black flex items-center space-x-2 cursor-pointer"
              >
                <span>🖨️ In Đơn Chuẩn A4</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MẪU ĐƠN IN CHUẨN HÀNH CHÍNH A4 (HIỂN THỊ KHI IN HOẶC BƯỚC 5) */}
      <div
        className={`${
          step === 5 ? 'block' : 'print-only'
        } bg-white p-8 border border-gray-300 rounded-none max-w-[210mm] mx-auto text-black mt-8 text-sm leading-relaxed`}
      >
        <div className="text-center font-bold">
          <p className="uppercase text-xs">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="text-xs">Độc lập - Tự do - Hạnh phúc</p>
          <div className="w-24 border-b border-black mx-auto my-2"></div>
          <h2 className="text-lg font-black uppercase mt-6 mb-4">
            ĐƠN ĐĂNG KÝ NỘI TRÚ KÝ TÚC XÁ & KÊ KHAI BHYT
          </h2>
          <p className="text-xs font-normal italic">Năm học: 2026 - 2027</p>
        </div>

        <div className="mt-8 space-y-3">
          <p>
            <strong>Kính gửi:</strong> Ban Quản lý Ký túc xá & Phòng CTSV
          </p>
          <p>
            Tôi tên là: <strong>{student.ho_ten}</strong>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <p>Số CCCD: {student.cccd}</p>
            <p>Ngày sinh: {student.ngay_sinh || '............'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <p>Giới tính: {student.gioi_tinh}</p>
            <p>Mã số BHXH cũ: {bhytData.ma_so_bhxh || 'Chưa có'}</p>
          </div>
          <p>
            Số điện thoại: {student.sdt_ca_nhan || student.so_dien_thoai || '........................'}
          </p>
          <p>
            Địa chỉ thường trú: {bhytData.dia_chi_thuong_tru || '................................................'}
          </p>
          <p>
            Nguyện vọng đăng ký KTX:{' '}
            <strong>
              {registrationSuccess?.room?.toa_nha || selectedRoom?.toa_nha} -
              Phòng: {registrationSuccess?.room?.so_phong || selectedRoom?.so_phong}
            </strong>
          </p>
          <p>Diện ưu tiên: {priority}</p>
          <p>
            <strong>Đăng ký KCB ban đầu BHYT:</strong> {bhytData.benh_vien_kcb} ({bhytData.tinh_kcb_ten})
          </p>
        </div>

        <div className="mt-6 text-justify italic text-xs">
          Tôi xin cam đoan những lời khai trên là đúng sự thật, chấp hành nghiêm chỉnh mọi nội quy, quy chế của Ký túc xá và Nhà trường, đồng thời tham gia BHYT đầy đủ theo quy định.
        </div>

        <div className="mt-12 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="font-bold uppercase">XÁC NHẬN CỦA BAN QUẢN LÝ</p>
            <p className="italic mt-1">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="italic">Ngày ..... tháng ..... năm 2026</p>
            <p className="font-bold uppercase mt-1">NGƯỜI LÀM ĐƠN</p>
            <p className="italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
            <p className="font-bold">{student.ho_ten}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
