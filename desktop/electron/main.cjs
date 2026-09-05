const { app, BrowserWindow } = require("electron");
const path = require("path");

const dev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

function createWindow() {
  const win = new BrowserWindow({
    title: "NEXA AI - Autonomous OS",
    width: 1600,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#070912",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Automatically grant microphone / media permissions
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === "media") return true;
    return true;
  });
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media") return callback(true);
    callback(true);
  });

  if (dev) {
    win.loadURL("http://127.0.0.1:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
