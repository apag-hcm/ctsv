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
  const [priority, setPriority] = useState('Không');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  useEffect(() => {
    const rawData = localStorage.getItem('student_data');
    if (!rawData) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(rawData);
    setStudent(parsed);

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

  const handleRegister = async () => {
    if (!selectedRoom) return;
    setLoading(true);

    try {
      // Gọi Stored Procedure chống Race Condition
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
        setStep(4); // Chuyển sang màn hình hoàn tất & In A4
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
          <h1 className="text-2xl font-bold text-gray-800">
            Đăng Ký Ký Túc Xá
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Quay lại Dashboard
          </button>
        </div>

        {/* Thanh tiến trình Step-by-step */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          {[
            '1. Chọn Phòng',
            '2. Diện Ưu Tiên',
            '3. Xác Nhận',
            '4. In Đơn A4',
          ].map((name, i) => (
            <div
              key={i}
              className={`text-sm font-semibold ${
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
              className="mt-6 bg-[#8B0000] text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Tiếp tục →
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
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                Xem lại & Xác nhận
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: XÁC NHẬN */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 max-w-xl">
            <h3 className="font-bold text-gray-800 text-lg">
              Xác nhận thông tin đăng ký
            </h3>
            <div className="text-sm space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Họ tên:</strong> {student.ho_ten}
              </p>
              <p>
                <strong>CCCD:</strong> {student.cccd}
              </p>
              <p>
                <strong>Phòng đăng ký:</strong> {selectedRoom?.toa_nha} -{' '}
                {selectedRoom?.so_phong}
              </p>
              <p>
                <strong>Mức phí:</strong>{' '}
                {Number(selectedRoom?.gia_tien).toLocaleString('vi-VN')}{' '}
                VNĐ/tháng
              </p>
              <p>
                <strong>Diện ưu tiên:</strong> {priority}
              </p>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Sửa lại
              </button>
              <button
                disabled={loading}
                onClick={handleRegister}
                className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-semibold"
              >
                {loading ? 'Đang ghi nhận...' : 'Nộp Đơn Đăng Ký'}
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: THÀNH CÔNG VÀ NÚT IN */}
        {step === 4 && (
          <div className="bg-white p-6 rounded-xl border border-green-200 bg-green-50/30 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-bold text-green-800">
              Đăng Ký Giữ Chỗ Thành Công!
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Hệ thống đã tạm giữ 1 chỗ tại{' '}
              <strong>
                {registrationSuccess?.room?.toa_nha} -{' '}
                {registrationSuccess?.room?.so_phong}
              </strong>
              . Vui lòng in đơn A4 dưới đây và nộp kèm hồ sơ.
            </p>
            <div className="pt-4 flex justify-center space-x-4">
              <button
                onClick={() => window.print()}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-black flex items-center space-x-2"
              >
                <span>🖨️ In Đơn Chuẩn A4</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MẪU ĐƠN IN CHUẨN HÀNH CHÍNH A4 (HIỂN THỊ KHI NHẤN IN HOẶC BƯỚC 4) */}
      <div
        className={`${
          step === 4 ? 'block' : 'print-only'
        } bg-white p-8 border border-gray-300 rounded-none max-w-[210mm] mx-auto text-black mt-8 text-sm leading-relaxed`}
      >
        <div className="text-center font-bold">
          <p className="uppercase text-xs">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="text-xs">Độc lập - Tự do - Hạnh phúc</p>
          <div className="w-24 border-b border-black mx-auto my-2"></div>
          <h2 className="text-lg font-black uppercase mt-6 mb-4">
            ĐƠN ĐĂNG KÝ NỘI TRÚ KÝ TÚC XÁ
          </h2>
          <p className="text-xs font-normal italic">Năm học: 2026 - 2027</p>
        </div>

        <div className="mt-8 space-y-3">
          <p>
            <strong>Kính gửi:</strong> Ban Quản lý Ký túc xá Đại học
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
            <p>Lớp: {student.lop || '............'}</p>
          </div>
          <p>
            Số điện thoại: {student.so_dien_thoai || '........................'}
          </p>
          <p>
            Địa chỉ thường trú:{' '}
            {student.dia_chi ||
              '................................................'}
          </p>
          <p>
            Nguyện vọng đăng ký:{' '}
            <strong>
              {registrationSuccess?.room?.toa_nha || selectedRoom?.toa_nha} -
              Phòng:{' '}
              {registrationSuccess?.room?.so_phong || selectedRoom?.so_phong}
            </strong>
          </p>
          <p>Diện ưu tiên: {priority}</p>
        </div>

        <div className="mt-6 text-justify italic text-xs">
          Tôi xin cam đoan những lời khai trên là đúng sự thật, chấp hành nghiêm
          chỉnh mọi nội quy, quy chế của Ký túc xá và Nhà trường. Nếu vi phạm
          tôi xin hoàn toàn chịu trách nhiệm.
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
