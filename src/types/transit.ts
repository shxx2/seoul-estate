export interface TransitStation {
  type: 'subway' | 'bus' | 'mart' | 'daycare';
  name: string;
  lat: number;
  lng: number;
  distance: number; // meters
}

export interface TransitRoute {
  path: { lat: number; lng: number }[];
  distance: number; // meters
  duration: number; // seconds
}

export interface TransitRouteResult {
  station: TransitStation;
  route: TransitRoute;
}

/** Alias for TransitRoute (used by tmap/pedestrian) */
export type WalkingRoute = TransitRoute;
