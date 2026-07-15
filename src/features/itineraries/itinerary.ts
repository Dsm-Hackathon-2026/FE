export type ItineraryStopKind =
  | "station"
  | "current-location"
  | "restaurant"
  | "cafe"
  | "attraction"
  | "filming-location";

export type ItineraryStop = {
  id: string;
  order: number;
  name: string;
  description: string;
  address: string;
  imageSrc?: string;
  imageAlt?: string;
  spotId?: number;
  kind: ItineraryStopKind;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distanceToNext?: string;
};

export type Itinerary = {
  id: string;
  title: string;
  stops: readonly ItineraryStop[];
};
