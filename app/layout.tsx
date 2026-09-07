import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LocaleCheck · 本地化审校', description: '面向出海开发者的中英文本地化审校工作台。' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
