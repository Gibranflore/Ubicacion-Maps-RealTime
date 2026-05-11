export interface LatLng {
    lat: number,
    lng: number
}

export interface Client {
    clientId: string,
    name: string,
    color: string,
    coords: LatLng
    updatedAt?: number;
}