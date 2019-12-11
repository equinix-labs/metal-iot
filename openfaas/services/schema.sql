CREATE TABLE drone_position (
    id                INT GENERATED ALWAYS AS IDENTITY,
    name              text not null,
    location          point not null,
    temp_celsius      double precision not null,
    battery_mv        int not null,
    created           timestamp with time zone default now()
);
