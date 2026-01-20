import {WebSocketServer} from "ws";
import os from "os";
import checkDiskSpace from "check-disk-space";

const PORT = process.env.PORT || 3003;

// Используем WebSocketServer, а не WebSocket.Server
const wss = new WebSocketServer({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
});

async function getMetrics() {
    const cpus = os.cpus();
    const cpuUsage =
        cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            return acc + (1 - idle / total);
        }, 0) / cpus.length;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = 1 - freeMem / totalMem;

    const diskPath = process.platform === "win32" ? "C:" : "/";
    const disk = await checkDiskSpace(diskPath);
    const diskUsed = disk.size - disk.free;
    const diskUsage = diskUsed / disk.size;

    return {
        cpuUsage: Number((cpuUsage * 100).toFixed(2)),
        memoryUsage: Number((memoryUsage * 100).toFixed(2)),
        diskUsage: Number((diskUsage * 100).toFixed(2)),
        timestamp: Date.now(),
    };
}

wss.on("connection", (ws) => {
    console.log("Client connected");

    const interval = setInterval(async () => {
        const metrics = await getMetrics();
        ws.send(JSON.stringify(metrics));
    }, 1000);

    ws.on("close", () => clearInterval(interval));
});