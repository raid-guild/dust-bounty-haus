import { divIcon } from 'leaflet';
import localPlayerMarkerBig from '/rglogo.png';
import { useEffect, useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { worldToMapCoordinates } from './config';

type LocalPlayerMarkerProps = {
  map: any | null;
  playerPosition: any;
};

export function LocalPlayerMarker({ map, playerPosition }: LocalPlayerMarkerProps) {
  const playerMapPos = worldToMapCoordinates([playerPosition.x, playerPosition.y, playerPosition.z]);
  // orientation hook may not be present in this workspace; default to 0
  const orientation = 0;
  const icon = useMemo(
    () =>
      divIcon({
        iconSize: [24, 24],
        iconAnchor: [24 / 2, 24 / 2],
        className: 'local-marker',
        html: `<div style="transform: rotate(${orientation}rad); background-image: url(${localPlayerMarkerBig})" class="local-marker-inner"></div>`,
      }),
    [orientation]
  );

  useEffect(() => {
    if (!map) return;
    try {
      map.setView(playerMapPos as any, 2);
    } catch (e) {
      // ignore
    }
  }, [map]);

  return <Marker position={playerMapPos as any} icon={icon} zIndexOffset={100000} />;
}
