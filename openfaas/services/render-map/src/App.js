import React from 'react';
import './App.css';

// import { DroneComponent } from './DroneComponent.js';

import { Map } from './Map.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <p>Drones</p> */}
        {/* <DroneComponent></DroneComponent> */}

        <Map></Map>
      </header>
    </div>
  );
}

export default App;
