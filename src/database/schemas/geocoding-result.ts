// GeocodingResult type definition (copied from backend)
export interface GeocodingResult {
  address: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
    postalCode?: string;
    neighborhood?: string;
  };
}
