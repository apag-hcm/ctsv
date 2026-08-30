import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ctsv.vercel.app'),
  title: 'Cổng Đăng Ký Thông tin Tân Sinh viên - APAG.HCM',
  description: 'Hệ thống đăng ký xét duyệt thông tin tân sinh viên trực tuyến APAG.HCM',
  icons: {
    icon: 'https://lh3.googleusercontent.com/d/19K2gGXmuRqSmKQLJXV1F5FfpQMx_Grwb',
  },
  openGraph: {
    title: 'Cổng Đăng Ký Thông tin Tân Sinh viên - APAG.HCM',
    description: 'Hệ thống đăng ký xét duyệt thông tin tân sinh viên trực tuyến APAG.HCM',
    images: ['https://lh3.googleusercontent.com/d/19K2gGXmuRqSmKQLJXV1F5FfpQMx_Grwb'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
