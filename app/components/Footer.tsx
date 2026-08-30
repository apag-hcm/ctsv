'use client';

import React from 'react';

interface FooterProps {
  namHoc?: string;
  hotline?: string;
}

export default function Footer({
  namHoc = '2027',
  hotline = '0905.865.919',
}: FooterProps) {
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