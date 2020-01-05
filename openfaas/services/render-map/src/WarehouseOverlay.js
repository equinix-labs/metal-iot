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
        console.log('close', warehouse)
        /*
        fetch(this.publisherUrl, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ data: {}, filter: { name: null }, type: 'cancel' })
        })
        */
    }

    render() {
        return (
            <div class="map-overlay-container">
                <div class="map-overlay">
                    <h2 id="location-title">Warehouses</h2>
                    {this.warehouses.map((warehouse, index) => {
                        return (
                            <div class="warehouse" key={index}>
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
