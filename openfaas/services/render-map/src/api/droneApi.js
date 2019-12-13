import axios from 'axios';

class DroneApi {
  constructor() {

    if (process && process.env && process.env.NODE_ENV === 'development') {
      this.baseURL = 'http://localhost:3000';
      this.apiBaseUrl = '';
    } else {
      this.baseURL = "";
      this.apiBaseUrl = "";
    }
    this.locations = [];
  }

  fetchLocations() {

    const url = `${this.baseURL}${this.apiBaseUrl}/function/db-reader/positions`;

    return axios
      .get(url)
      .then(res => this.parseResponse(res))
      .then(data => {
        this.locations = data;
      });
  }

  parseResponse({ data }) {
    console.log(data.data);
    return data.data;
  }
}

export const droneApi = new DroneApi();
