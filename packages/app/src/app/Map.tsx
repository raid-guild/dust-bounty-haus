import L, { CRS, TileLayer as LeafletTileLayer } from "leaflet";
import { useEffect, useState, useRef } from "react";
import { createTileLayerComponent } from "@react-leaflet/core";
import { MapContainer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { usePlayerPositionQuery } from "../common/usePlayerPositionQuery";
import { bounds, maxZoom, minZoom, tileSize, worldToMapCoordinates } from "./config";
import { MapControls } from "./MapControls";
import { LocalPlayerMarker } from "./LocalPlayerMarker";
// Fix default marker icons for bundlers (Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x as unknown as string,
  iconUrl: markerIcon as unknown as string,
  shadowUrl: markerShadow as unknown as string,
});
;(globalThis as any).L = L;

// force map to re-render in dev
const now = Date.now();

type Waypoint = { label: string; coords: [number, number, number] };

export function Map({ waypoints, highlight, visible = true, onSetWaypoint, onFocus }: { waypoints?: Waypoint[]; highlight?: [number, number] | null; visible?: boolean; onSetWaypoint?: (label: string, coords: [number, number, number]) => void; onFocus?: (center: [number, number]) => void }) {
  // production: no debug logs
  const [map, setMap] = useState<any | null>(null);
  const didFitBoundsRef = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(2);
  const playerPosition = usePlayerPositionQuery();

  useEffect(() => {
    // Only act when the map exists and is visible. When the map is hidden (overlayed
    // by the list) we avoid running invalidateSize/setView. When visibility flips to
    // true we recalc layout and re-center on the player.
    if (!map || !visible) return;

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on("zoomend", handleZoom);
    setCurrentZoom(map.getZoom());

    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map]);

  // When the Leaflet map instance appears (or the player's position updates),
  // ensure the map size is recalculated and center on the player so toggling
  // back from the list view keeps the player centered.
  useEffect(() => {
    if (!map) return;
    try {
      console.log('Map effect: map available -> running invalidateSize');
      // Log current map size/center/zoom before invalidation
      try {
        const sizeBefore = map.getSize ? map.getSize() : null;
        const centerBefore = map.getCenter ? map.getCenter() : null;
        const zoomBefore = map.getZoom ? map.getZoom() : null;
        console.log('Map state before invalidateSize', { sizeBefore, centerBefore, zoomBefore });
      } catch (err) {
        console.log('Error reading map state before invalidateSize', err);
      }

      // Fix layout issues after being hidden
      map.invalidateSize();

      try {
        const sizeAfter = map.getSize ? map.getSize() : null;
        const centerAfter = map.getCenter ? map.getCenter() : null;
        const zoomAfter = map.getZoom ? map.getZoom() : null;
        console.log('Map state after invalidateSize', { sizeAfter, centerAfter, zoomAfter });
      } catch (err) {
        console.log('Error reading map state after invalidateSize', err);
      }
    } catch (e) {
      console.log('Map effect: invalidateSize failed', e);
    }

  if (playerPosition?.data) {
      try {
        const playerMapPos = worldToMapCoordinates([playerPosition.data.x, playerPosition.data.y, playerPosition.data.z]);
        // Keep current zoom if possible
        const z = (map.getZoom && typeof map.getZoom === 'function') ? map.getZoom() : 2;
        console.log('Map effect: will setView to playerMapPos', { playerMapPos, zoom: z });
  map.setView(playerMapPos as any, z);

        // Check center after a short delay to ensure view updated
        setTimeout(() => {
          try {
            const centerNow = map.getCenter ? map.getCenter() : null;
            const zoomNow = map.getZoom ? map.getZoom() : null;
            console.log('Map effect: after setView, center/zoom', { centerNow, zoomNow });
          } catch (err) {
            console.log('Error reading map state after setView', err);
          }
        }, 250);
      } catch (e) {
        console.log('Map effect: setView failed', e);
      }
    }
  }, [map, playerPosition?.data]);

  // Log whenever the map instance changes so we can see unexpected re-mounts
  useEffect(() => {
    console.log('Map instance changed', { mapReady: !!map });
    if (!map) return;
    try {
      const center = map.getCenter ? map.getCenter() : null;
      const zoom = map.getZoom ? map.getZoom() : null;
      console.log('Map instance info', { center, zoom });
    } catch (err) {
      console.log('Error reading map instance info', err);
    }
  }, [map]);

  // center/focus on highlight when it changes
  useEffect(() => {
    if (!map) return;
    if (highlight) {
      const x = highlight[0];
      const z = highlight[1];
      try {
        map.flyTo([z, x], 4, { duration: 0.6 });
      } catch (e) {
        // ignore
      }
    } else {
      // Only fit bounds once on initial mount. Subsequent remounts (e.g. toggling UI)
      // should not call fitBounds because that can override a programmatic setView
      // (for example centering on the player).
      if (!didFitBoundsRef.current) {
        try {
          map.fitBounds(bounds as any);
          didFitBoundsRef.current = true;
        } catch (e) {
          // ignore
        }
      }
    }
  }, [map, highlight]);

  // no-op: removed debug logging

  // Small yellow triangle waypoint icon using an inline SVG (divIcon)
  const waypointIcon = L.divIcon({
    html: `
      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,3 22,21 2,21" fill="#FFD54F" stroke="#B8860B" stroke-width="1" />
      </svg>
    `,
    className: 'waypoint-div-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <div className="map flex relative z-0 h-full">
      <MapContainer
        // force map to re-render in dev
        key={now}
        ref={setMap}
  crs={CRS.Simple}
        center={[0, 0]}
        style={{ width: "100%", height: "100%" }}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBoundsViscosity={0.5}
        bounds={bounds}
        maxBounds={bounds}
        zoom={2}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          getTileUrl={({ x, y, z }: { x: number; y: number; z: number }) =>
            `https://alpha.dustproject.org/api/assets/map/surface/${x}/${y}/${z}/tile`
          }
          tileSize={tileSize}
          // zoom range of tiles
          minNativeZoom={0}
          maxNativeZoom={maxZoom}
          // zoom range of map
          minZoom={minZoom}
          maxZoom={maxZoom}
        />
        {playerPosition.data ? (
          <LocalPlayerMarker map={map} playerPosition={playerPosition.data} />
        ) : null}
        {waypoints && waypoints.length > 0
          ? waypoints.map((wp) => {
              const pos = worldToMapCoordinates([wp.coords[0], wp.coords[1], wp.coords[2]]);
              return (
                <Marker key={wp.label} position={pos as any} icon={waypointIcon}>
                    <Popup>
                      <div style={{ color: '#111' }}>
                        <strong>{wp.label}</strong>
                        <div style={{ fontSize: 12, marginBottom: 6 }}>{wp.coords[0]}, {wp.coords[1]}, {wp.coords[2]}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="px-2 py-1 rounded text-xs font-bold" style={{ background: '#e11d48', color: '#f3f3f3', border: '1px solid #e11d48' }} onClick={() => onSetWaypoint ? onSetWaypoint(wp.label, wp.coords) : undefined}>
                            Set Waypoint
                          </button>
                          <button className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#f3f3f3', border: '1px solid rgba(255,255,255,0.04)' }} onClick={() => onFocus ? onFocus([wp.coords[0], wp.coords[2]]) : undefined}>
                            Focus
                          </button>
                        </div>
                      </div>
                    </Popup>
                </Marker>
              );
            })
          : null}
  {/* debug markers removed */}
        <ForceFieldOverlay />
        <MapControls
          map={map}
          currentZoom={currentZoom}
          playerPosition={playerPosition.data ?? null}
        />
      </MapContainer>
    </div>
  );
}

const TileLayer: any = createTileLayerComponent(
  ({ getTileUrl, ...props }: any, context: any) => {
    const layer = new LeafletTileLayer("", props as any);
    layer.getTileUrl = getTileUrl as any;
    return {
      instance: layer,
      context: { ...context, layerContainer: layer },
    } as never;
  },
  (layer: any, props: any) => {
    layer.getTileUrl = props.getTileUrl as any;
  }
);
//stub force field overlay
const ForceFieldOverlay = () => {
  return null;
};