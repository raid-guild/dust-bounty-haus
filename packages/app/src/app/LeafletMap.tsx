import { useMemo, useEffect } from 'react';
import L, { CRS } from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Import marker images so Vite resolves their URLs correctly
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix icon paths for bundlers (Vite) by using imported image URLs
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x as unknown as string,
  iconUrl: markerIcon as unknown as string,
  shadowUrl: markerShadow as unknown as string,
});

// Ensure react-leaflet uses the same Leaflet instance to avoid runtime errors
;(globalThis as any).L = L;

type Waypoint = { label: string; coords: [number, number, number] };

export default function LeafletMap({ waypoints, highlight }: { waypoints: Waypoint[]; highlight?: [number, number] | null }) {
  const bounds = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return [[0, 0], [1, 1]] as any;
    let minX = waypoints[0].coords[0];
    let maxX = waypoints[0].coords[0];
    let minZ = waypoints[0].coords[2];
    let maxZ = waypoints[0].coords[2];
    for (const p of waypoints) {
      const x = p.coords[0];
      const z = p.coords[2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const padX = Math.max(32, (maxX - minX) * 0.1);
    const padZ = Math.max(32, (maxZ - minZ) * 0.1);
    // Leaflet expects [southWest, northEast] as [lat,lng] pairs; we use [z,x]
    return [[minZ - padZ, minX - padX], [maxZ + padZ, maxX + padX]] as any;
  }, [waypoints]);

  const center = useMemo(() => {
    const b = bounds as any;
    const midLat = (b[0][0] + b[1][0]) / 2;
    const midLng = (b[0][1] + b[1][1]) / 2;
    return [midLat, midLng] as any;
  }, [bounds]);

  function CenterOnHighlight({ highlight, bounds }: { highlight?: [number, number] | null; bounds: any }) {
    const map = useMap();
    useEffect(() => {
      if (highlight) {
        const x = highlight[0];
        const z = highlight[1];
        try {
          map.flyTo([z, x], 4, { duration: 0.8 });
        } catch (e) {
          // ignore
        }
      } else {
        try {
          map.fitBounds(bounds as any);
        } catch (e) {
          // ignore
        }
      }
    }, [highlight, bounds, map]);
    return null;
  }

  const highlightIcon = new L.Icon({
    iconUrl: markerIcon2x as unknown as string,
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [0, -32],
    shadowUrl: markerShadow as unknown as string,
  });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        crs={CRS.Simple as any}
        bounds={bounds as any}
        center={center as any}
        zoom={2}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        zoomControl={false}
      >
  <CenterOnHighlight highlight={highlight} bounds={bounds} />
        <TileLayer
          // Using the Dust tile API
          url="https://alpha.dustproject.org/api/assets/map/surface/{x}/{y}/{z}/tile"
        />

        {waypoints.map((wp) => {
          const pos: [number, number] = [wp.coords[2], wp.coords[0]]; // [lat=z, lng=x]
          const isHighlight = Boolean(highlight && highlight[0] === wp.coords[0] && highlight[1] === wp.coords[2]);
          return (
            <Marker key={wp.label} position={pos as any} icon={isHighlight ? highlightIcon : undefined}>
              <Popup>
                <div style={{ color: '#111' }}>
                  <strong>{wp.label}</strong>
                  <div style={{ fontSize: 12 }}>{wp.coords[0]}, {wp.coords[1]}, {wp.coords[2]}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
