
import { ConnectForm } from '../Components/ConnectForm'
import { useSocketMap } from '../Hooks/useSocketMap'
import './MapPage.css'



export const MapPage = () => {

 const { mapContainer, map, connect, me} = useSocketMap()

 const handleSubmit = (name: string, color: string): void => {
  const currentLocation = map.current?.getCenter();
  if(!currentLocation) return

    connect( name, color, 
      {
        lat: currentLocation.lat,
        lng: currentLocation.lng 
      }
    );
 }

  return (
    <>
      
      {
        me ? (
          <div className='user-info'>
            <h3 style={{
              color: me.color
            }} >
              {me.name}
            </h3>
            
            <p>Color: {me.color}</p>
            <p>Ubicacion: {me.coords.lat.toFixed(2)}, {me.coords.lng.toFixed(2)}</p>
            <p>
              {
                me.updatedAt ? new Date(me.updatedAt).toLocaleString() : ' '
              }
            </p>

          </div>
        ):
        (
          <ConnectForm onSubmit={handleSubmit}/>
        )
      }  
        
        <div className="map-container" ref={mapContainer} ></div>
        </>
      )
    }
