import paho.mqtt.publish as publish
import paho.mqtt.client as mqtt
import os, json, time

def on_publish(client, userdata, result):
    print("Point published\n")
    pass

client = mqtt.Client("127.0.0.1:8081", transport="websockets")

client.on_publish = on_publish
broker = "127.0.0.1"
port = 8081

client.connect(broker, port)

start_lat = 52.5740072
start_lon = -0.2399354
max = 15
for x in range(0, max):
    print("Printing point {}/{}".format(x, 15))
    lat = start_lat + x*0.0001
    lon = start_lon + (-x*0.0001)

    payload = json.dumps({"name": "Carpark-watch", "tempCelsius": 3.5, "location": {"lat": lat, "lon": lon}, "destination": {"lat": 52.5745216, "lon": -0.2498482}, "batteryPercent": 80})
    ret = client.publish(os.getenv("CHANNEL_KEY"), payload)
    print(ret)
    time.sleep(2)
