from flask import Flask, jsonify, render_template
import psutil
import platform
import time
import GPUtil
import subprocess

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

    # ---------- CPU ----------
    cpu_per_core = psutil.cpu_percent(percpu=True)

    # CPU temperature
    cpu_temp = None
    try:
        temps = psutil.sensors_temperatures()
        if temps:
            # Try common CPU sensor keys in order
            for key in ("coretemp", "k10temp", "acpitz"):
                if key in temps and temps[key]:
                    cpu_temp = temps[key][0].current
                    break
        # macOS fallback using osx-cpu-temp
        if cpu_temp is None and platform.system() == "Darwin":
            try:
                output = subprocess.check_output(["osx-cpu-temp"])
                cpu_temp = output.decode().strip()
            except Exception:
                cpu_temp = None
    except Exception:
        cpu_temp = None


    # ---------- RAM ----------
    ram = psutil.virtual_memory().percent

    # ---------- Disk ----------
    disk = psutil.disk_usage("/").percent

    # ---------- Network ----------
    net = psutil.net_io_counters()
    current_time = time.time()
    time_diff = current_time - last_net["time"]
    upload_speed = (net.bytes_sent - last_net["sent"]) / max(time_diff, 0.001)
    download_speed = (net.bytes_recv - last_net["recv"]) / max(time_diff, 0.001)
    last_net = {"sent": net.bytes_sent, "recv": net.bytes_recv, "time": current_time}

    # ---------- GPU ----------
    gpu_data = []

    if platform.system() == "Darwin":  # Apple Silicon
        try:
            # Get GPU name & VRAM
            output = subprocess.check_output(["system_profiler", "SPDisplaysDataType"])
            output = output.decode()
            name_match = re.search(r"Chipset Model: (.+)", output)
            vram_match = re.search(r"VRAM \(Total\): (.+)", output)
            gpu_info = {
                "name": name_match.group(1) if name_match else "Apple GPU",
                "vram": vram_match.group(1) if vram_match else "Unknown",
                "load": None,
                "vram_used": None,
                "temp": None
            }

            # Optional GPU temperature using osx-cpu-temp if installed
            try:
                temp_output = subprocess.check_output(["osx-cpu-temp"])
                temp_str = temp_output.decode().strip()
                gpu_info["temp"] = temp_str
            except Exception:
                gpu_info["temp"] = None

            gpu_data.append(gpu_info)
        except Exception:
            gpu_data.append({
                "name": "Apple GPU",
                "vram": "Unknown",
                "load": None,
                "vram_used": None,
                "temp": None
            })
    else:  # Windows/Linux with NVIDIA/AMD
        gpus = GPUtil.getGPUs()
        for g in gpus:
            gpu_data.append({
                "name": g.name,
                "load": g.load * 100,
                "temp": g.temperature,
                "vram_used": g.memoryUsed,
                "vram_total": g.memoryTotal
            })

    # ---------- Battery ----------
    battery = psutil.sensors_battery()
    battery_data = None
    if battery:
        battery_data = {
            "percent": battery.percent,
            "charging": battery.power_plugged,
            "secsleft": battery.secsleft
        }

    # ---------- System Info ----------
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
