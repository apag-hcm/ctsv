'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { parseExcelFile, exportToExcel } from '@/utils/excelMapper';

const EXPORT_COLUMNS_CONFIG = [
  { key: 'stt', label: 'STT', group: 'Cá nhân & Định danh', default: true },
  {
    key: 'ma_ho_so',
    label: 'Mã Hồ Sơ KTX',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'cccd',
    label: 'Số CCCD / ĐDCN',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'ma_sv',
    label: 'Mã Sinh Viên (MSSV)',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'ho_ten',
    label: 'Họ và Tên',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'gioi_tinh',
    label: 'Giới tính',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'ngay_sinh',
    label: 'Ngày sinh',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'sdt_ca_nhan',
    label: 'SĐT cá nhân',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'sdt_gia_dinh',
    label: 'SĐT gia đình',
    group: 'Cá nhân & Định danh',
    default: false,
  },
  {
    key: 'email_sv',
    label: 'Email sinh viên',
    group: 'Cá nhân & Định danh',
    default: false,
  },
  {
    key: 'ho_khau_thuong_tru',
    label: 'Hộ khẩu thường trú',
    group: 'Cá nhân & Định danh',
    default: true,
  },
  {
    key: 'ngay_cap_cccd',
    label: 'Ngày cấp CCCD',
    group: 'Cá nhân & Định danh',
    default: false,
  },
  {
    key: 'noi_cap_cccd',
    label: 'Nơi cấp CCCD',
    group: 'Cá nhân & Định danh',
    default: false,
  },
  {
    key: 'nganh_hoc',
    label: 'Ngành trúng tuyển',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'diem_xet_tuyen',
    label: 'Điểm xét tuyển',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'bac_uu_tien',
    label: 'Bậc ưu tiên KTX',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'khu_ktx_dang_ky',
    label: 'Cơ sở KTX đăng ký',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'trang_thai_duyet',
    label: 'Trạng thái duyệt KTX',
    group: 'Cơ sở & Duyệt KTX',
    default: true,
  },
  {
    key: 'ly_do_tu_choi',
    label: 'Lý do từ chối (nếu có)',
    group: 'Cơ sở & Duyệt KTX',
    default: false,
  },
  {
    key: 'thoi_gian_nop',
    label: 'Thời gian nộp đơn',
    group: 'Cơ sở & Duyệt KTX',
    default: false,
  },
  {
    key: 'co_tam_tru_hcm',
    label: 'Có tạm trú TP.HCM',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'dia_chi_tam_tru_vneid',
    label: 'Địa chỉ tạm trú VNeID',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'ma_the_bhyt',
    label: 'Mã thẻ BHYT',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'han_su_dung_bhyt',
    label: 'Hạn dùng thẻ BHYT',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'doi_tuong_bhyt',
    label: 'Đối tượng BHYT',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'da_kham_sk_kh228',
    label: 'Khám SK KH228',
    group: 'BHYT & VNeID',
    default: false,
  },
  {
    key: 'quoc_tich',
    label: 'Quốc tịch',
    group: 'BHYT & VNeID',
    default: false,
  },
  { key: 'dan_toc', label: 'Dân tộc', group: 'BHYT & VNeID', default: false },
];

