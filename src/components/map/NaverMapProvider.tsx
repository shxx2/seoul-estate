"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NavermapsProvider } from "react-naver-maps";

interface Props {
  children: React.ReactNode;
}

// 네이버맵 준비 상태 컨텍스트
const NaverMapReadyContext = createContext(false);
export const useNaverMapReady = () => useContext(NaverMapReadyContext);

export function NaverMapProvider({ children }: Props) {
  const [isClient, setIsClient] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NCP_CLIENT_ID;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR 시에는 children만 렌더링 (맵 미준비 상태)
  if (!isClient) {
    return (
      <NaverMapReadyContext.Provider value={false}>
        {children}
      </NaverMapReadyContext.Provider>
    );
  }

  if (!clientId) {
    console.error("NEXT_PUBLIC_NCP_CLIENT_ID is not set");
    return (
      <NaverMapReadyContext.Provider value={false}>
        {children}
      </NaverMapReadyContext.Provider>
    );
  }

  return (
    <NaverMapReadyContext.Provider value={true}>
      <NavermapsProvider ncpKeyId={clientId}>
        {children}
      </NavermapsProvider>
    </NaverMapReadyContext.Provider>
  );
}
