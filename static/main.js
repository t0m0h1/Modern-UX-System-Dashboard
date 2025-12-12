let charts = {
    cpu: null,
    ram: null,
    disk: null,
    gpu: null,
    battery: null,
    net: null
};

function setStatusBox(id, value) {
    const el = document.getElementById(id);
    el.className = "status-box";

    if (value < 60) el.classList.add("status-green");
    else if (value < 85) el.classList.add("status-amber");
    else el.classList.add("status-red");
}

function initCharts() {
    charts.cpu = new Chart(document.getElementById("cpuChart"), {
        type: "bar",
        data: { labels: [], datasets: [{ data: [], backgroundColor: "#49a6e9" }] },
        options: { scales: { y: { max: 100, beginAtZero: true } } }
    });

    charts.ram = new Chart(document.getElementById("ramChart"), {
        type: "doughnut",
        data: { datasets: [{ data: [0, 100] }] }
    });

    charts.disk = new Chart(document.getElementById("diskChart"), {
        type: "doughnut",
        data: { datasets: [{ data: [0, 100] }] }
    });

    charts.gpu = new Chart(document.getElementById("gpuChart"), {
        type: "bar",
        data: { labels: [], datasets: [{ data: [] }] },
        options: { scales: { y: { max: 100, beginAtZero: true } } }
    });

    charts.battery = new Chart(document.getElementById("batteryChart"), {
        type: "doughnut",
        data: { datasets: [{ data: [0, 100] }] }
    });

    charts.net = new Chart(document.getElementById("netChart"), {
        type: "line",
        data: { labels: [], datasets: [
            { label: "Upload KB/s", data: [], borderWidth: 1 },
            { label: "Download KB/s", data: [], borderWidth: 1 }
        ]},
        options: { scales: { y: { beginAtZero: true } } }
    });
}

async function updateAll() {
    const res = await fetch("/api/system");
    const data = await res.json();

    // System info
    document.getElementById("systemInfo").innerText =
        `${data.system.os} | ${data.system.hostname} | Uptime: ${Math.floor(data.system.uptime/3600)}h`;

    // CPU
    charts.cpu.data.labels = data.cpu.map((_, i) => `Core ${i+1}`);
    charts.cpu.data.datasets[0].data = data.cpu;
    charts.cpu.update();

    const cpu_max = Math.max(...data.cpu);
    setStatusBox("cpuStatus", cpu_max);
    document.getElementById("cpuTitle").innerText = `CPU Usage (${cpu_max}%)`;

    document.getElementById("cpuTemp").innerText = data.cpu_temp || "N/A";

    // RAM
    charts.ram.data.datasets[0].data = [data.ram, 100 - data.ram];
    charts.ram.update();
    setStatusBox("ramStatus", data.ram);
    document.getElementById("ramTitle").innerText = `RAM Usage (${data.ram}%)`;

    // Disk
    charts.disk.data.datasets[0].data = [data.disk, 100 - data.disk];
    charts.disk.update();
    setStatusBox("diskStatus", data.disk);
    document.getElementById("diskTitle").innerText = `Disk Usage (${data.disk}%)`;

    // GPU
    if (data.gpu.length) {
        charts.gpu.data.labels = data.gpu.map(g => g.name);
        charts.gpu.data.datasets[0].data = data.gpu.map(g => g.load);
        charts.gpu.update();

        const max_gpu = Math.max(...data.gpu.map(g => g.load));
        setStatusBox("gpuStatus", max_gpu);

        document.getElementById("gpuTemp").innerText =
            data.gpu[0].temp ? data.gpu[0].temp + "°C" : "N/A";

        document.getElementById("gpuVram").innerText =
            `${data.gpu[0].vram_used}MB / ${data.gpu[0].vram_total}MB`;
    }

    // Battery
    if (data.battery) {
        charts.battery.data.datasets[0].data =
            [100 - data.battery.percent, data.battery.percent];
        charts.battery.update();

        setStatusBox("batteryStatusBox", 100 - data.battery.percent);

        const status = data.battery.charging ? "Charging" : "Not Charging";
        document.getElementById("batteryStatus").innerText =
            `${data.battery.percent}% - ${status}`;
    }

    // Network
    const up = data.network.upload_speed / 1024;
    const down = data.network.download_speed / 1024;

    document.getElementById("uploadSpeed").innerText = `${up.toFixed(1)} KB/s`;
    document.getElementById("downloadSpeed").innerText = `${down.toFixed(1)} KB/s`;

    charts.net.data.labels.push("");
    charts.net.data.datasets[0].data.push(up);
    charts.net.data.datasets[1].data.push(down);

    if (charts.net.data.labels.length > 30) {
        charts.net.data.labels.shift();
        charts.net.data.datasets[0].data.shift();
        charts.net.data.datasets[1].data.shift();
    }

    charts.net.update();
}

window.onload = () => {
    initCharts();
    updateAll();
    setInterval(updateAll, 2000);
};
