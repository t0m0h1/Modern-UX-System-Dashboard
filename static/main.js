// =====================
// Global Chart Variables
// =====================
let charts = {
    cpu: null,
    ram: null,
    disk: null,
    gpu: null,
    battery: null
};

// Cache frequently used DOM elements
const batteryStatusEl = document.getElementById('batteryStatus');
const netSentEl = document.getElementById('netSent');
const netRecvEl = document.getElementById('netRecv');

// =====================
// Initialize Charts
// =====================
function initCharts() {
    // CPU (Bar chart per core)
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    charts.cpu = new Chart(cpuCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'CPU %', data: [], backgroundColor: 'rgba(75, 192, 192, 0.6)' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // RAM (Doughnut)
    const ramCtx = document.getElementById('ramChart').getContext('2d');
    charts.ram = new Chart(ramCtx, {
        type: 'doughnut',
        data: { labels: ['Used', 'Free'], datasets: [{ data: [0, 100], backgroundColor: ['#ff6384', '#36a2eb'] }] },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => context.dataIndex === 0 ? value + '%' : '',
                    font: { weight: 'bold', size: 16 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // Disk (Doughnut)
    const diskCtx = document.getElementById('diskChart').getContext('2d');
    charts.disk = new Chart(diskCtx, {
        type: 'doughnut',
        data: { labels: ['Used', 'Free'], datasets: [{ data: [0, 100], backgroundColor: ['#ff9f40', '#4bc0c0'] }] },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => context.dataIndex === 0 ? value + '%' : '',
                    font: { weight: 'bold', size: 16 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // GPU (Bar chart)
    const gpuCtx = document.getElementById('gpuChart').getContext('2d');
    charts.gpu = new Chart(gpuCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'GPU Load %', data: [], backgroundColor: 'rgba(153, 102, 255, 0.6)' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // Battery (Doughnut)
    const batteryCtx = document.getElementById('batteryChart').getContext('2d');
    charts.battery = new Chart(batteryCtx, {
        type: 'doughnut',
        data: { labels: ['Used', 'Remaining'], datasets: [{ data: [0, 100], backgroundColor: ['#ff6384', '#36a2eb'] }] },
        options: {
            responsive: true,
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, context) => context.dataIndex === 1 ? value + '%' : '',
                    font: { weight: 'bold', size: 16 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// =====================
// Fetch and Update Metrics
// =====================
async function updateMetrics() {
    try {
        const res = await fetch('/api/system');
        const data = await res.json();

        // --- CPU ---
        charts.cpu.data.labels = data.cpu.map((_, i) => 'Core ' + (i + 1));
        charts.cpu.data.datasets[0].data = data.cpu;
        charts.cpu.update();

        // --- RAM ---
        charts.ram.data.datasets[0].data = [data.ram, 100 - data.ram];
        charts.ram.update();

        // --- Disk ---
        charts.disk.data.datasets[0].data = [data.disk, 100 - data.disk];
        charts.disk.update();

        // --- GPU ---
        if (data.gpu.length > 0) {
            charts.gpu.data.labels = data.gpu.map(g => g.name);
            charts.gpu.data.datasets[0].data = data.gpu.map(g => g.load);
        } else {
            charts.gpu.data.labels = ['No GPU'];
            charts.gpu.data.datasets[0].data = [0];
        }
        charts.gpu.update();

        // --- Battery ---
        if (data.battery) {
            charts.battery.data.datasets[0].data = [100 - data.battery.percent, data.battery.percent];
            charts.battery.update();

            const status = data.battery.charging ? "Charging" : "Not Charging";
            let timeLeft = "";
            if (!data.battery.charging && data.battery.secsleft > 0) {
                const hrs = Math.floor(data.battery.secsleft / 3600);
                const mins = Math.floor((data.battery.secsleft % 3600) / 60);
                timeLeft = ` - ${hrs}h ${mins}m remaining`;
            }
            batteryStatusEl.innerText = `${data.battery.percent}% - ${status}${timeLeft}`;
        } else {
            batteryStatusEl.innerText = "No battery detected";
            charts.battery.data.datasets[0].data = [0, 0];
            charts.battery.update();
        }

        // --- Network ---
        netSentEl.innerText = data.network.sent;
        netRecvEl.innerText = data.network.recv;

    } catch (err) {
        console.error("Failed to fetch system metrics:", err);
    }
}

// =====================
// Initialize Dashboard
// =====================
function initDashboard() {
    initCharts();
    updateMetrics();
    setInterval(updateMetrics, 2000);
}

// Start dashboard
window.onload = initDashboard;
