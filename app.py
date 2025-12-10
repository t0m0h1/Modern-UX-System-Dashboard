from flask import Flask, jsonify, render_template
import psutil
import GPUtil

# Note - the working interpreter is Python 3.12.1

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/system")
def system_metrics():
    cpu = psutil.cpu_percent(percpu=True)
    ram = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    net = psutil.net_io_counters()
    gpus = GPUtil.getGPUs()
    gpu_data = [{"name": g.name, "load": g.load*100, "memoryUsed": g.memoryUsed, "memoryTotal": g.memoryTotal} for g in gpus]

    # Battery info
    battery = psutil.sensors_battery()
    if battery:
        battery_data = {
            "percent": battery.percent,
            "charging": battery.power_plugged,
            "secsleft": battery.secsleft
        }
    else:
        battery_data = None  # Device has no battery

    return jsonify({
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "network": {"sent": net.bytes_sent, "recv": net.bytes_recv},
        "gpu": gpu_data,
        "battery": battery_data
    })


if __name__ == "__main__":
    app.run(debug=True)
