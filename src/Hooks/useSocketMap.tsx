import { use, useCallback, useEffect, useRef, useState } from "react"
import maplibregl, { Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { WebSocketContext, type SocketResponse } from "../Context/webSocketsMap";
import Cookies from 'js-cookie';
import type { Client } from "../Types/Index";

const clientsMarkers = new Map<string, maplibregl.Marker>()

export const useSocketMap = () => {
    const {status, connect, subscribeToMessage, send} = use(WebSocketContext)
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map>(null)
    const [me, setMe] = useState<Client | null>(null)

    useEffect(() => {
      const name = Cookies.get('name')
      const color = Cookies.get('color')
      const coordsString = Cookies.get('coords')
    
      if(!name || !color || !coordsString) return
      if(status !== 'offline') return;

      const coords = JSON.parse(coordsString);
      connect(name, color, coords)

    }, [connect, status])
    

    // Initialize the map when the component mounts 
    useEffect(() => {
        // Check if the map container is available
        if (!mapContainer.current) return
        if (map.current) return
        // Create a new map instance
        map.current = new maplibregl.Map({
        container: mapContainer.current, // container id
        style: {
        version: 8,
        sources: {
        osm: {
            type: 'raster',
            tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
        }
        },
        layers: [
        {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
        }
        ]
    },
        center: [-122.467895, 37.800126],
        zoom: 14.5,
        attributionControl: false
    });
    
        return () => {
        
        }
    }, [])

    // Función para crear un marcador en el mapa
    const createMarker = useCallback((client: Client, draggable: boolean = false) => {
        if (!map.current) return;
        if (clientsMarkers.has(client.clientId)) return;

        // 1. Crear el Popup
        const popup = new maplibregl.Popup({ offset: 25 })
            .setText(client.name);

        // 2. Crear el Marcador y configurar todo mediante métodos
        const marker = new maplibregl.Marker({
            color: client.color || 'red',
            draggable: draggable
        })
        .setLngLat([client.coords.lng, client.coords.lat])
        .setPopup(popup)
        .addTo(map.current)
        .on('drag', (event) => {
            const newCoords = event.target.getLngLat();
            Cookies.set('coords', JSON.stringify(newCoords));
            send({
                type: 'CLIENT_MOVED',
                payload: {
                    clientId: client.clientId,
                    coords: newCoords
                }
            });
        });

        clientsMarkers.set(client.clientId, marker);
        return marker;
    }, [send]);

    const removeMarker = (clientId: string ) => {
        if(!clientsMarkers.has(clientId)) return; 
        
        const marker = clientsMarkers.get(clientId)
        if(!marker) return
        marker.remove();
    }

    const moveMarker = (clientId: Client) => {
        if(!clientsMarkers.has(clientId.clientId)) return;

        const marker = clientsMarkers.get(clientId.clientId)
        if(!marker) return
        marker.setLngLat([clientId.coords.lng, clientId.coords.lat])
    }

    // Función para manejar las respuestas del socket
    const handleResponse = (response: SocketResponse) => {
        const { type, payload } = response;
        switch (type) {
            case 'WELCOME':
                setMe(payload)
                createMarker(payload, true)
                break;

            case 'CLIENT_STATE':
                payload.forEach(client =>createMarker(client, false))
                break;
            case 'CLIENT_JOINED':
                createMarker(payload)
                break;
            case 'CLIENT_MOVED':
                moveMarker(payload)
                break;
            case 'CLIENT_LEFT':
                removeMarker(payload.Client)
                break;

        }
    }

    useEffect(() => {
      return subscribeToMessage(handleResponse)    
    }, [subscribeToMessage])
    
    return {
        
        mapContainer,
        map,
        connect,
        me
    }
}
