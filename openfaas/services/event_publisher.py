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

max=10
for x in range(0, max):
    print("Printing event {}".format(x))

    payload = json.dumps({"eventType": "test", "data": { "key": "value" } })
    ret = client.publish(os.getenv("EVENT_CHANNEL_KEY"), payload)
    print(ret)

    time.sleep(0.1)
