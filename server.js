import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3003;

// Используем WebSocketServer, а не WebSocket.Server
const wss = new WebSocketServer({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
});

function getMetrics() {
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

    return {
        cpuUsage: Number((cpuUsage * 100).toFixed(2)),
        memoryUsage: Number((memoryUsage * 100).toFixed(2)),
        timestamp: Date.now(),
    };
}

wss.on("connection", (ws) => {
    console.log("Client connected");

    const interval = setInterval(() => {
        ws.send(JSON.stringify(getMetrics()));
    }, 1000);

    ws.on("close", () => clearInterval(interval));
});