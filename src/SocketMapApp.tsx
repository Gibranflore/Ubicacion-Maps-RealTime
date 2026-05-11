
import { WebSocketProvider } from "./Context/webSocketsMap";
import { MapPage } from "./Pages/MapPage";


export const SocketMapApp = () => {
  return (
    <>
    <WebSocketProvider url="ws://localhost:3200">
      <MapPage/>
    </WebSocketProvider>
    </>
  )

}

export default SocketMapApp;