import LatLon from "geodesy/latlon-spherical.js";

export interface Zone {
    location: LatLon;
    radius: number;
    altitude: number;
}
export class Weather {
    public zones: Zone[];

    constructor(zones: Zone[]) {
        this.zones = zones;
    }

    public isWindy(location: LatLon, altitude: number) {
        for ( const zone of this.zones ) {
            if (location.distanceTo(zone.location) < zone.radius
                    && altitude > zone.altitude) {
                return true;
            }
        }
        return false;
    }
}
