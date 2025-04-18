import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Fallback color if no data available
const defaultColor = '#cccccc';

// Fixed color palette for boroughs
const boroughColors = {
  Manhattan: '#f94144',
  Brooklyn: '#f3722c',
  Queens: '#f8961e',
  Bronx: '#43aa8b',
  'Staten Island': '#577590'
};

const MapComponent = () => {
  const mapContainer = useRef(null);
  const [boroughData, setBoroughData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [layerMode, setLayerMode] = useState('chloropleth'); // Default to both layers visible
  const mapRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoiam9iYWFyb24iLCJhIjoiY203bDZqbGkwMDRzdzJpb2ttaXE4ampneSJ9.EO1FJrn79qadjQyeS3RPHA';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      center: [-74.0, 40.7],
      zoom: 10,
      hash: true,
    });

    mapRef.current = map; // Store map reference

    map.on('load', async () => {
      try {
        const boroughResponse = await fetch('/boroughs.geojson');
        const geojson = await boroughResponse.json();

        map.addSource('boroughs', {
          type: 'geojson',
          data: geojson
        });
        const siteResponse = await fetch('http://18.118.1.221:5000/api/sites');
        const siteData = await siteResponse.json();

        const counts = siteData.reduce((acc, site) => {
          const b = site.boroughName;
          if (b) acc[b] = (acc[b] || 0) + 1;
          return acc;
        }, {});

        // Set up color expressions for borough highlighting
        const colorExpression = ['match', ['get', 'name']];
        geojson.features.forEach((feature) => {
          const boroughName = feature.properties.name;
          const color = boroughColors[boroughName] || defaultColor;
          colorExpression.push(boroughName, color);
        });
        colorExpression.push(defaultColor);

        // Add borough layers to the map
        map.addLayer({
          id: 'borough-fills',
          type: 'fill',
          source: 'boroughs',
          paint: {
            'fill-color': colorExpression,
            'fill-opacity': 0.6
          }
        });

        map.addLayer({
          id: 'borough-borders',
          type: 'line',
          source: 'boroughs',
          paint: {
            'line-color': '#990000',
            'line-width': 2
          }
        });

        map.addLayer({
          id: 'borough-labels',
          type: 'symbol',
          source: 'boroughs',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 14,
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1
          }
        });

        // Add markers for each construction site
        siteData.forEach(site => {
          const { Latitude, Longitude, BIN, boroughName, complaint_count } = site;

          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <h3>Site: ${BIN}</h3>
              <p>Borough: ${boroughName}</p>
              <p>Complaint Count: ${complaint_count}</p>
            `);

          new mapboxgl.Marker()
            .setLngLat([Longitude, Latitude])
            .setPopup(popup) // Add popup to marker
            .addTo(map);
        });

        setBoroughData(counts);
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    });

    return () => map.remove();
  }, []);

  // Handle the address search and autofill
  const handleSearch = async () => {
    const map = mapRef.current;
    const address = searchQuery.trim();

    if (map && address) {
      try {
        // Use Mapbox's Geocoding API to get the coordinates for the address
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`;
        const response = await fetch(geocodingUrl);
        const data = await response.json();

        if (data.features.length > 0) {
          // Get the first result's coordinates
          const [longitude, latitude] = data.features[0].geometry.coordinates;

          // Center the map on the address
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15, // Adjust the zoom level as necessary
            essential: true, // Ensures smooth animation
          });

          // Clear suggestions after a successful search
          setSuggestions([]);
        } else {
          alert("Address not found.");
        }
      } catch (error) {
        console.error("Error with geocoding:", error);
        alert("Failed to search for the address.");
      }
    }
  };

  // Handle address input change and fetch suggestions
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 2) {
      try {
        // Fetch suggestions from Mapbox Geocoding API
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`;
        const response = await fetch(geocodingUrl);
        const data = await response.json();

        setSuggestions(data.features); // Set the suggestions
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]); // Clear suggestions when the query is too short
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionSelect = (selectedSuggestion) => {
    const map = mapRef.current;

    // Get the coordinates of the selected suggestion
    const [longitude, latitude] = selectedSuggestion.geometry.coordinates;

    // Center the map on the selected address
    map.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      essential: true,
    });

    // Clear the search query and suggestions
    setSearchQuery('');
    setSuggestions([]);
  };
  

  const handleLayerChange = (e) => {
    const map = mapRef.current;
    const selectedMode = e.target.value;
    setLayerMode(selectedMode);

    if (map) {
      if (selectedMode === 'points') {
        map.setLayoutProperty('borough-fills', 'visibility', 'none');
        map.setLayoutProperty('borough-borders', 'visibility', 'none');
      } else if (selectedMode === 'chloropleth') {
        map.setLayoutProperty('borough-fills', 'visibility', 'visible');
        map.setLayoutProperty('borough-borders', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('borough-fills', 'visibility', 'visible');
        map.setLayoutProperty('borough-borders', 'visibility', 'visible');
      }
    }
  };

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />

            {/* Search Bar */}
            <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          zIndex: 1,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <input
          type="text"
          placeholder="Search for an address"
          value={searchQuery}
          onChange={handleInputChange}
          style={{
            padding: '5px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            marginRight: '10px',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Search
        </button>

        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '5px',
              maxHeight: '200px',
              overflowY: 'auto',
              position: 'absolute',
              top: '50px',
              left: '0px',
              width: '100%',
              zIndex: 2,
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#eee',
                }}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Layer Control */}
      <div
        style={{
          position: 'absolute',
          top: '150px',
          right: '20px',
          zIndex: 1,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '10px',
          boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h4>Map Layers</h4>
        <label>
          <input
            type="radio"
            name="layer-toggle"
            value="points"
            checked={layerMode === 'points'}
            onChange={handleLayerChange}
          />
          Show points only
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="layer-toggle"
            value="chloropleth"
            checked={layerMode === 'chloropleth'}
            onChange={handleLayerChange}
          />
          Show Choropleth
        </label>
      </div>

      {/* Legend */}
<div
  style={{
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  }}
>
  <h4>Borough Totals</h4>
  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
    {Object.entries(boroughData).map(([borough, count]) => (
      <li key={borough} style={{ marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>{borough}</span>: {count} sites
      </li>
    ))}
  </ul>

  <h4>Borough Color Legend</h4>
  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
    {Object.entries(boroughColors).map(([borough, color]) => (
      <li key={borough} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: color,
            marginRight: '10px',
          }}
        ></div>
        {borough}
      </li>
    ))}
  </ul>
</div>

    </div>
  );
};

export default MapComponent;
