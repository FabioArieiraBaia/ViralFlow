const { app, BrowserWindow } = require('electron');
const path = require('path');

// Garante que erros de caminho não matem o app silenciosamente
process.on('uncaughtException', (error) => {
  console.error('Erro não tratado no processo principal:', error);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Importante para carregar arquivos locais e base64
      backgroundThrottling: false
    },
    backgroundColor: '#09090b',
    title: "ViralFlow AI Desktop",
    autoHideMenuBar: true,
    // Tenta carregar o ícone. Se falhar (dev mode), ignora.
    icon: path.join(__dirname, 'build', 'favicon.ico')
  });

  // Lógica padrão e robusta para diferenciar Dev vs Prod
  if (!app.isPackaged) {
    // Modo Desenvolvimento
    console.log("Iniciando em modo DEV...");
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Modo Produção (.exe instalado)
    console.log("Iniciando em modo PROD...");
    
    // No Electron builder com asar: true, __dirname aponta para dentro do pacote asar
    // A pasta 'build' deve estar lá conforme configurado no "files" do package.json
    const indexPath = path.join(__dirname, 'build', 'index.html');
    
    win.loadFile(indexPath).catch(e => {
        console.error("ERRO CRÍTICO: Não foi possível carregar index.html em:", indexPath);
        console.error(e);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});