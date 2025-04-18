import React, { useState } from 'react';
import MapComponent from './mapComponent';
import MLView from './MLView';

const App = () => {
  const [tab, setTab] = useState('map');

  const activeStyle = {
    backgroundColor: '#4F46E5', // Indigo
    color: '#fff',
  };

  return (
    <div>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#1F2937', // Dark gray
        color: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>NYC Stalled Construction Sites</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setTab('map')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: tab === 'map' ? activeStyle.backgroundColor : '#374151', // Gray for inactive
              color: tab === 'map' ? activeStyle.color : '#d1d5db',
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Map
          </button>
          <button
            onClick={() => setTab('ml')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: tab === 'ml' ? activeStyle.backgroundColor : '#374151',
              color: tab === 'ml' ? activeStyle.color : '#d1d5db',
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Report Insights
          </button>
        </div>
      </nav>

      {tab === 'map' ? <MapComponent /> : <MLView />}
    </div>
  );
};

export default App;
