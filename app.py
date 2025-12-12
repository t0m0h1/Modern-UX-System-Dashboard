from flask import Flask, jsonify, render_template
import psutil, platform, time
import GPUtil

app = Flask(__name__)

# Track previous network values for speed calculation
last_net = {
    "sent": psutil.net_io_counters().bytes_sent,
    "recv": psutil.net_io_counters().bytes_recv,
    "time": time.time()
}

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/system")
def system_metrics():
    global last_net

    # CPU
    cpu_per_core = psutil.cpu_percent(percpu=True)
    cpu_temp = 0
    try:
        temps = psutil.sensors_temperatures()
        if "coretemp" in temps:
            cpu_temp = temps["coretemp"][0].current
    except:
        cpu_temp = None

    # RAM
    ram = psutil.virtual_memory().percent

    # Disk
    disk = psutil.disk_usage("/").percent

    # Network Bytes + Speeds
    net = psutil.net_io_counters()
    current_time = time.time()
    time_diff = current_time - last_net["time"]

    upload_speed = (net.bytes_sent - last_net["sent"]) / max(time_diff, 0.001)
    download_speed = (net.bytes_recv - last_net["recv"]) / max(time_diff, 0.001)

    last_net = {"sent": net.bytes_sent, "recv": net.bytes_recv, "time": current_time}

    # GPU
    gpus = GPUtil.getGPUs()
    gpu_data = []
    for g in gpus:
        gpu_data.append({
            "name": g.name,
            "load": g.load * 100,
            "temp": g.temperature,
            "vram_used": g.memoryUsed,
            "vram_total": g.memoryTotal
        })

    # Battery
    battery = psutil.sensors_battery()
    if battery:
        battery_data = {
            "percent": battery.percent,
            "charging": battery.power_plugged,
            "secsleft": battery.secsleft
        }
    else:
        battery_data = None

    # System Info
    boot_time = psutil.boot_time()
    uptime = int(time.time() - boot_time)

    sysinfo = {
        "os": platform.system(),
        "os_version": platform.version(),
        "machine": platform.machine(),
        "hostname": platform.node(),
        "uptime": uptime
    }

    return jsonify({
        "cpu": cpu_per_core,
        "cpu_temp": cpu_temp,
        "ram": ram,
        "disk": disk,
        "network": {
            "sent": net.bytes_sent,
            "recv": net.bytes_recv,
            "upload_speed": upload_speed,
            "download_speed": download_speed
        },
        "gpu": gpu_data,
        "battery": battery_data,
        "system": sysinfo
    })


if __name__ == "__main__":
    app.run(debug=True)
