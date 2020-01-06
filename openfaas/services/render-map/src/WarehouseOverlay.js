import React from 'react';

export class WarehouseOverlay extends React.Component {
    constructor(props) {
        super(props)
        this.publisherUrl = props.publisherUrl
        console.log('publisher url', this.publisherUrl)
        this.warehouses = [
            { name: 'NE Vegas' },
            { name: 'NW Vegas' }
        ]
    }

    closeWarehouse(warehouse, e) {
        fetch(this.publisherUrl, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ data: {}, filter: { warehouse: warehouse.name }, type: 'cancel' })
        })
        alert(`Cancelling all drones for ${warehouse.name} warehouse`)
    }

    render() {
        return (
            <div className="map-overlay-container">
                <div className="map-overlay">
                    <h2 id="location-title">Warehouses</h2>
                    {this.warehouses.map((warehouse, index) => {
                        return (
                            <div className="warehouse" key={index}>
                                <h3>{warehouse.name}</h3>
                                <button type="button" onClick={(e) => this.closeWarehouse(warehouse, e)}>Close warehouse</button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}
