"use client";

import { useEffect, useState } from "react";
import { NavermapsProvider } from "react-naver-maps";

interface Props {
  children: React.ReactNode;
}

export function NaverMapProvider({ children }: Props) {
  const [isClient, setIsClient] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NCP_CLIENT_ID;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR 시에는 children만 렌더링
  if (!isClient) {
    return <>{children}</>;
  }

  if (!clientId) {
    console.error("NEXT_PUBLIC_NCP_CLIENT_ID is not set");
    return <>{children}</>;
  }

  return (
    <NavermapsProvider ncpKeyId={clientId}>
      {children}
    </NavermapsProvider>
  );
}
