'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  namHoc?: string;
  isLoggedIn?: boolean;
  studentName?: string;
  studentCccd?: string;
  onLogout?: () => void;
  onPrint?: () => void;
}

export default function Header({
  namHoc = '2027',
  isLoggedIn = false,
  studentName = '',
  studentCccd = '',
  onLogout,
  onPrint,
}: HeaderProps) {
  const logoUrl = 'https://lh3.googleusercontent.com/d/1EhYcDVJc8jezBSiGS1jJ6XM0EXxjvFKJ';

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-8 shadow-sm web-ui-only sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* LOGO & TIÊU ĐỀ CHÍNH */}
        <div className="flex items-center gap-3.5">
          <img
            src={logoUrl}
            alt="Logo APAG"
            className="h-12 w-auto object-contain shrink-0"
          />
          <div className="border-l border-gray-300 pl-3.5">
            <h1 className="text-xs sm:text-sm font-black text-[#0E1E45] uppercase tracking-tight leading-tight">
              HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG
            </h1>
            <h2 className="text-[11px] sm:text-xs font-bold text-[#8B0000] uppercase tracking-tight leading-tight mt-0.5">
              PHÂN HIỆU TẠI THÀNH PHỐ HỒ CHÍ MINH
            </h2>
            <div className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 uppercase tracking-wider mt-0.5">
              CỔNG THÔNG TIN TÂN SINH VIÊN ĐẠI HỌC CHÍNH QUY NĂM {namHoc}
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC / THÔNG TIN SINH VIÊN */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-900 uppercase">{studentName}</div>
                <div className="text-[10px] text-gray-500 font-mono">CCCD: {studentCccd}</div>
              </div>

              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-gray-300"
                >
                  <span>🖨️</span> In Đơn A4
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/tra-cuu"
                className="px-3.5 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>🔍</span> Tra cứu & In đơn
              </Link>
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