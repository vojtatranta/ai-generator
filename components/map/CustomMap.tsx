import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import { Icons } from "../icons";
import { memo, useState } from "react";
import { useEffect } from "react";

export type Place = {
  id: string;
  latitude: string;
  longitude: string;
  movable?: boolean;
};

function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      // @ts-ignore
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        // @ts-ignore
        func.apply(this, args);
      }, remaining);
    }
  };
}

export const CustomMap = memo(function CustomMap({
  defaultLatLon,
  places,
  onPlaceDragEnd,
}: {
  defaultLatLon: { latitude: string; longitude: string };
  places: Place[];
  onPlaceDragEnd?: (
    place: Place,
    nextLocation: { latitude: string; longitude: string },
  ) => void;
}) {
  const [activePlaces, setActivePlaces] = useState<Place[]>([]);

  useEffect(() => {
    setActivePlaces(places);
  }, [places]);

  const updateLocation = (
    place: Place,
    nextLocation: { latitude: string; longitude: string },
  ) => {
    setActivePlaces(
      places.map((p) => (p.id === place.id ? { ...p, ...nextLocation } : p)),
    );
  };

  const throttledUpdateLocation = throttle(updateLocation, 200);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={{
          lat: Number(defaultLatLon.latitude),
          lng: Number(defaultLatLon.longitude),
        }}
        mapId="location-of-the-socket"
        defaultZoom={15}
      >
        {activePlaces.map((place) => (
          <AdvancedMarker
            key={place.id}
            position={{
              lat: Number(place.latitude),
              lng: Number(place.longitude),
            }}
            draggable
            clickable
            onDragEnd={(nextLocation) => {
              const latLong = nextLocation.latLng;
              if (!latLong) return;

              onPlaceDragEnd?.(place, {
                latitude: latLong.lat().toString(),
                longitude: latLong.lng().toString(),
              });
            }}
            onDrag={(nextLocation) => {
              const latLong = nextLocation.latLng;
              if (!latLong) return;

              throttledUpdateLocation(place, {
                latitude: latLong.lat().toString(),
                longitude: latLong.lng().toString(),
              });
            }}
          >
            <Icons.mapPin fill="white" className="cursor-move w-8 h-8" />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
});
