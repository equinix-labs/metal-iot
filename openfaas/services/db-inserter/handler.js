"use strict"
const { Client } = require('pg')
const Pool = require('pg').Pool
const fs = require('fs')
var pool;

module.exports = async (event, context) => {
    if(!pool) {
        pool = new Pool({
            user: fs.readFileSync("/var/openfaas/secrets/db-username", "utf-8"),
            host: fs.readFileSync("/var/openfaas/secrets/db-host", "utf-8"),
            database: process.env["db_name"],
            password: fs.readFileSync("/var/openfaas/secrets/db-password", "utf-8"),
            port: process.env["db_port"],
        })
    }

    const client = new Client()
    await client.connect()
    const res = await client.query(`CREATE TABLE drone-position (
    positionid        bigint primary key,
    name              text,
    location          point,
    temp_celsius      double presicion not null,
    created           timestamp with time zone default now()
);`)

    console.log(res.rows[0].message) // Hello world!
    await client.end()

    context.status(200).succeed("OK");
}
