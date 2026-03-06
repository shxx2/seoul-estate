"use client";

import { Polygon, useNavermaps } from "react-naver-maps";

interface RegionPolygonProps {
  paths: { lat: number; lng: number }[][];
}

export default function RegionPolygon({ paths }: RegionPolygonProps) {
  const navermaps = useNavermaps();

  if (!paths || paths.length === 0) return null;

  const naverPaths = paths.map((ring) =>
    ring.map((coord) => new navermaps.LatLng(coord.lat, coord.lng))
  );

  return (
    <Polygon
      paths={naverPaths}
      fillColor="#3B82F6"
      fillOpacity={0.1}
      strokeColor="#3B82F6"
      strokeWeight={2}
      strokeOpacity={0.8}
    />
  );
}
