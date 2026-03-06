"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NavermapsProvider } from "react-naver-maps";

interface Props {
  children: React.ReactNode;
}

// 네이버맵 Client ID 컨텍스트 (null이면 사용 불가)
const NaverMapClientIdContext = createContext<string | null>(null);
export const useNaverMapClientId = () => useContext(NaverMapClientIdContext);

export function NaverMapProvider({ children }: Props) {
  const [isClient, setIsClient] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NCP_CLIENT_ID || null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR 또는 clientId 없음: Provider 없이 children만 렌더링
  if (!isClient || !clientId) {
    if (isClient && !clientId) {
      console.error("NEXT_PUBLIC_NCP_CLIENT_ID is not set");
    }
    return (
      <NaverMapClientIdContext.Provider value={null}>
        {children}
      </NaverMapClientIdContext.Provider>
    );
  }

  return (
    <NaverMapClientIdContext.Provider value={clientId}>
      <NavermapsProvider ncpKeyId={clientId}>
        {children}
      </NavermapsProvider>
    </NaverMapClientIdContext.Provider>
  );
}
