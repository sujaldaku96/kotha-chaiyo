import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import "../styles/PropertyMap.css";

// default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ initialPosition, onPositionChange }) => {
  const [position, setPosition] = useState(initialPosition);
  const map = useMapEvents({
    click(e) {
      const newPosition = e.latlng;
      setPosition(newPosition);
      onPositionChange(newPosition);
      map.flyTo(newPosition, map.getZoom());
    },
  });

  useEffect(() => {
    setPosition(initialPosition);
    if (initialPosition) {
      map.flyTo(initialPosition, map.getZoom());
    }
  }, [initialPosition, map]);

  return position ? (
    <Marker position={position}>
      <Popup>Property Location</Popup>
    </Marker>
  ) : null;
};

const PropertyMap = ({ 
  latitude,  
  longitude,
  city = "",
  exactLocation = "",
  onPositionChange = () => {}
}) => {
  const [mapReady, setMapReady] = useState(false);
  
  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) return <div>Loading map...</div>;

  const initialPosition = latitude && longitude ? [latitude, longitude] : [27.7172, 85.3240]; 

  return (
    <div className="map-container">
      <MapContainer 
        center={initialPosition} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          initialPosition={initialPosition}
          onPositionChange={onPositionChange}
        />
      </MapContainer>
    </div>
  );
};

export default PropertyMap;