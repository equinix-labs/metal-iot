"use strict"

const { Client } = require('pg')
const Pool = require('pg').Pool
const fs = require('fs')

const pool = initPool()

module.exports = async (event, context) => {
    if(event.method == "POST") {

        let dataType = getDataType(event.body)
            if(dataType == "position") {
                let client = await pool.connect()
                try {
                    let {name, location, destination, tempCelsius,
                        batteryPercent, batteryDrain, speed,
                        bearing, altitude, payloadPercent, status} = event.body;
                    let inserted = await insertPosition(client, name, location, destination,
                        tempCelsius, batteryPercent, batteryDrain, speed,
                        bearing, altitude, payloadPercent, status);
                } catch (e) {
                    console.log('position', event.body);
                    throw e
                } finally {
                    client.release()
                }
                return context.status(200).succeed({"status": "OK"});
            } if(dataType == "event") {
                let client = await pool.connect()
                try {
                    let {type, data} = event.body;
                    let inserted = await insertEvent(client, type, data);
                } catch (e) {
                    console.log('event', event.body);
                    throw e
                } finally {
                    client.release()
                }
                return context.status(200).succeed({"status": "OK"});
            }
        }

    return context.status(200).succeed({"status": "No action"});
}

class Point {
    constructor(point) {
        this.lon = point.lon
        this.lat = point.lat
    }

    toString() {
        return "(" + this.lon+"," + this.lat+")"
    }
}

function getDataType(body) {
    if(body.location) {
        return "position"
    }
    return "event"
}

async function insertPosition(client, name, location, destination,
        tempCelsius, batteryPercent, batteryDrain, speed,
        bearing, altitude, payloadPercent, status) {
    let res = await client.query(`insert into drone_position (
        name, location, latitude, longitude, destination,
        temp_celsius, battery_percent, battery_drain, speed,
        bearing, altitude, payload_percent, status) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        );`, [
            name, new Point(location).toString(), location.lat, location.lon, new Point(destination).toString(),
        tempCelsius, batteryPercent, batteryDrain, speed,
        bearing, altitude, payloadPercent, status]);
    return res.rowCount;
}

async function insertEvent(client, eventType, data) {
    console.error('event', eventType, data)
    const { message, name, hangar, warehouse, batteryPercent, batteryConsumed, location, payload } = data
    let res = await client.query(`insert into drone_event (
        event_type, message, name, hangar, warehouse,
        battery_percent, battery_consumed, location,
        latitude, longitude, payload
    ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    );`, [
        eventType, message, name, hangar, warehouse,
        batteryPercent, batteryConsumed, location && new Point(location).toString(),
        location.lat, location.lon, payload]);
    return res.rowCount;
}

function initPool() {
  return new Pool({
    user: fs.readFileSync("/var/openfaas/secrets/db-username", "utf-8"),
    host: fs.readFileSync("/var/openfaas/secrets/db-host", "utf-8"),
    database: process.env["db_name"],
    password: fs.readFileSync("/var/openfaas/secrets/db-password", "utf-8"),
    port: process.env["db_port"],
  });
 }
