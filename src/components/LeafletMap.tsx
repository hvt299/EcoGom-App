import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Location } from '../types/location';

interface Props {
  locations: Location[];
  center: [number, number]; // [Lat, Long]
}

export default function LeafletMap({ locations, center }: Props) {
  const webviewRef = useRef<WebView>(null);
  const locationsJson = JSON.stringify(locations);

  useEffect(() => {
    if (webviewRef.current) {
      const script = `
                if (typeof map !== 'undefined') {
                    map.flyTo([${center[0]}, ${center[1]}], 14, { duration: 2 });
                    if (userMarker) {
                        userMarker.setLatLng([${center[0]}, ${center[1]}]);
                    }
                }
            `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [center]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .leaflet-control-attribution { display: none; }
          .custom-pin { background: none; border: none; }
          .pin-svg { filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.3)); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${center[0]}, ${center[1]}], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          // Icon Rác (Xanh lá)
          var wasteIconSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" class="pin-svg">
              <path fill="#16a34a" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>\`;
            
          var wasteIcon = L.divIcon({ className: 'custom-pin', html: wasteIconSvg, iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38] });

          // Icon User (Xanh dương) - Để đánh dấu vị trí người dùng
          var userIconSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" class="pin-svg">
              <path fill="#2563eb" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="3" fill="white"/>
              <circle cx="12" cy="9" r="1.5" fill="#2563eb"/>
            </svg>\`;

          var userIcon = L.divIcon({ className: 'custom-pin', html: userIconSvg, iconSize: [36, 36], iconAnchor: [18, 36] });
          
          // Tạo marker user
          var userMarker = L.marker([${center[0]}, ${center[1]}], {icon: userIcon}).addTo(map);
          userMarker.bindPopup('<b style="color:#2563eb">Vị trí của bạn</b>');
          userMarker.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              this.openPopup();
          });

          var locations = ${locationsJson};
          if (locations && locations.length > 0) {
             locations.forEach(function(loc) {
                var lat = loc.location.coordinates[1];
                var long = loc.location.coordinates[0];
                var marker = L.marker([lat, long], {icon: wasteIcon}).addTo(map);
                marker.bindPopup("<b style='color:#166534;'>" + loc.name + "</b><br><span style='font-size:11px'>" + loc.address_hint + "</span>");
             });
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ height: 200, width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator color="#16a34a" size="large" style={{ flex: 1 }} />}
      />
    </View>
  );
}