export default function APAGAdminKTXPortal() {
  const router = useRouter();

  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [mainTab, setMainTab] = useState<'quanly' | 'caidat' | 'phanquyen'>(
    'quanly'
  );

  // Modal đăng nhập Admin
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dữ liệu xét duyệt & Quản lý
  const [dormRegs, setDormRegs] = useState<any[]>([]);
  const [coSoKtxList, setCoSoKtxList] = useState<any[]>([]);
  const [lichNhapHocList, setLichNhapHocList] = useState<any[]>([]);
  const [bacUuTienList, setBacUuTienList] = useState<any[]>([]);
  const [nganhHocList, setNganhHocList] = useState<any[]>([]);
  const [hanBhytList, setHanBhytList] = useState<any[]>([]);
  const [doiTuongBhytList, setDoiTuongBhytList] = useState<any[]>([]);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  // Modal chọn cột xuất Excel
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportKeys, setSelectedExportKeys] = useState<string[]>(
    EXPORT_COLUMNS_CONFIG.filter((c) => c.default).map((c) => c.key)
  );

  // Modal Nạp Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null
  );

  // Cấu hình Hệ Thống
  const [systemConfigs, setSystemConfigs] = useState({
    NAM_HOC: '2027',
    TRANG_THAI_CONG: 'AUTO',
    DEADLINE_DANG_KY: '2027-08-30 17:00:00',
    NGAY_TIEP_SINH: '25 - 26/8/2027',
    HOTLINE_KTX: '0905.865.919',
  });

  // Modal CRUD cấu hình động
  const [modalType, setModalType] = useState<
    | 'LICH'
    | 'COSO'
    | 'BAC'
    | 'NGANH'
    | 'HAN_BHYT'
    | 'DT_BHYT'
    | 'ADMIN_USER'
    | null
  >(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Forms CMS
  const [formLich, setFormLich] = useState({
    tieu_de_ngay: '',
    danh_sach_nganh: '',
  });
  const [formCoSo, setFormCoSo] = useState({
    ten_toa_nha: '',
    loai_phong: '',
    tong_so_giuong: 150,
  });
  const [formBac, setFormBac] = useState({ ten_bac: '', mo_ta_tieu_chi: '' });
  const [formGeneric, setFormGeneric] = useState({ ten: '', thu_tu: 1 });
  const [formAdminUser, setFormAdminUser] = useState({
    ho_ten: '',
    email: '',
    password: 'Apag@2026',
    role_khoa: 'QUAN_LY_KTX',
  });

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNganh, setFilterNganh] = useState('ALL');
  const [filterKhuKtx, setFilterKhuKtx] = useState('ALL');
  const [filterBacUuTien, setFilterBacUuTien] = useState('ALL');
  const [filterTrangThai, setFilterTrangThai] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // KIỂM TRA BẢO MẬT ĐĂNG NHẬP (AUTH GUARD)
  useEffect(() => {
    const rawAdmin = localStorage.getItem('admin_user');
    if (!rawAdmin) {
      setShowLoginModal(true);
      setLoading(false);
    } else {
      try {
        const adminObj = JSON.parse(rawAdmin);
        setCurrentAdmin(adminObj);
        loadAllData();
      } catch (e) {
        localStorage.removeItem('admin_user');
        setShowLoginModal(true);
        setLoading(false);
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const emailTrim = loginEmail.trim().toLowerCase();
    const passTrim = loginPassword.trim();

    if (!emailTrim || !passTrim) {
      setLoginError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }

    try {
      setActionLoading(true);

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', emailTrim)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error) throw error;

      if (adminUser && adminUser.password_hash === passTrim) {
        if (!adminUser.is_active) {
          setLoginError('Tài khoản của bạn đã bị tạm khóa!');
          return;
        }

        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        setCurrentAdmin(adminUser);
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        setMainTab('quanly');
        loadAllData();
      } else {
        setLoginError('Email hoặc Mật khẩu quản trị không chính xác!');
      }
    } catch (err: any) {
      setLoginError(
        'Lỗi đăng nhập: ' + (err.message || 'Không kết nối được CSDL')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      let allKtx: any[] = [];
      let fromKtx = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('dang_ky_ktx')
          .select('*')
          .eq('is_deleted', false)
          .order('thoi_gian_nop', { ascending: false })
          .range(fromKtx, fromKtx + step - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allKtx = allKtx.concat(data);
        if (data.length < step) break;
        fromKtx += step;
      }

      let allStudents: any[] = [];
      let fromSt = 0;
      while (true) {
        const { data, error } = await supabase
          .from('sinh_vien')
          .select('*')
          .eq('is_deleted', false)
          .range(fromSt, fromSt + step - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allStudents = allStudents.concat(data);
        if (data.length < step) break;
        fromSt += step;
      }

      let allBhyt: any[] = [];
      let fromBhyt = 0;
      while (true) {
        const { data, error } = await supabase
          .from('dang_ky_bhyt')
          .select('*')
          .eq('is_deleted', false)
          .range(fromBhyt, fromBhyt + step - 1);

        if (error) break;
        if (!data || data.length === 0) break;
        allBhyt = allBhyt.concat(data);
        if (data.length < step) break;
        fromBhyt += step;
      }

      const studentMap: Record<string, any> = {};
      allStudents.forEach((s) => {
        studentMap[s.cccd] = s;
        if (s.cccd && s.cccd.length === 12 && s.cccd.startsWith('0')) {
          studentMap[s.cccd.slice(1)] = s;
        }
      });

      const bhytMap: Record<string, any> = {};
      allBhyt.forEach((b) => {
        bhytMap[b.cccd] = b;
      });

      const mergedList = allKtx.map((r) => {
        const student = studentMap[r.cccd] || {};
        const bhyt = bhytMap[r.cccd] || {};
        return {
          ...r,
          sinh_vien: student,
          ho_ten: student.ho_ten || 'Chưa cập nhật',
          ma_sv: student.ma_sv || 'N/A',
          gioi_tinh: student.gioi_tinh || 'Nam',
          ngay_sinh: student.ngay_sinh ? student.ngay_sinh.split('T')[0] : '',
          nganh_hoc: student.nganh_hoc || 'Đại học Chính quy',
          diem_xet_tuyen: student.diem_xet_tuyen ?? 24.5,
          sdt_ca_nhan: student.sdt_ca_nhan || '',
          sdt_gia_dinh: student.sdt_gia_dinh || '',
          email_sv: student.email_sv || '',
          ho_khau_thuong_tru: student.ho_khau_thuong_tru || '',
          ngay_cap_cccd: student.ngay_cap_cccd || '',
          noi_cap_cccd: student.noi_cap_cccd || '',
          co_tam_tru_hcm: bhyt.co_tam_tru_hcm ? 'Có' : 'Không',
          dia_chi_tam_tru_vneid: bhyt.dia_chi_tam_tru_vneid || '',
          ma_the_bhyt: bhyt.ma_the_bhyt || '',
          han_su_dung_bhyt: bhyt.han_su_dung_bhyt || '',
          doi_tuong_bhyt: bhyt.doi_tuong_bhyt || '',
          da_kham_sk_kh228: bhyt.da_kham_sk_kh228 || 'Chưa tham gia',
          quoc_tich: bhyt.quoc_tich || 'Việt Nam',
          dan_toc: bhyt.dan_toc || 'Kinh',
        };
      });

      setDormRegs(mergedList);

      const [
        lichRes,
        coSoRes,
        bacRes,
        nganhRes,
        hanRes,
        dtRes,
        adminRes,
        settingRes,
      ] = await Promise.all([
        supabase
          .from('lich_nhap_hoc')
          .select('*')
          .order('thu_tu', { ascending: true }),
        supabase
          .from('co_so_ktx')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: true }),
        supabase
          .from('danh_muc_bac_uu_tien')
          .select('*')
          .order('thu_tu', { ascending: true }),
        supabase
          .from('danh_muc_nganh_hoc')
          .select('*')
          .order('thu_tu', { ascending: true }),
        supabase
          .from('danh_muc_han_bhyt')
          .select('*')
          .order('thu_tu', { ascending: true }),
        supabase
          .from('danh_muc_doi_tuong_bhyt')
          .select('*')
          .order('thu_tu', { ascending: true }),
        supabase
          .from('admin_users')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: true }),
        supabase.from('system_settings').select('*').eq('is_deleted', false),
      ]);

      setLichNhapHocList(lichRes.data || []);
      setCoSoKtxList(coSoRes.data || []);
      setBacUuTienList(bacRes.data || []);
      setNganhHocList(nganhRes.data || []);
      setHanBhytList(hanRes.data || []);
      setDoiTuongBhytList(dtRes.data || []);
      setAdminUsersList(adminRes.data || []);

      if (settingRes.data) {
        const configMap: Record<string, string> = {};
        settingRes.data.forEach((s: any) => {
          configMap[s.key_name] = s.value_data;
        });

        setSystemConfigs({
          NAM_HOC: configMap['NAM_HOC'] || '2027',
          TRANG_THAI_CONG: configMap['TRANG_THAI_CONG'] || 'AUTO',
          DEADLINE_DANG_KY:
            configMap['DEADLINE_DANG_KY'] || '2027-08-30 17:00:00',
          NGAY_TIEP_SINH: configMap['NGAY_TIEP_SINH'] || '25 - 26/8/2027',
          HOTLINE_KTX: configMap['HOTLINE_KTX'] || '0905.865.919',
        });
      }
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    setCurrentAdmin(null);
    setShowLoginModal(true);
  };

  const togglePortalStatus = async () => {
    const nextStatus =
      systemConfigs.TRANG_THAI_CONG === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      setActionLoading(true);
      await supabase
        .from('system_settings')
        .upsert(
          { key_name: 'TRANG_THAI_CONG', value_data: nextStatus },
          { onConflict: 'key_name' }
        );
      setSystemConfigs((prev) => ({ ...prev, TRANG_THAI_CONG: nextStatus }));
      alert(`Đã đổi trạng thái Cổng sang: ${nextStatus}`);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (
    ma_ho_so: string,
    newStatus: 'DA_DUYET' | 'TU_CHOI'
  ) => {
    let reason = null;
    if (newStatus === 'TU_CHOI') {
      reason = prompt('Nhập lý do từ chối hồ sơ này:');
      if (reason === null) return;
    }

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('dang_ky_ktx')
        .update({ trang_thai_duyet: newStatus, ly_do_tu_choi: reason })
        .eq('ma_ho_so', ma_ho_so);
      if (error) throw error;
      loadAllData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteExportExcel = () => {
    if (selectedExportKeys.length === 0) {
      alert('Vui lòng chọn ít nhất 1 trường thông tin để xuất!');
      return;
    }

    const exportRows = filteredRegs.map((r, index) => {
      const rowData: Record<string, any> = {};

      selectedExportKeys.forEach((key) => {
        const colConfig = EXPORT_COLUMNS_CONFIG.find((c) => c.key === key);
        const headerLabel = colConfig ? colConfig.label : key;

        if (key === 'stt') {
          rowData[headerLabel] = index + 1;
        } else if (key === 'trang_thai_duyet') {
          rowData[headerLabel] =
            r.trang_thai_duyet === 'DA_DUYET'
              ? 'Đã duyệt'
              : r.trang_thai_duyet === 'TU_CHOI'
              ? 'Từ chối'
              : 'Chờ duyệt';
        } else {
          rowData[headerLabel] =
            r[key] !== undefined && r[key] !== null ? r[key] : '';
        }
      });

      return rowData;
    });

    const nowStr = new Date().toISOString().slice(0, 10);
    exportToExcel(exportRows, `Danh_Sach_KTX_APAG_${nowStr}`);
    setShowExportModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImportFile(file);
    setShowImportModal(true);
    e.target.value = '';
  };

  const processExcelImport = async (isCleanYearReset: boolean) => {
    if (!selectedImportFile) return;

    if (isCleanYearReset) {
      const confirmed = confirm(
        '⚠️ CẢNH BÁO QUAN TRỌNG:\n\nBạn đang chọn chế độ "LÀM SẠCH TOÀN BỘ DỮ LIỆU NĂM CŨ ĐỂ NẠP NĂM HỌC MỚI".\nToàn bộ danh sách sinh viên, đăng ký KTX và BHYT cũ sẽ được làm sạch để chuẩn bị cho Khóa mới.\n\nBạn có chắc chắn muốn thực hiện không?'
      );
      if (!confirmed) return;
    }

    try {
      setActionLoading(true);
      setShowImportModal(false);

      if (isCleanYearReset) {
        await supabase
          .from('dang_ky_bhyt')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase
          .from('dang_ky_ktx')
          .delete()
          .neq('ma_ho_so', 'KEY_NEVER_MATCH');
        await supabase
          .from('sinh_vien')
          .delete()
          .neq('cccd', 'KEY_NEVER_MATCH');
      }

      const rows = await parseExcelFile(selectedImportFile);
      const formattedStudents: any[] = [];
      const formattedRegs: any[] = [];

      rows.forEach((r: any, idx: number) => {
        let rawCccd = String(
          r['Số ĐDCN'] ??
            r['So DDCN'] ??
            r['CCCD'] ??
            r['cccd'] ??
            r['Số CCCD'] ??
            ''
        ).trim();
        if (rawCccd && rawCccd.length > 0 && rawCccd.length < 12) {
          rawCccd = rawCccd.padStart(12, '0');
        }

        const hoTen = String(
          r['Họ và tên'] ?? r['Họ và Tên'] ?? r['ho_ten'] ?? ''
        ).trim();
        const maSv = String(
          r['Ma sinh vien'] ?? r['Mã SV'] ?? r['ma_sv'] ?? ''
        ).trim();
        const gioiTinh = String(
          r['Giới tính'] ?? r['gioi_tinh'] ?? 'Nam'
        ).trim();
        const nganhHoc = String(
          r['Tên mã xét tuyển trúng tuyển'] ?? r['Ngành học'] ?? ''
        ).trim();
        const diem = Number(r['Điểm trúng tuyển']) || 24.5;

        if (rawCccd.length === 12 && hoTen.length > 0) {
          formattedStudents.push({
            cccd: rawCccd,
            ma_sv: maSv || null,
            ho_ten: hoTen,
            gioi_tinh: gioiTinh,
            nganh_hoc: nganhHoc || null,
            diem_xet_tuyen: diem,
            trang_thai_ho_so: 'CHUA_HOAN_THIEN',
            is_deleted: false,
          });

          formattedRegs.push({
            ma_ho_so: `KTX26-${String(idx + 1).padStart(4, '0')}`,
            cccd: rawCccd,
            khu_ktx_dang_ky: 'KTX 3 tầng (Số 10 đường 3/2)',
            bac_uu_tien: 'Bậc 4: Sinh viên tự túc kinh phí',
            minh_chung_url: 'https://drive.google.com',
            trang_thai_duyet: 'CHO_DUYET',
            is_deleted: false,
          });
        }
      });

      for (let i = 0; i < formattedStudents.length; i += 200) {
        await supabase
          .from('sinh_vien')
          .upsert(formattedStudents.slice(i, i + 200), { onConflict: 'cccd' });
        await supabase
          .from('dang_ky_ktx')
          .upsert(formattedRegs.slice(i, i + 200), { onConflict: 'ma_ho_so' });
      }

      alert(
        isCleanYearReset
          ? `🎉 ĐÃ LÀM SẠCH VÀ NẠP MỚI THÀNH CÔNG ${formattedStudents.length} SINH VIÊN CHO NĂM HỌC MỚI!`
          : `🎉 ĐÃ NẠP BỔ SUNG THÀNH CÔNG ${formattedStudents.length} SINH VIÊN!`
      );
      loadAllData();
    } catch (err: any) {
      alert('Lỗi nạp Excel: ' + (err.message || err));
    } finally {
      setActionLoading(false);
      setSelectedImportFile(null);
    }
  };

  const handleSaveLich = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      await supabase
        .from('lich_nhap_hoc')
        .update(formLich)
        .eq('id', editItem.id);
    } else {
      await supabase.from('lich_nhap_hoc').insert([formLich]);
    }
    setModalType(null);
    setEditItem(null);
    loadAllData();
  };

  const handleDeleteLich = async (id: string) => {
    if (confirm('Xác nhận xóa ngày nhập học này?')) {
      await supabase.from('lich_nhap_hoc').delete().eq('id', id);
      loadAllData();
    }
  };

  const handleSaveCoSo = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase
      .from('co_so_ktx')
      .insert([{ ...formCoSo, so_giuong_trong: formCoSo.tong_so_giuong }]);
    setModalType(null);
    loadAllData();
  };

  const handleDeleteCoSo = async (id: string) => {
    if (confirm('Xác nhận xóa cơ sở KTX này?')) {
      await supabase.from('co_so_ktx').delete().eq('id_toa_nha', id);
      loadAllData();
    }
  };

  const handleSaveBac = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('danh_muc_bac_uu_tien').insert([formBac]);
    setModalType(null);
    loadAllData();
  };

  const handleDeleteBac = async (id: string) => {
    if (confirm('Xác nhận xóa bậc ưu tiên này?')) {
      await supabase.from('danh_muc_bac_uu_tien').delete().eq('id', id);
      loadAllData();
    }
  };

  const handleSaveGenericOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const tableName =
      modalType === 'NGANH'
        ? 'danh_muc_nganh_hoc'
        : modalType === 'HAN_BHYT'
        ? 'danh_muc_han_bhyt'
        : 'danh_muc_doi_tuong_bhyt';

    const colName =
      modalType === 'NGANH'
        ? 'ten_nganh'
        : modalType === 'HAN_BHYT'
        ? 'ten_han'
        : 'ten_doi_tuong';

    try {
      if (editItem) {
        await supabase
          .from(tableName)
          .update({ [colName]: formGeneric.ten, thu_tu: formGeneric.thu_tu })
          .eq('id', editItem.id);
      } else {
        await supabase
          .from(tableName)
          .insert([{ [colName]: formGeneric.ten, thu_tu: formGeneric.thu_tu }]);
      }
      setModalType(null);
      setEditItem(null);
      loadAllData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteGenericOption = async (tableName: string, id: number) => {
    if (confirm('Xác nhận xóa tùy chọn này?')) {
      await supabase.from(tableName).delete().eq('id', id);
      loadAllData();
    }
  };

  const handleSaveSystemConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const entries = Object.entries(systemConfigs).map(([key, val]) => ({
        key_name: key,
        value_data: val,
        updated_at: new Date().toISOString(),
      }));

      for (const item of entries) {
        await supabase
          .from('system_settings')
          .upsert(item, { onConflict: 'key_name' });
      }

      alert('🎉 Đã lưu cấu hình hệ thống thành công!');
      loadAllData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const emailClean = formAdminUser.email.trim().toLowerCase();
      const { error } = await supabase.from('admin_users').insert([
        {
          email: emailClean,
          ho_ten: formAdminUser.ho_ten.trim(),
          password_hash: formAdminUser.password.trim(),
          role_khoa: formAdminUser.role_khoa,
          is_active: true,
          is_deleted: false,
        },
      ]);

      if (error) throw error;
      alert('🎉 Đã thêm quản trị viên mới thành công!');
      setModalType(null);
      setFormAdminUser({
        ho_ten: '',
        email: '',
        password: 'Apag@2026',
        role_khoa: 'QUAN_LY_KTX',
      });
      loadAllData();
    } catch (err: any) {
      alert('Lỗi thêm quản trị viên: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdminStatus = async (
    adminId: string,
    currentStatus: boolean
  ) => {
    try {
      await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('admin_id', adminId);
      loadAllData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleUpdateAdminRole = async (adminId: string, newRole: string) => {
    try {
      await supabase
        .from('admin_users')
        .update({ role_khoa: newRole })
        .eq('admin_id', adminId);
      loadAllData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeleteAdminUser = async (adminId: string, email: string) => {
    if (confirm(`Xác nhận xóa tài khoản quản trị: ${email}?`)) {
      await supabase.from('admin_users').delete().eq('admin_id', adminId);
      loadAllData();
    }
  };

  const totalCapacity = useMemo(() => {
    return (
      coSoKtxList.reduce((acc, cur) => acc + (cur.tong_so_giuong || 0), 0) ||
      590
    );
  }, [coSoKtxList]);

  const totalOccupied = useMemo(() => {
    return dormRegs.filter(
      (r) =>
        r.trang_thai_duyet === 'DA_DUYET' || r.trang_thai_duyet === 'CHO_DUYET'
    ).length;
  }, [dormRegs]);

  const occupancyPercent =
    totalCapacity > 0
      ? ((totalOccupied / totalCapacity) * 100).toFixed(1)
      : '0.0';

  const totalPriorityCount = useMemo(() => {
    return dormRegs.filter((r) => {
      const bac = (r.bac_uu_tien || '').toLowerCase();
      return (
        bac.includes('bậc 1') ||
        bac.includes('bậc 2') ||
        bac.includes('chính sách') ||
        bac.includes('điểm cao')
      );
    }).length;
  }, [dormRegs]);

  const distinctNganh = useMemo(() => {
    const setN = new Set<string>();
    dormRegs.forEach((r) => {
      if (r.nganh_hoc) setN.add(r.nganh_hoc);
    });
    return Array.from(setN);
  }, [dormRegs]);

  const distinctKhuKtx = useMemo(() => {
    const setK = new Set<string>();
    dormRegs.forEach((r) => {
      if (r.khu_ktx_dang_ky) setK.add(r.khu_ktx_dang_ky);
    });
    return Array.from(setK);
  }, [dormRegs]);

  const filteredRegs = useMemo(() => {
    return dormRegs.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        r.ma_ho_so.toLowerCase().includes(query) ||
        r.cccd.includes(query) ||
        (r.ho_ten && r.ho_ten.toLowerCase().includes(query)) ||
        (r.ma_sv && r.ma_sv.toLowerCase().includes(query));

      const matchNganh = filterNganh === 'ALL' || r.nganh_hoc === filterNganh;
      const matchKhu =
        filterKhuKtx === 'ALL' || r.khu_ktx_dang_ky === filterKhuKtx;
      const matchBac =
        filterBacUuTien === 'ALL' ||
        (r.bac_uu_tien || '').startsWith(filterBacUuTien);
      const matchStatus =
        filterTrangThai === 'ALL' || r.trang_thai_duyet === filterTrangThai;

      return matchSearch && matchNganh && matchKhu && matchBac && matchStatus;
    });
  }, [
    dormRegs,
    searchQuery,
    filterNganh,
    filterKhuKtx,
    filterBacUuTien,
    filterTrangThai,
  ]);

  const totalPages = Math.ceil(filteredRegs.length / itemsPerPage) || 1;
  const paginatedRegs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegs.slice(start, start + itemsPerPage);
  }, [filteredRegs, currentPage]);

  const groupedExportColumns = EXPORT_COLUMNS_CONFIG.reduce(
    (acc: Record<string, any[]>, col) => {
      if (!acc[col.group]) acc[col.group] = [];
      acc[col.group].push(col);
      return acc;
    },
    {}
  );

  // Kiểm tra quyền Super Admin hiện tại
  const isSuperAdmin = currentAdmin?.role_khoa === 'SUPER_ADMIN';

  // NẾU CHƯA ĐĂNG NHẬP -> HIỆN MODAL ĐĂNG NHẬP BẢO MẬT TUYỆT ĐỐI
  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-[#0E1E45] flex items-center justify-center p-4 font-sans">
        <div className="bg-white text-gray-900 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 border border-gray-100">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#8B0000] text-white rounded-2xl mx-auto flex items-center justify-center font-black text-sm shadow">
              APAG
            </div>
            <h2 className="text-lg font-bold text-[#0E1E45]">
              CỔNG QUẢN TRỊ & HỘI ĐỒNG DUYỆT KTX
            </h2>
            <p className="text-xs text-gray-500">
              Vui lòng đăng nhập tài khoản Cán bộ / Admin được cấp phép.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Email đăng nhập (*):
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="canbo@apag.edu.vn"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Mật khẩu quản trị (*):
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0E1E45] focus:outline-none font-mono"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 bg-[#8B0000] hover:bg-[#700000] text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              ← Quay lại Cổng thông tin Tân sinh viên
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1E45] p-3 sm:p-6 lg:p-8 text-gray-900 -m-4 sm:-m-6 lg:-m-8 font-sans">
      <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* 1. THANH HEADER ĐIỀU HƯỚNG */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setMainTab('quanly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainTab === 'quanly'
                  ? 'bg-[#0E1E45] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Quản lý & Duyệt đơn
            </button>

            {/* CHỈ SUPER_ADMIN MỚI NHÌN THẤY 2 TAB NÀY */}
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setMainTab('caidat')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    mainTab === 'caidat'
                      ? 'bg-[#0E1E45] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>⚙️</span> Cài đặt & Cấu hình
                </button>
                <button
                  onClick={() => setMainTab('phanquyen')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    mainTab === 'phanquyen'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span>🛡️</span> Phân Quyền ({adminUsersList.length})
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
            {isSuperAdmin && (
              <button
                onClick={togglePortalStatus}
                disabled={actionLoading}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  systemConfigs.TRANG_THAI_CONG === 'OPEN' ||
                  systemConfigs.TRANG_THAI_CONG === 'AUTO'
                    ? 'bg-[#0E1E45] hover:bg-blue-900'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    systemConfigs.TRANG_THAI_CONG !== 'CLOSED'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-white'
                  }`}
                ></span>
                <span>
                  Cổng:{' '}
                  {systemConfigs.TRANG_THAI_CONG === 'AUTO'
                    ? 'TỰ ĐỘNG'
                    : systemConfigs.TRANG_THAI_CONG === 'OPEN'
                    ? 'ĐANG MỞ'
                    : 'ĐÃ ĐÓNG'}
                </span>
              </button>
            )}

            {isSuperAdmin && (
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
                <span>📥 Nạp Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>📊 Xuất Excel Tùy Chọn</span>
            </button>

            <Link
              href="/"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              🏠 Về trang chủ
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs text-red-500 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Đăng xuất</span>
              <span className="text-sm">✕</span>
            </button>
          </div>
        </div>

        {/* 2. NỘI DUNG CÁC TAB */}
        {mainTab === 'quanly' ? (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0E1E45] text-white p-4 sm:p-5 rounded-2xl shadow relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                    Quỹ chỗ KTX: {occupancyPercent}%
                  </div>
                  <div className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
                    {totalOccupied} / {totalCapacity} chỗ
                  </div>
                </div>
                <div className="w-full bg-blue-900/60 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(Number(occupancyPercent), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#091430] text-white p-4 sm:p-5 rounded-2xl shadow flex flex-col justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-blue-300 font-bold">
                    SV thực tế đăng ký KTX
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 tracking-tight">
                    {dormRegs.length} sinh viên
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 mt-2">
                  Đã ghi nhận trên hệ thống cơ sở dữ liệu Supabase
                </div>
              </div>

              <div className="bg-[#050C1F] text-white p-4 sm:p-5 rounded-2xl shadow flex flex-col justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-purple-300 font-bold">
                    Diện ưu tiên (Bậc 1 + 2)
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tracking-tight">
                    {totalPriorityCount} suất
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 mt-2">
                  Chính sách xã hội & Điểm xét tuyển cao
                </div>
              </div>
            </div>

            {/* BỘ LỌC */}
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-gray-600 flex items-center gap-1 pl-1">
                <span>📍</span> Lọc:
              </span>

              <input
                type="text"
                placeholder="Tìm Tên, CCCD, MSSV, Mã HS..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs focus:ring-2 focus:ring-[#0E1E45] focus:outline-none w-48 sm:w-56"
              />

              <select
                value={filterNganh}
                onChange={(e) => {
                  setFilterNganh(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0E1E45]"
              >
                <option value="ALL">-- Tất cả ngành --</option>
                {distinctNganh.map((ng) => (
                  <option key={ng} value={ng}>
                    {ng}
                  </option>
                ))}
              </select>

              <select
                value={filterKhuKtx}
                onChange={(e) => {
                  setFilterKhuKtx(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0E1E45]"
              >
                <option value="ALL">-- Tất cả cơ sở KTX --</option>
                {distinctKhuKtx.map((khu) => (
                  <option key={khu} value={khu}>
                    {khu}
                  </option>
                ))}
              </select>

              <select
                value={filterBacUuTien}
                onChange={(e) => {
                  setFilterBacUuTien(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0E1E45]"
              >
                <option value="ALL">-- Tất cả bậc ưu tiên --</option>
                <option value="Bậc 1">Bậc 1: Chính sách xã hội</option>
                <option value="Bậc 2">Bậc 2: Điểm cao / Tuyển thẳng</option>
                <option value="Bậc 3">Bậc 3: Tỉnh xa (≥ 300km)</option>
                <option value="Bậc 4">Bậc 4: Tự túc kinh phí</option>
              </select>

              <select
                value={filterTrangThai}
                onChange={(e) => {
                  setFilterTrangThai(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0E1E45]"
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="TU_CHOI">Từ chối</option>
              </select>

              <div className="ml-auto text-xs text-gray-500 font-bold pr-1">
                Kết quả:{' '}
                <span className="text-[#0E1E45]">{filteredRegs.length}</span> /{' '}
                {dormRegs.length}
              </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-gray-400 font-medium animate-pulse">
                  Đang đồng bộ dữ liệu xét duyệt từ máy chủ Supabase...
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-4">MÃ HS</th>
                      <th className="p-3.5">HỌ TÊN / MSSV</th>
                      <th className="p-3.5">NGÀNH</th>
                      <th className="p-3.5">ĐIỂM</th>
                      <th className="p-3.5">ƯU TIÊN</th>
                      <th className="p-3.5">KHU KTX</th>
                      <th className="p-3.5 text-center">TRẠNG THÁI</th>
                      <th className="p-3.5 text-center pr-4">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {paginatedRegs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-12 text-center text-gray-400"
                        >
                          Không tìm thấy hồ sơ đăng ký KTX nào theo tiêu chí
                          lọc.
                        </td>
                      </tr>
                    ) : (
                      paginatedRegs.map((r) => (
                        <tr
                          key={r.ma_ho_so}
                          className="hover:bg-blue-50/40 transition items-center"
                        >
                          <td className="p-3.5 pl-4 font-mono font-bold text-red-600 whitespace-nowrap">
                            {r.ma_ho_so}
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-gray-900 uppercase">
                              {r.ho_ten}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              MSSV: {r.ma_sv} • CCCD: {r.cccd}
                            </div>
                          </td>

                          <td className="p-3.5 text-gray-800">{r.nganh_hoc}</td>

                          <td className="p-3.5 font-bold text-gray-900">
                            {r.diem_xet_tuyen}
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <div className="text-xs text-gray-800 font-semibold">
                              {r.bac_uu_tien}
                            </div>
                            {r.minh_chung_url && (
                              <a
                                href={r.minh_chung_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:underline mt-0.5 inline-block font-bold"
                              >
                                📄 Xem minh chứng
                              </a>
                            )}
                          </td>

                          <td className="p-3.5 text-xs text-gray-700 font-semibold">
                            {r.khu_ktx_dang_ky}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                r.trang_thai_duyet === 'DA_DUYET'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.trang_thai_duyet === 'TU_CHOI'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {r.trang_thai_duyet === 'DA_DUYET'
                                ? 'Đã duyệt'
                                : r.trang_thai_duyet === 'TU_CHOI'
                                ? 'Từ chối'
                                : 'Chờ duyệt'}
                            </span>
                            {r.ly_do_tu_choi && (
                              <div
                                className="text-[10px] text-red-500 italic mt-0.5 max-w-[140px] truncate"
                                title={r.ly_do_tu_choi}
                              >
                                {r.ly_do_tu_choi}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 pr-4 text-center whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              {r.trang_thai_duyet === 'CHO_DUYET' ? (
                                <>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleUpdateStatus(r.ma_ho_so, 'DA_DUYET')
                                    }
                                    className="w-16 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleUpdateStatus(r.ma_ho_so, 'TU_CHOI')
                                    }
                                    className="w-16 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : r.trang_thai_duyet === 'DA_DUYET' ? (
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateStatus(r.ma_ho_so, 'TU_CHOI')
                                  }
                                  className="w-16 py-1 bg-gray-200 hover:bg-red-600 hover:text-white text-gray-700 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  Hủy duyệt
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateStatus(r.ma_ho_so, 'DA_DUYET')
                                  }
                                  className="w-16 py-1 bg-gray-200 hover:bg-emerald-600 hover:text-white text-gray-700 rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  Duyệt lại
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* PHÂN TRANG */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-gray-600">
              <div>
                Hiển thị{' '}
                {filteredRegs.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}{' '}
                - {Math.min(currentPage * itemsPerPage, filteredRegs.length)}{' '}
                trong số <strong>{filteredRegs.length}</strong> sinh viên
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-100 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  &lt; Trước
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }).map(
                  (_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#0E1E45] text-white shadow-sm'
                            : 'border hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                {totalPages > 5 && (
                  <span className="px-1 text-gray-400">...</span>
                )}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-100 disabled:opacity-40 font-semibold cursor-pointer"
                >
                  Sau &gt;
                </button>
              </div>
            </div>
          </div>
        ) : isSuperAdmin && mainTab === 'caidat' ? (
          /* TAB 2: CÀI ĐẶT & CẤU HÌNH CMS (CHỈ SUPER_ADMIN) */
          <div className="p-4 sm:p-8 space-y-8 bg-gray-50/50">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>🎓</span> Quản lý Danh mục Ngành Trúng Tuyển (
                  {nganhHocList.length})
                </h3>
                <button
                  onClick={() => {
                    setFormGeneric({
                      ten: '',
                      thu_tu: nganhHocList.length + 1,
                    });
                    setEditItem(null);
                    setModalType('NGANH');
                  }}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Ngành Học Mới
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3 w-16 text-center">STT</th>
                      <th className="p-3">Tên Ngành Học / Chuyên Ngành</th>
                      <th className="p-3 text-right w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nganhHocList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3 text-center font-mono font-bold text-gray-500">
                          {item.thu_tu || idx + 1}
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          {item.ten_nganh}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setFormGeneric({
                                ten: item.ten_nganh,
                                thu_tu: item.thu_tu || idx + 1,
                              });
                              setEditItem(item);
                              setModalType('NGANH');
                            }}
                            className="px-2 py-1 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            📝 Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteGenericOption(
                                'danh_muc_nganh_hoc',
                                item.id
                              )
                            }
                            className="px-2 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>📅</span> Quản lý Tùy Chọn Hạn Thẻ BHYT (
                  {hanBhytList.length})
                </h3>
                <button
                  onClick={() => {
                    setFormGeneric({ ten: '', thu_tu: hanBhytList.length + 1 });
                    setEditItem(null);
                    setModalType('HAN_BHYT');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Tùy Chọn Hạn Thẻ
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3 w-16 text-center">STT</th>
                      <th className="p-3">Mô Tả Hạn Dùng Thẻ BHYT</th>
                      <th className="p-3 text-right w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hanBhytList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3 text-center font-mono font-bold text-gray-500">
                          {item.thu_tu || idx + 1}
                        </td>
                        <td className="p-3 font-semibold text-gray-900">
                          {item.ten_han}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setFormGeneric({
                                ten: item.ten_han,
                                thu_tu: item.thu_tu || idx + 1,
                              });
                              setEditItem(item);
                              setModalType('HAN_BHYT');
                            }}
                            className="px-2 py-1 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            📝 Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteGenericOption(
                                'danh_muc_han_bhyt',
                                item.id
                              )
                            }
                            className="px-2 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>🏥</span> Quản lý Tùy Chọn Đối Tượng Tham Gia BHYT (
                  {doiTuongBhytList.length})
                </h3>
                <button
                  onClick={() => {
                    setFormGeneric({
                      ten: '',
                      thu_tu: doiTuongBhytList.length + 1,
                    });
                    setEditItem(null);
                    setModalType('DT_BHYT');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Đối Tượng BHYT
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3 w-16 text-center">STT</th>
                      <th className="p-3">Tên Đối Tượng Kê Khai BHYT</th>
                      <th className="p-3 text-right w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doiTuongBhytList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3 text-center font-mono font-bold text-gray-500">
                          {item.thu_tu || idx + 1}
                        </td>
                        <td className="p-3 font-semibold text-gray-900">
                          {item.ten_doi_tuong}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setFormGeneric({
                                ten: item.ten_doi_tuong,
                                thu_tu: item.thu_tu || idx + 1,
                              });
                              setEditItem(item);
                              setModalType('DT_BHYT');
                            }}
                            className="px-2 py-1 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            📝 Sửa
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteGenericOption(
                                'danh_muc_doi_tuong_bhyt',
                                item.id
                              )
                            }
                            className="px-2 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>📅</span> Quản lý Lịch Nhập Học Theo Ngày
                </h3>
                <button
                  onClick={() => {
                    setFormLich({ tieu_de_ngay: '', danh_sach_nganh: '' });
                    setEditItem(null);
                    setModalType('LICH');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Ngày Nhập Học Mới
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3.5 w-40">Tiêu Đề / Ngày</th>
                      <th className="p-3.5">
                        Danh Sách Ngành Học Lịch Nhập Học
                      </th>
                      <th className="p-3.5 text-right w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lichNhapHocList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3.5 font-bold text-amber-700">
                          {item.tieu_de_ngay}
                        </td>
                        <td className="p-3.5 text-gray-700">
                          {item.danh_sach_nganh}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setFormLich({
                                tieu_de_ngay: item.tieu_de_ngay,
                                danh_sach_nganh: item.danh_sach_nganh,
                              });
                              setEditItem(item);
                              setModalType('LICH');
                            }}
                            className="px-2.5 py-1 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            📝 Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteLich(item.id)}
                            className="px-2.5 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>🏢</span> Quản lý Tòa nhà & Cơ sở Ký túc xá
                </h3>
                <button
                  onClick={() => {
                    setFormCoSo({
                      ten_toa_nha: '',
                      loai_phong: '',
                      tong_so_giuong: 150,
                    });
                    setModalType('COSO');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Cơ Sở
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3.5">Tên Cơ Sở KTX</th>
                      <th className="p-3.5">Định Mức Giá</th>
                      <th className="p-3.5">Tổng Số Chỗ</th>
                      <th className="p-3.5 text-right w-24">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coSoKtxList.map((item) => (
                      <tr key={item.id_toa_nha} className="hover:bg-gray-50/80">
                        <td className="p-3.5 font-bold text-gray-900">
                          {item.ten_toa_nha}
                        </td>
                        <td className="p-3.5 font-bold text-amber-700">
                          {item.loai_phong}
                        </td>
                        <td className="p-3.5 font-bold text-blue-900">
                          {item.tong_so_giuong} chỗ
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteCoSo(item.id_toa_nha)}
                            className="px-2.5 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>💎</span> Quản lý Bậc Ưu Tiên Xét Duyệt
                </h3>
                <button
                  onClick={() => {
                    setFormBac({ ten_bac: '', mo_ta_tieu_chi: '' });
                    setModalType('BAC');
                  }}
                  className="bg-[#0E1E45] hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  + Thêm Bậc Mới
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold">
                    <tr>
                      <th className="p-3.5 w-64">Tên Bậc Ưu Tiên</th>
                      <th className="p-3.5">Mô Tả Tiêu Chí Xét Duyệt</th>
                      <th className="p-3.5 text-right w-24">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bacUuTienList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        <td className="p-3.5 font-bold text-blue-900">
                          {item.ten_bac}
                        </td>
                        <td className="p-3.5 text-gray-700">
                          {item.mo_ta_tieu_chi}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteBac(item.id)}
                            className="px-2.5 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>⚙️</span> Cấu hình Năm Học, Trạng Thái Cổng & Hotline
              </h3>

              <form
                onSubmit={handleSaveSystemConfigs}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Năm học tuyển sinh (NAM_HOC):
                    </label>
                    <input
                      type="text"
                      value={systemConfigs.NAM_HOC}
                      onChange={(e) =>
                        setSystemConfigs({
                          ...systemConfigs,
                          NAM_HOC: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Trạng thái Cổng (TRANG_THAI_CONG):
                    </label>
                    <select
                      value={systemConfigs.TRANG_THAI_CONG}
                      onChange={(e) =>
                        setSystemConfigs({
                          ...systemConfigs,
                          TRANG_THAI_CONG: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                    >
                      <option value="AUTO">
                        AUTO (Tự động theo đếm ngược)
                      </option>
                      <option value="OPEN">OPEN (Luôn mở cổng)</option>
                      <option value="CLOSED">CLOSED (Khóa cổng)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Thời hạn đếm ngược (DEADLINE_DANG_KY):
                    </label>
                    <input
                      type="text"
                      value={systemConfigs.DEADLINE_DANG_KY}
                      onChange={(e) =>
                        setSystemConfigs({
                          ...systemConfigs,
                          DEADLINE_DANG_KY: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl font-mono focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Lịch tiếp sinh tổng quan (NGAY_TIEP_SINH):
                    </label>
                    <input
                      type="text"
                      value={systemConfigs.NGAY_TIEP_SINH}
                      onChange={(e) =>
                        setSystemConfigs({
                          ...systemConfigs,
                          NGAY_TIEP_SINH: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">
                      Hotline tư vấn KTX (HOTLINE_KTX):
                    </label>
                    <input
                      type="text"
                      value={systemConfigs.HOTLINE_KTX}
                      onChange={(e) =>
                        setSystemConfigs({
                          ...systemConfigs,
                          HOTLINE_KTX: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl font-semibold focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-[#0E1E45] hover:bg-blue-900 text-white font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💾</span>{' '}
                    {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi hệ thống'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : isSuperAdmin && mainTab === 'phanquyen' ? (
          /* TAB 3: PHÂN QUYỀN (CHỈ SUPER_ADMIN) */
          <div className="p-4 sm:p-8 space-y-6 bg-gray-50/50">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <span>🛡️</span> Danh Sách Quản Trị Viên & Phân Quyền Hệ
                    Thống
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thêm, sửa đổi vai trò và khóa/mở tài khoản cán bộ được cấp
                    quyền truy cập.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFormAdminUser({
                      ho_ten: '',
                      email: '',
                      password: 'Apag@2026',
                      role_khoa: 'QUAN_LY_KTX',
                    });
                    setModalType('ADMIN_USER');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>+</span> Thêm Quản Trị Viên Mới
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-4">Họ và Tên Cán Bộ</th>
                      <th className="p-3.5">Email Đăng Nhập</th>
                      <th className="p-3.5">Phân Quyền (Role)</th>
                      <th className="p-3.5 text-center">Trạng Thái</th>
                      <th className="p-3.5 text-right pr-4">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {adminUsersList.map((user) => (
                      <tr
                        key={user.admin_id}
                        className="hover:bg-blue-50/40 transition"
                      >
                        <td className="p-3.5 pl-4 font-bold text-gray-900">
                          {user.ho_ten}
                          {user.email === currentAdmin?.email && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                              Bạn đang đăng nhập
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-gray-700">
                          {user.email}
                        </td>

                        <td className="p-3.5">
                          <select
                            value={user.role_khoa || 'QUAN_LY_KTX'}
                            onChange={(e) =>
                              handleUpdateAdminRole(
                                user.admin_id,
                                e.target.value
                              )
                            }
                            className="px-2.5 py-1 border rounded-lg text-xs font-bold bg-white text-gray-800 focus:ring-2 focus:ring-[#0E1E45] cursor-pointer"
                          >
                            <option value="SUPER_ADMIN">
                              SUPER_ADMIN (Toàn quyền)
                            </option>
                            <option value="QUAN_LY_KTX">
                              QUAN_LY_KTX (Duyệt đơn KTX)
                            </option>
                            <option value="KE_TOAN_BHYT">
                              KE_TOAN_BHYT (Kế toán BHYT)
                            </option>
                            <option value="PHONG_QUAN_TRI">
                              PHONG_QUAN_TRI (Quản trị)
                            </option>
                          </select>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() =>
                              handleToggleAdminStatus(
                                user.admin_id,
                                user.is_active
                              )
                            }
                            className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {user.is_active
                              ? '✓ Đang hoạt động'
                              : '🔒 Đã tạm khóa'}
                          </button>
                        </td>

                        <td className="p-3.5 pr-4 text-right">
                          <button
                            onClick={() =>
                              handleDeleteAdminUser(user.admin_id, user.email)
                            }
                            className="px-2.5 py-1 border border-red-600 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold cursor-pointer"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* MODAL 1: CHỌN TRƯỜNG DỮ LIỆU XUẤT EXCEL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 max-w-2xl w-full p-6 sm:p-8 rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-[#0E1E45] flex items-center gap-2">
                <span>📊</span> Tùy Chọn Trường Dữ Liệu Xuất Excel
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Tích chọn những thông tin bạn muốn hiển thị trong file Excel (
                {filteredRegs.length} dòng dữ liệu theo bộ lọc).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() =>
                  setSelectedExportKeys(EXPORT_COLUMNS_CONFIG.map((c) => c.key))
                }
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
              >
                ✓ Chọn tất cả ({EXPORT_COLUMNS_CONFIG.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedExportKeys([])}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                ✕ Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedExportKeys(
                    EXPORT_COLUMNS_CONFIG.filter((c) => c.default).map(
                      (c) => c.key
                    )
                  )
                }
                className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition cursor-pointer"
              >
                ⭐ Mặc định cơ bản
              </button>
              <span className="ml-auto text-gray-500 text-xs font-bold">
                Đã chọn:{' '}
                <strong className="text-[#0E1E45]">
                  {selectedExportKeys.length}
                </strong>{' '}
                / {EXPORT_COLUMNS_CONFIG.length} cột
              </span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs flex-1">
              {Object.entries(groupedExportColumns).map(([groupName, cols]) => (
                <div
                  key={groupName}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span>📁</span> {groupName} ({cols.length} trường)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cols.map((col) => {
                      const isChecked = selectedExportKeys.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition cursor-pointer ${
                            isChecked
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExportKeys((prev) => [
                                  ...prev,
                                  col.key,
                                ]);
                              } else {
                                setSelectedExportKeys((prev) =>
                                  prev.filter((k) => k !== col.key)
                                );
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteExportExcel}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📥</span> Tải File Excel Xuất Ra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN CHẾ ĐỘ NẠP EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 max-w-lg w-full p-6 sm:p-7 rounded-2xl shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setShowImportModal(false);
                setSelectedImportFile(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-3xl">📥</span>
              <h3 className="text-base font-bold text-[#0E1E45]">
                Chọn Chế Độ Nạp Danh Sách Trúng Tuyển
              </h3>
              <p className="text-xs text-gray-500">
                Tệp phát hiện:{' '}
                <strong className="text-gray-900 font-mono">
                  {selectedImportFile?.name}
                </strong>
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => processExcelImport(true)}
                className="w-full p-4 rounded-xl border-2 border-red-300 bg-red-50/60 hover:bg-red-100 transition text-left space-y-1 cursor-pointer group"
              >
                <div className="font-bold text-red-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🚨</span> Chế độ 1: Làm sạch dữ liệu năm cũ & Nạp Năm
                  Học Mới
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Xóa toàn bộ sinh viên, đơn KTX, BHYT cũ để bắt đầu năm tuyển
                  sinh mới.
                </p>
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => processExcelImport(false)}
                className="w-full p-4 rounded-xl border-2 border-blue-300 bg-blue-50/60 hover:bg-blue-100 transition text-left space-y-1 cursor-pointer group"
              >
                <div className="font-bold text-blue-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>➕</span> Chế độ 2: Nạp bổ sung / Cập nhật sinh viên mới
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Giữ nguyên dữ liệu hiện tại, chỉ cập nhật hoặc thêm các thí
                  sinh trúng tuyển đợt bổ sung.
                </p>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedImportFile(null);
                }}
                className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRUD CMS */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-gray-900 max-w-lg w-full p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setModalType(null);
                setEditItem(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            {(modalType === 'NGANH' ||
              modalType === 'HAN_BHYT' ||
              modalType === 'DT_BHYT') && (
              <form onSubmit={handleSaveGenericOption} className="space-y-4">
                <h3 className="font-bold text-base text-[#0E1E45]">
                  {editItem ? 'Chỉnh Sửa Tùy Chọn' : 'Thêm Tùy Chọn Mới'}
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {modalType === 'NGANH'
                      ? 'Tên Ngành Học (*):'
                      : modalType === 'HAN_BHYT'
                      ? 'Tên Hạn Dùng Thẻ BHYT (*):'
                      : 'Tên Đối Tượng Kê Khai BHYT (*):'}
                  </label>
                  <input
                    type="text"
                    value={formGeneric.ten}
                    onChange={(e) =>
                      setFormGeneric({ ...formGeneric, ten: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0E1E45] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Thứ tự ưu tiên hiển thị:
                  </label>
                  <input
                    type="number"
                    value={formGeneric.thu_tu}
                    onChange={(e) =>
                      setFormGeneric({
                        ...formGeneric,
                        thu_tu: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#0E1E45] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-900"
                >
                  {editItem ? 'Cập Nhật Tùy Chọn' : 'Lưu Tùy Chọn'}
                </button>
              </form>
            )}

            {modalType === 'LICH' && (
              <form onSubmit={handleSaveLich} className="space-y-4">
                <h3 className="font-bold text-base text-[#0E1E45]">
                  {editItem
                    ? 'Chỉnh Sửa Ngày Nhập Học'
                    : 'Thêm Ngày Nhập Học Mới'}
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tiêu đề ngày (*):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Ngày 25/8/2027"
                    value={formLich.tieu_de_ngay}
                    onChange={(e) =>
                      setFormLich({ ...formLich, tieu_de_ngay: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Danh sách ngành học (*):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Ngành: Quản lý nhà nước, Quản trị văn phòng..."
                    value={formLich.danh_sach_nganh}
                    onChange={(e) =>
                      setFormLich({
                        ...formLich,
                        danh_sach_nganh: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#0E1E45] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu Ngày Nhập Học
                </button>
              </form>
            )}

            {modalType === 'COSO' && (
              <form onSubmit={handleSaveCoSo} className="space-y-4">
                <h3 className="font-bold text-base text-[#0E1E45]">
                  Thêm Cơ Sở Ký Túc Xá
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên cơ sở KTX (*):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: KTX 3 tầng (Số 10 đường 3/2)"
                    value={formCoSo.ten_toa_nha}
                    onChange={(e) =>
                      setFormCoSo({ ...formCoSo, ten_toa_nha: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Định mức giá (*):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 900.000đ / SV / tháng"
                    value={formCoSo.loai_phong}
                    onChange={(e) =>
                      setFormCoSo({ ...formCoSo, loai_phong: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tổng số chỗ (*):
                  </label>
                  <input
                    type="number"
                    value={formCoSo.tong_so_giuong}
                    onChange={(e) =>
                      setFormCoSo({
                        ...formCoSo,
                        tong_so_giuong: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu Cơ Sở KTX
                </button>
              </form>
            )}

            {modalType === 'BAC' && (
              <form onSubmit={handleSaveBac} className="space-y-4">
                <h3 className="font-bold text-base text-[#0E1E45]">
                  Thêm Bậc Ưu Tiên Xét Duyệt
                </h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên bậc ưu tiên (*):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Bậc 1: Chính sách xã hội"
                    value={formBac.ten_bac}
                    onChange={(e) =>
                      setFormBac({ ...formBac, ten_bac: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mô tả tiêu chí xét duyệt (*):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Khuyết tật; con Liệt sĩ, thương binh..."
                    value={formBac.mo_ta_tieu_chi}
                    onChange={(e) =>
                      setFormBac({ ...formBac, mo_ta_tieu_chi: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#0E1E45] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu Bậc Ưu Tiên
                </button>
              </form>
            )}

            {modalType === 'ADMIN_USER' && (
              <form onSubmit={handleSaveAdminUser} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="font-bold text-base text-[#0E1E45]">
                    Thêm Quản Trị Viên Mới
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Họ và Tên (*):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: ThS. Nguyễn Văn A"
                    value={formAdminUser.ho_ten}
                    onChange={(e) =>
                      setFormAdminUser({
                        ...formAdminUser,
                        ho_ten: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email đăng nhập (*):
                  </label>
                  <input
                    type="email"
                    placeholder="VD: canbo1@apag.edu.vn"
                    value={formAdminUser.email}
                    onChange={(e) =>
                      setFormAdminUser({
                        ...formAdminUser,
                        email: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mật khẩu khởi tạo (*):
                  </label>
                  <input
                    type="text"
                    placeholder="Apag@2026"
                    value={formAdminUser.password}
                    onChange={(e) =>
                      setFormAdminUser({
                        ...formAdminUser,
                        password: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phân quyền vai trò (*):
                  </label>
                  <select
                    value={formAdminUser.role_khoa}
                    onChange={(e) =>
                      setFormAdminUser({
                        ...formAdminUser,
                        role_khoa: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  >
                    <option value="SUPER_ADMIN">
                      SUPER_ADMIN (Toàn quyền Quản trị & Phân quyền)
                    </option>
                    <option value="QUAN_LY_KTX">
                      QUAN_LY_KTX (Cán bộ Xét duyệt KTX)
                    </option>
                    <option value="KE_TOAN_BHYT">
                      KE_TOAN_BHYT (Kế toán Xét duyệt BHYT)
                    </option>
                    <option value="PHONG_QUAN_TRI">
                      PHONG_QUAN_TRI (Quản trị hạ tầng)
                    </option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow transition disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Đang lưu...' : 'Thêm Quản Trị Viên'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
