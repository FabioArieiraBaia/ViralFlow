
// WEB VERSION: Uses Browser Downloads API instead of Electron fs

export const getProjectDir = (projectName: string): string | null => {
  // On the web, we don't have real directories. 
  // We return a mock ID to maintain compatibility with the rest of the app logic.
  return "web-session-project";
};

export const saveBase64File = (projectDir: string, fileName: string, base64Data: string): string => {
  // In Web mode, we simply return the Data URL so the image/audio acts as a source.
  // We don't save to disk immediately.
  
  if (base64Data.startsWith('data:')) {
      return base64Data;
  }
  
  // Detect mime type based on extension/content (rough guess)
  let mime = 'application/octet-stream';
  if (fileName.endsWith('.png')) mime = 'image/png';
  if (fileName.endsWith('.jpg')) mime = 'image/jpeg';
  if (fileName.endsWith('.wav')) mime = 'audio/wav';
  if (fileName.endsWith('.mp3')) mime = 'audio/mpeg';

  return `data:${mime};base64,${base64Data}`;
};

export const saveTextFile = (projectDir: string, fileName: string, content: string) => {
  // Optional: Auto-download text files (like scripts) if needed, or just console log
  console.log(`[Virtual File] ${fileName}: saved in memory.`);
};

// Trigger a browser download for the final video or assets
export const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openProjectFolder = (projectDir: string) => {
  alert("No modo Web, os arquivos são baixados para sua pasta de Downloads padrão.");
};
