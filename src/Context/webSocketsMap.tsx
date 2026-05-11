import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import type { LatLng, Client } from '../Types/Index';

type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'disconnected' | 'error';

// Tipados específicos
export type SocketMessage = 
| { type: 'CLIENT_REGISTER',payload: {name: string, color: string, coords: LatLng}; }
| { type: 'CLIENT_MOVED', payload: {clientId: string, coords: LatLng} }   
| { type: 'GET_CLIENTS',}

export type SocketResponse = 
|{ type: 'ERROR';         payload: {message: string};}
|{ type: 'WELCOME';       payload: Client;}
|{ type: 'CLIENT_STATE';  payload: Client[];}
|{ type: 'CLIENT_JOINED'; payload: Client;}
|{ type: 'CLIENT_MOVED';  payload: Client;}
|{ type: 'CLIENT_LEFT';   payload: {Client: string} };

export type SocketListener = (message: SocketResponse) => void;

interface WebSocketContextState {
  status: ConnectionStatus;
  //identificador del cliente asignado por el servidor, útil para saber quién soy en la lista de clientes
  socketId: string | null;
  connect: (name: string, color: string, latlng: LatLng) => void;
  disconnect: () => void;
  send: (message: SocketMessage) => void;
  // Permite suscribirse a mensajes específicos del socket
  subscribeToMessage: (listener: SocketListener) => () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const WebSocketContext = createContext({} as WebSocketContextState);
// Mapa global de listeners para manejar mensajes específicos
const messageListeners = new Set<SocketListener>();
let connecting = false;

interface Props {
  children: ReactNode;
  url: string;
}

export const WebSocketProvider = ({ children, url }: Props) => {
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [socketId, setSocketId] = useState<string | null>(null)
  const socket = useRef<WebSocket | null>(null)
  const shouldReconnectRef = useRef(true)

  useEffect(() => {
    console.log({status});
  }, [status])
  

  // Función para desconectar el socket
  const disconnect = () => {
    socket.current?.close();
    socket.current = null;
    shouldReconnectRef.current = false;
    setStatus('offline')
  }

  // Función para conectar el socket con los datos del cliente
  const connect = useCallback(() => {
      
    if(connecting) return 
      connecting = true;

    setStatus('connecting');
    const ws = new WebSocket(url);
    shouldReconnectRef.current = true

    ws.addEventListener('open', () => {
      connecting = false
      socket.current = ws;
      setStatus('connected');
    });

    ws.addEventListener('close', () => {
      console.log('CLOSE EVENT CALLED');
      
      socket.current = null;
      setStatus('disconnected');
    });

    ws.addEventListener('error', (event) => {
      console.log({ customError: event });
    });

    ws.addEventListener('message', (event) => {
      try {
        
        const message = JSON.parse(event.data);
        if (message.type === 'WELCOME') {
          setSocketId(message.payload.clientId)
        }
        messageListeners.forEach(listener => listener(message))
      } catch (error) {
        console.log('Invallid socket message', error);
        
      }
      
      // Aquí podrías agregar lógica adicional para manejar diferentes tipos de mensajes
    });

    return ws;
  }, [url]);

    // Función para conectar el socket con los datos del cliente
  const connestToServer = (name: string, color: string, latlng: LatLng) => {
    if(status === 'connected' || status === 'connecting') return;  
    console.log({name, color, latlng});
    Cookies.set('name', name)
    Cookies.set('color', color)
    Cookies.set('coords', JSON.stringify(latlng))
    connect();
  }

  const subscribeToMessage = (listener: SocketListener) => {
    messageListeners.add(listener);

    return () => {
      messageListeners.delete(listener);
    }
  }

  // useEffect(() => {
  //   const ws = connect();

  //   return () => {
  //     if (ws.readyState === WebSocket.OPEN) {
  //       ws.close();
  //     }
  //   };
  // }, [connect]);

  // Función básica de re-conexión
  useEffect(() => {
    if (shouldReconnectRef.current ) return;

    let interval: ReturnType<typeof setInterval>;
    if (status === 'disconnected') {
      interval = setInterval(() => {
        console.log('Reconnecting every 1 second...');
        connect();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, connect]);

  const send = (message: SocketMessage) => {
    if (!socket.current) throw new Error('Socket not connected');

    const jsonMessage = JSON.stringify(message);
    socket.current?.send(jsonMessage);
  };

  return (
    <WebSocketContext
      value={{
        status: status,
        send: send,
        connect: connestToServer,
        disconnect: disconnect,
        socketId: socketId,
        subscribeToMessage: subscribeToMessage
      }}
    >
      {children}
  </WebSocketContext>
  )
}