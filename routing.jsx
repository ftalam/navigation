import React, { useEffect, useState } from 'react';
import { apiKey, geoapifyUrl, searchLocation } from '../api/api';

const Routing = ({ onRouteGeometryUpdate, onCoordsUpdate }) => {
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [fromError, setFromError] = useState('');
  const [toError, setToError] = useState('');
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('drive');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (fromCoords && toCoords) {
      fetchRoute();
    }
  }, [fromCoords, toCoords, mode]);

  useEffect(() => {
    if (fromSearch === '') {
      setFromCoords(null);
    }
  }, [fromSearch]);

  useEffect(() => {
    if (toSearch === '') {
      setToCoords(null);
    }
  }, [toSearch]);

  const fetchRoute = async () => {
    setLoadingRoute(true);
    const url = `${geoapifyUrl}/routing?waypoints=${fromCoords.lat},${fromCoords.lon}|${toCoords.lat},${toCoords.lon}&mode=${mode}&apiKey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features.length > 0 && data.features[0].geometry.coordinates) {
        onRouteGeometryUpdate(data.features[0].geometry.coordinates);
        setRoute(data);
      } else {
        onRouteGeometryUpdate(null);
        setRoute([]);
      }
    } catch (error) {
      setError('Failed to fetch route. Please try again later.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSearch = async (query, setResults, setLoading, setError) => {
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }
    setLoading(true);
    try {
      const results = await searchLocation(query);
      if (results.features.length === 0) {
        setError('Location not found.');
        setResults([]);
      } else {
        setError('');
        setResults(results.features);
      }
    } catch (error) {
      setError('Failed to load search results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`routing-container${collapsed ? ' collapsed' : ''}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="collapse-button"
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>
      {!collapsed && (
        <div className="routing-container">
          <input
            type="text"
            className="search-inputs2"
            value={fromSearch}
            onChange={(e) => {
              setFromSearch(e.target.value);
              handleSearch(
                e.target.value,
                setFromResults,
                setFromLoading,
                setFromError
              );
            }}
            placeholder="From..."
          />

          <input
            type="text"
            className="search-inputs2"
            value={toSearch}
            onChange={(e) => {
              setToSearch(e.target.value);
              handleSearch(
                e.target.value,
                setToResults,
                setToLoading,
                setToError
              );
            }}
            placeholder="To..."
          />

          {toLoading && <div className="loading">Loading to results...</div>}
          {toError && <div className="error">{toError}</div>}

          <div className="search-results2">
            {toResults.map((result, index) => (
              <div
                className="search-result"
                key={index}
                onClick={() => {
                  const [lon, lat] = result.geometry.coordinates;
                  setToCoords({ lat, lon });
                  setToSearch(result.properties.formatted);
                  setToResults([]);
                  onCoordsUpdate(fromCoords, { lat, lon });
                }}
              >
                <div className="result-formatted">
                  {result.properties.formatted}
                </div>
                <div className="result-details">{result.properties.county}</div>
              </div>
            ))}
          </div>

          {fromLoading && (
            <div className="loading">Loading from results...</div>
          )}
          {fromError && <div className="error">{fromError}</div>}

          <div className="search-results2">
            {fromResults.map((result, index) => (
              <div
                className="search-result"
                key={index}
                onClick={() => {
                  const [lon, lat] = result.geometry.coordinates;
                  setFromCoords({ lat, lon });
                  setFromSearch(result.properties.formatted);
                  setFromResults([]);
                  onCoordsUpdate(toCoords, { lat, lon });
                }}
              >
                <div className="result-formatted">
                  {result.properties.formatted}
                </div>
                <div className="result-details">{result.properties.county}</div>
              </div>
            ))}
          </div>

          <p className="mode-prompt">
            Please select your mode of transportation:
          </p>
          <div className="mode-selection">
            <input
              type="radio"
              id="drive"
              name="mode"
              value="drive"
              checked={mode === 'drive'}
              onChange={() => setMode('drive')}
            />
            <label htmlFor="drive">Drive</label>
            <br />
            <input
              type="radio"
              id="walk"
              name="mode"
              value="walk"
              checked={mode === 'walk'}
              onChange={() => setMode('walk')}
            />
            <label htmlFor="walk">Walk</label>
            <br />
            <input
              type="radio"
              id="motorcycle"
              name="mode"
              value="motorcycle"
              checked={mode === 'motorcycle'}
              onChange={() => setMode('motorcycle')}
            />
            <label htmlFor="motorcycle">Motorcycle</label>
          </div>

          {loadingRoute && <div className="loading">Loading route...</div>}
          {error && <div className="error">{error}</div>}

          {!loadingRoute && route && fromCoords && toCoords && (
            <div className="route-details-container">
              <div className="route-details">
                <h3>Route Details</h3>

                <p>
                  Distance:{' '}
                  {(route.features[0].properties.distance / 1000).toFixed(2)}{' '}
                  kilometers
                </p>

                <p>
                  Time: {Math.round(route.features[0].properties.time / 60)}{' '}
                  minutes
                </p>
              </div>
              <div className="route-steps">
                <h3>Route Steps</h3>
                <ol>
                  {route.features[0].properties.legs[0].steps.map(
                    (step, index) => (
                      <li key={index}>{step.instruction.text}</li>
                    )
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Routing;
