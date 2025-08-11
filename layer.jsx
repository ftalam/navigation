import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiKey, geoapifyUrl, searchLocation } from '../api/api';
import Routing from './routing';

const MapComponent = () => {
  const mapRef = useRef(null); // Create a ref for the map
  const [map, setMap] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMarker, setCurrentMarker] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showRouting, setShowRouting] = useState(false);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [geometry, setGeometry] = useState(null);
  const [fromMarker, setFromMarker] = useState(null);
  const [toMarker, setToMarker] = useState(null);

  const handleCoordsUpdate = (from, to) => {
    setFromCoords(from);
    setToCoords(to);
  };
  const greenIcon = new L.Icon({
    iconUrl:
      'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize: [41, 41],
  });
  const BlueIcon = new L.Icon({
    iconUrl:
      'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  useEffect(() => {
    const initializedMap = L.map('my-map').setView([-0.395657, 36.961419], 16);
    L.tileLayer(
      `${geoapifyUrl}tile/osm-carto/{z}/{x}/{y}.png?apiKey=${apiKey}`,
      {
        attribution: 'Powered by Geoapify | © OpenStreetMap contributors',
        maxZoom: 20,
        id: 'osm-bright',
      }
    ).addTo(initializedMap);

    setMap(initializedMap);

    return () => initializedMap.remove();
  }, []);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(''); // Reset error state

    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return; // Exit early if the query is empty
    }

    try {
      const results = await searchLocation(query);
      setIsLoading(false); // Ensure loading state is updated in case of early return

      if (results.features.length === 0) {
        // If the results array is empty, set an error message
        setError('Search is not in Kimathi');
        setSearchResults([]); // Clear any previous results
        return; // Exit the function
      }

      // If there are results, update the state with these results
      setSearchResults(results.features);
    } catch (error) {
      setError('Failed to load search results.');
      setSearchResults([]);
    } finally {
      setIsLoading(false); // Ensure loading state is always updated
    }
  };

  const handleResultClick = (result) => {
    const { coordinates } = result.geometry;
    const { formatted } = result.properties;
    map.setView([coordinates[1], coordinates[0]], 20);

    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    const marker = L.marker([coordinates[1], coordinates[0]], {
      icon: greenIcon,
    }) // Use greenIcon
      .addTo(map)
      .bindPopup(formatted)
      .openPopup();
    setInputValue(formatted);
    setCurrentMarker(marker);
    setSearchResults([]);
  };
  const btnStyle = {
    width: showRouting ? '100%' : 'auto',
  };
  useEffect(() => {
    polylines.forEach((polyline) => {
      if (map) map.removeLayer(polyline);
    });
    setPolylines([]);

    // Only attempt to draw polylines if showRouting is true, map and geometry are available, and both fromCoords and toCoords are not null
    if (
      showRouting &&
      map &&
      geometry &&
      geometry.length > 0 &&
      fromCoords &&
      toCoords
    ) {
      const newPolylines = geometry.map((geom) => {
        const coordinates = geom.map(([lon, lat]) => [lat, lon]); // Transform coordinates
        return L.polyline(coordinates, { color: 'blue' }).addTo(map);
      });

      setPolylines(newPolylines);
    }
  }, [showRouting, map, geometry, fromCoords, toCoords]); // Add fromCoords and toCoords to the dependency array

  useEffect(() => {
    if (map) {
      if (fromMarker) {
        map.removeLayer(fromMarker);
      }
      if (fromCoords) {
        const marker = L.marker([fromCoords.lat, fromCoords.lon], {
          icon: greenIcon,
        }).addTo(map); // Use greenIcon
        setFromMarker(marker);
      }

      if (toMarker) {
        map.removeLayer(toMarker);
      }
      if (toCoords) {
        const marker = L.marker([toCoords.lat, toCoords.lon], {
          icon: BlueIcon,
        }).addTo(map); // Use BlueIcon
        setToMarker(marker);
      }
    }
  }, [map, fromCoords, toCoords]); // Depend on map, fromCoords, and toCoords
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 16); // Center map on user's location with a zoom level of 16

          L.marker([latitude, longitude], { icon: greenIcon }) // Use greenIcon
            .addTo(map)
            .bindPopup('You are here!')
            .openPopup();
        },
        () => {
          alert('Unable to retrieve your location');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };
  const toggleRoutingView = () => {
    if (showRouting) {
      // If we're currently showing routing, clear routing data upon hiding
      clearRoutingData();
    }
    // Toggle the routing view
    setShowRouting(!showRouting);
  };
  const clearRoutingData = () => {
    // Remove polylines from the map
    polylines.forEach((polyline) => {
      if (map) map.removeLayer(polyline);
    });
    // Reset state related to routing
    setPolylines([]);
    setGeometry(null);
    setFromCoords(null);
    setToCoords(null);

    // Remove from and to markers if they exist
    if (fromMarker) {
      map.removeLayer(fromMarker);
      setFromMarker(null);
    }
    if (toMarker) {
      map.removeLayer(toMarker);
      setToMarker(null);
    }
  };
  return (
    <div className="map">
      <div className="search-and-toggle-container">
        {showRouting ? (
          ''
        ) : (
          <input
            value={inputValue}
            className="search-input"
            type="text"
            onChange={(e) => {
              setInputValue(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search location..."
          />
        )}

        <button
          style={btnStyle}
          className="toggle-routing-btn"
          onClick={toggleRoutingView}
        >
          {showRouting ? 'Exit Routing' : ' Routing'}
        </button>
      </div>
      <div id="my-map"></div>
      {showRouting ? (
        ''
      ) : (
        <div>
          {' '}
          {(searchResults.length > 0 ||
            isLoading ||
            (error && inputValue.trim())) && (
            <div className="search-results">
              {isLoading && <div className="loading">Loading...</div>}
              {error && <div className="error">{error}</div>}
              {!isLoading &&
                !error &&
                searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="search-result"
                  >
                    <div className="result-formatted">
                      {result.properties.formatted}
                    </div>
                    <div className="result-details">
                      {result.properties.county}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="routing-overlay">
        {showRouting && (
          <Routing
            onRouteGeometryUpdate={setGeometry}
            onCoordsUpdate={handleCoordsUpdate}
          />
        )}
      </div>
      <div className="location-btn-container">
        <button onClick={getUserLocation} className="get-location-btn">
          Get My Location
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
