import type { Metadata } from "next";
import "./globals.css";
import { NaverMapProvider } from "@/components/map/NaverMapProvider";

export const metadata: Metadata = {
  title: "심바네 똘똘한 한채 - 서울 지역 매물 검색",
  description: "서울 지역 아파트, 빌라, 오피스텔 매물을 지도에서 쉽게 검색하세요.",
  keywords: ["서울", "부동산", "매물", "아파트", "빌라", "오피스텔", "전세", "월세", "매매"],
  openGraph: {
    title: "심바네 똘똘한 한채 - 서울 지역 매물 검색",
    description: "서울 지역 아파트, 빌라, 오피스텔 매물을 지도에서 쉽게 검색하세요.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 text-gray-900">
        <NaverMapProvider>
          {children}
        </NaverMapProvider>
      </body>
    </html>
  );
}
