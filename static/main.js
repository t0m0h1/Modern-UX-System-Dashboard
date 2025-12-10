let cpuChart, ramChart, diskChart, gpuChart;

function createCharts() {
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'CPU', data: [], backgroundColor: 'rgba(75, 192, 192, 0.6)' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    const ramCtx = document.getElementById('ramChart').getContext('2d');
    ramChart = new Chart(ramCtx, {
        type: 'doughnut',
        data: { labels: ['Used', 'Free'], datasets: [{ data: [], backgroundColor: ['#ff6384', '#36a2eb'] }] },
        options: { responsive: true }
    });

    const diskCtx = document.getElementById('diskChart').getContext('2d');
    diskChart = new Chart(diskCtx, {
        type: 'doughnut',
        data: { labels: ['Used', 'Free'], datasets: [{ data: [], backgroundColor: ['#ff9f40', '#4bc0c0'] }] },
        options: { responsive: true }
    });

    const gpuCtx = document.getElementById('gpuChart').getContext('2d');
    gpuChart = new Chart(gpuCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'GPU Load (%)', data: [], backgroundColor: 'rgba(153, 102, 255, 0.6)' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });
}

async function fetchMetrics() {
    const res = await fetch('/api/system');
    const data = await res.json();

    // CPU
    cpuChart.data.labels = data.cpu.map((_, i) => 'Core ' + (i + 1));
    cpuChart.data.datasets[0].data = data.cpu;
    cpuChart.update();

    // RAM
    ramChart.data.datasets[0].data = [data.ram, 100 - data.ram];
    ramChart.update();

    // Disk
    diskChart.data.datasets[0].data = [data.disk, 100 - data.disk];
    diskChart.update();

    // GPU
    gpuChart.data.labels = data.gpu.map(g => g.name);
    gpuChart.data.datasets[0].data = data.gpu.map(g => g.load);
    gpuChart.update();

    // Network
    document.getElementById('netSent').innerText = data.network.sent;
    document.getElementById('netRecv').innerText = data.network.recv;
}

// Initialize
createCharts();
fetchMetrics();
setInterval(fetchMetrics, 2000);
