import { Scene, VideoMetadata } from "../types";
import { triggerBrowserDownload } from "./fileSystem";

// Gera o HTML do livro com base nas cenas
export const generateBookHtml = (title: string, scenes: Scene[], metadata?: VideoMetadata): string => {
  const chapterContent = scenes.map((scene, index) => {
    return `
      <div class="page">
        <div class="image-container">
           ${scene.imageUrl ? `<img src="${scene.imageUrl}" alt="Scene ${index + 1}" />` : '<div class="placeholder">Imagem não disponível</div>'}
        </div>
        <div class="text-container">
          <p>${scene.text}</p>
        </div>
        <div class="page-number">${index + 1}</div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Lato:wght@400;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      font-family: 'Merriweather', serif;
      background-color: #fdfbf7; /* Papel creme */
      color: #2c2c2c;
    }

    .book-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }

    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
      background: #1a1a1a;
      color: white;
      page-break-after: always;
    }

    .cover h1 {
      font-family: 'Lato', sans-serif;
      font-size: 3rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cover p {
      font-size: 1.2rem;
      color: #aaa;
    }

    .page {
      padding: 60px 40px;
      min-height: 100vh;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      page-break-after: always;
      position: relative;
    }

    .image-container {
      width: 100%;
      max-height: 50vh;
      overflow: hidden;
      margin-bottom: 30px;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .text-container {
      font-size: 1.1rem;
      line-height: 1.8;
      text-align: justify;
      max-width: 650px;
    }

    .text-container p {
      margin-bottom: 1.5em;
    }
    
    .page-number {
      position: absolute;
      bottom: 20px;
      font-family: 'Lato', sans-serif;
      font-size: 0.8rem;
      color: #888;
    }

    @media print {
      body { background: none; }
      .book-container { box-shadow: none; max-width: 100%; }
      .page { height: auto; min-height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="book-container">
    <div class="cover">
      <h1>${title}</h1>
      <p>Um visual book gerado por ViralFlow AI</p>
      ${metadata?.description ? `<p style="margin-top: 20px; font-size: 0.9rem; max-width: 500px;">${metadata.description}</p>` : ''}
    </div>
    ${chapterContent}
  </div>
</body>
</html>
  `;
};

export const downloadBook = (title: string, scenes: Scene[], metadata?: VideoMetadata) => {
  const html = generateBookHtml(title, scenes, metadata);
  const blob = new Blob([html], { type: 'text/html' });
  triggerBrowserDownload(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_book.html`);
};
