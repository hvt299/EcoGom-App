import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
    _id: string;
    name: string;
    location: { coordinates: [number, number] }; // [Long, Lat]
    address_hint: string;
}

interface Props {
    locations: Location[];
}

export default function LeafletMap({ locations }: Props) {
    const locationsJson = JSON.stringify(locations);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .leaflet-control-attribution { display: none; } /* Ẩn dòng bản quyền cho gọn */
          
          /* CSS cho icon vẽ bằng code */
          .custom-pin {
            background: none;
            border: none;
          }
          .pin-svg {
            filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.3)); /* Đổ bóng cho đẹp */
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([21.028511, 105.854444], 13);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          // --- PHẦN QUAN TRỌNG: ICON VẼ BẰNG SVG (KHÔNG DÙNG ẢNH PNG) ---
          // Hình giọt nước màu xanh lá (Green)
          var svgIcon = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" class="pin-svg">
              <path fill="#16a34a" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          \`;

          var myIcon = L.divIcon({
            className: 'custom-pin',
            html: svgIcon,
            iconSize: [36, 36],
            iconAnchor: [18, 36], // Chân icon nằm đúng điểm
            popupAnchor: [0, -38]
          });
          // -----------------------------------------------------------

          var locations = ${locationsJson};

          if (locations && locations.length > 0) {
             var bounds = L.latLngBounds();
             
             locations.forEach(function(loc) {
                var lat = loc.location.coordinates[1];
                var long = loc.location.coordinates[0];
                
                var marker = L.marker([lat, long], {icon: myIcon}).addTo(map);
                
                // Popup đẹp hơn chút
                marker.bindPopup(
                  "<div style='font-family: sans-serif; text-align: center'>" +
                    "<b style='color: #166534; font-size: 14px'>" + loc.name + "</b><br>" + 
                    "<span style='color: #64748b; font-size: 11px'>" + loc.address_hint + "</span>" +
                  "</div>"
                );
                
                bounds.extend([lat, long]);
             });

             map.fitBounds(bounds, { padding: [50, 50] });
          }
        </script>
      </body>
    </html>
  `;

    return (
        <View style={{ height: 200, width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator color="#16a34a" size="large" style={{ flex: 1 }} />}
            />
        </View>
    );
}