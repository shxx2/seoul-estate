import { useState, useEffect } from 'react';
import { getPolygonByCortarNo } from '@/lib/geojson-loader';
import { getRegionPolygon as getFallbackPolygon } from '@/lib/region-lookup';

export function useRegionPolygon(cortarNo: string | null) {
  const [polygon, setPolygon] = useState<{ lat: number; lng: number }[][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cortarNo) {
      setPolygon(null);
      return;
    }

    setIsLoading(true);
    getPolygonByCortarNo(cortarNo)
      .then((data) => {
        if (data) {
          setPolygon(data);
        } else {
          // 폴백: 사각형 폴리곤
          const fallback = getFallbackPolygon(cortarNo);
          setPolygon(fallback ? [fallback] : null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [cortarNo]);

  return { polygon, isLoading };
}
