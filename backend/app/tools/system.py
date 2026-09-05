import os, platform, psutil
from app.tools.base import ToolResult
from app.security.permissions import Permission

class SystemStatusTool:
    name = "system_status"
    description = "Get CPU, RAM, disk, battery and network information."
    permission = Permission.SAFE

    def execute(self, **kwargs):
        disk = psutil.disk_usage(os.path.expanduser("~"))
        battery = psutil.sensors_battery()
        net = psutil.net_io_counters()
        data = {
            "cpu_percent": psutil.cpu_percent(interval=0.15),
            "ram_percent": psutil.virtual_memory().percent,
            "disk_free_gb": round(disk.free / (1024**3), 1),
            "battery_percent": None if battery is None else round(battery.percent),
            "platform": platform.platform(),
            "network_sent_mb": round(net.bytes_sent / (1024**2), 1),
            "network_recv_mb": round(net.bytes_recv / (1024**2), 1),
        }
        return ToolResult(True, "System status retrieved.", data)
