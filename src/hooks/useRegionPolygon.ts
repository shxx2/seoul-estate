import { useState, useEffect } from 'react';
import { resolveRegionPolygon } from './region-polygon';

export function useRegionPolygon(cortarNo: string | null) {
  const [polygon, setPolygon] = useState<{ lat: number; lng: number }[][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!cortarNo) {
      setPolygon(null);
      return;
    }

    setIsLoading(true);
    resolveRegionPolygon(cortarNo)
      .then((data) => {
        setPolygon(data);
      })
      .finally(() => setIsLoading(false));
  }, [cortarNo]);

  return { polygon, isLoading };
}
