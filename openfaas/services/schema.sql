-- drop table drone_event;
-- drop table drone_position;

-- Tables

CREATE TABLE drone_position (
    id                INT GENERATED ALWAYS AS IDENTITY,
    name              text not null,
    location          point not null,
    latitude          double precision not null,
    longitude         double precision not null,
    destination       point not null,
    temp_celsius      double precision not null,
    battery_percent   int not null,
    battery_drain     double precision not null,
    speed             int not null,
    bearing           double precision not null,
    altitude          double precision not null,
    payload_percent   int not null,
    status            text not null,
    created           timestamp with time zone default now()
);

CREATE TABLE drone_event (
    id                INT GENERATED ALWAYS AS IDENTITY,
    event_type        text not null,
    message           text not null,
    name              text not null,
    hangar            text not null,
    warehouse         text not null,
    battery_percent   int not null,
    battery_consumed  int not null,
    location          point not null,
    latitude          double precision not null,
    longitude         double precision not null,
    payload           int not null,
    created           timestamp with time zone default now()
);

-- Functions

-- drop function get_latest_positions;

CREATE or REPLACE FUNCTION get_latest_positions()
    RETURNS TABLE(id int, name text, location point, destination point, temp_celsius double precision, battery_percent int, created timestamp with time zone)
  AS
$$
BEGIN
RETURN QUERY SELECT tt.id,
                    tt.name,
                    tt.location,
                    tt.destination,
                    tt.temp_celsius,
                    tt.battery_percent,
                    tt.created
FROM drone_position tt
INNER JOIN
    (SELECT dt.name, MAX(dt.created) AS MaxDateTime
    FROM drone_position dt
    GROUP BY dt.name) groupedtt 
ON tt.name = groupedtt.name
AND tt.created = groupedtt.MaxDateTime;

END
$$  LANGUAGE 'plpgsql' VOLATILE;

-- select * from get_latest_positions();

