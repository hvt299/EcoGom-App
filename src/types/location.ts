export interface Location {
  _id: string;
  name: string;
  type: string;
  address_hint: string;
  location: { coordinates: [number, number] }; // [Long, Lat]
}