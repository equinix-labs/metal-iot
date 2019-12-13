import React, { Component } from 'react';

import { droneApi } from './api/droneApi';

export class DroneComponent extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        isLoading: true,
        locations: []
      };
    }

    componentDidMount() {
        droneApi.fetchLocations()
        .then(res => {
            console.log(droneApi.locations)
            this.setState({locations: droneApi.locations, isLoading: false});
        })
        .catch(e => {
            console.error(e);
        });
    }
    
    render() {
        const { isLoading, locations } = this.state;
        let panelBody = "Loaded";

        if (isLoading) {
            panelBody = (
              <div style={{ textAlign: 'center' }}>
                Loading
              </div>
            );
        } else {
            panelBody = (
                <div style={{ textAlign: 'center' }}>
                    <ul>
                    {
                        locations.map((l) => {
                            return <li key="{l.name}">{l.name} @ ({l.location.x}, {l.location.y})</li>
                        })
                    }
                </ul>
                </div>
              )
        }
        return (
            <div>{panelBody}</div>
        )
    }
}
