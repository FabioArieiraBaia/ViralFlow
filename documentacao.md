# 📘 Documentação Técnica - ViralFlow AI Pro

**Versão:** 2.1.0  
**Desenvolvedor:** Fábio Arieira  
**Stack:** React 19, TypeScript, Vite, Electron, Google GenAI SDK (@google/genai), TailwindCSS.

---

## 1. Visão Geral

O **ViralFlow AI Pro** é uma aplicação desktop (baseada em Electron) e web desenhada para automatizar a criação de vídeos virais (estilo "Dark Channel" ou "Faceless"). A aplicação orquestra todo o fluxo de produção:

1.  **Roteiro:** Geração de roteiros otimizados para retenção usando LLMs (Gemini 2.5 Flash).
2.  **Áudio (TTS):** Síntese de voz neural multi-falante usando o modelo nativo de áudio do Gemini.
3.  **Visual:** Geração de imagens via Gemini (Imagen 3 / Flash Image), Pollinations.ai (Flux/SD) ou busca de vídeos reais (Pexels).
4.  **Renderização:** Renderização em tempo real via HTML5 Canvas com suporte a efeitos de partículas, filtros de pós-processamento (VHS, Cyberpunk) e transições.
5.  **Exportação:** Gravação do canvas para vídeo (WebM) em resoluções HD (720p) e 4K (2160p).

---

## 2. Arquitetura do Sistema

A aplicação segue uma arquitetura **Client-Side Heavy**, onde todo o processamento lógico, gerenciamento de estado e renderização ocorre no cliente (Navegador/Electron). Não há backend próprio; a aplicação se comunica diretamente com as APIs de terceiros.

### Estrutura de Pastas

```
/
├── index.html              # Ponto de entrada (injetado pelo Vite)
├── index.tsx               # Bootstrapper do React
├── App.tsx                 # Componente Raiz / Orquestrador de Estado / UI Principal
├── types.ts                # Definições de Tipos TypeScript (Interfaces Globais)
├── electron-main.js        # Processo principal do Electron (Janela, Sistema de Arquivos)
├── services/
│   ├── geminiService.ts    # Núcleo da IA: Roteiro, Imagem, Texto, Rotação de Chaves API
│   ├── audioUtils.ts       # Processamento de Áudio (Web Audio API, Decode PCM, Wav Encoding)
│   ├── fileSystem.ts       # Abstração para salvar arquivos (Web vs Electron)
│   └── translations.ts     # Internacionalização (PT, EN, ES)
└── components/
    ├── VideoPlayer.tsx     # Engine de Renderização (Canvas + RequestAnimationFrame)
    ├── Modals.tsx          # Modais de UI (Boas-vindas, Upgrade, Editor de Cena)
    └── OnboardingTour.tsx  # Tutorial interativo
```

---

## 3. Configuração e Instalação

### Pré-requisitos
*   Node.js (v18 ou superior)
*   Chave de API do Google Gemini (Google AI Studio)
*   Chave de API do Pexels (Opcional, para vídeos reais)

### Comandos

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Rodar em modo Web (Desenvolvimento):**
    ```bash
    npm start
    ```

3.  **Rodar aplicação Desktop (Electron):**
    ```bash
    npm run electron
    ```

4.  **Gerar executável (.exe):**
    ```bash
    npm run dist
    ```

---

## 4. Módulos Principais

### 4.1. Serviço de IA (`geminiService.ts`)

Este é o "cérebro" da aplicação.

*   **Rotação de Chaves (Round Robin):** O sistema aceita múltiplas chaves de API do Google separadas por vírgula. A função `withRetry` alterna automaticamente entre as chaves em caso de erro de cota (429) ou a cada requisição, maximizando o throughput.
*   **Geração de Roteiro:** Utiliza `gemini-2.5-flash` com instruções de sistema estritas para forçar saídas em JSON puro, definindo tempos de corte, ângulos de câmera e falas.
*   **Geração de Voz:** Utiliza o endpoint `gemini-2.5-flash-preview-tts`. O áudio retornado é **PCM Raw** (sem cabeçalho WAV). O serviço decodifica esses bytes brutos para um `AudioBuffer` do navegador.

### 4.2. Engine de Renderização (`VideoPlayer.tsx`)

O coração visual da aplicação. Não utiliza bibliotecas de vídeo como Remotion ou FFMPEG no cliente; utiliza **Canvas API** pura para máxima performance em tempo real.

*   **Loop de Renderização:** Utiliza `requestAnimationFrame`.
*   **Sistema de Partículas:** Implementação manual de física para Neve, Chuva, Brasas, Confete e Poeira.
*   **Áudio Graph (Web Audio API):**
    *   Mixagem de Voz e Música de Fundo (Ducking/Crossfading).
    *   Compressor Dinâmico na saída master para evitar distorção ("clipping").
    *   Sincronização precisa entre o tempo do áudio da fala e a animação do canvas.
*   **Filtros e Pós-processamento:** Efeitos visuais (VHS, Glitch, Noir) aplicados via `ctx.filter` e manipulação de pixels/overlays.
*   **Exportação:** Utiliza a `MediaRecorder API` para capturar o `canvas.captureStream()` e o `destinationNode.stream` do áudio, combinando-os em um arquivo WebM VP9.

### 4.3. Gerenciamento de Estado (`App.tsx`)

*   Gerencia o fluxo do usuário (Abas: Criar, Preview, Metadados, Config).
*   Sistema de Licenciamento: Verifica chaves `VFPRO-` baseadas em um algoritmo de hash com Salt local para liberar recursos PRO (4K, Vozes extras, Sem marca d'água).

---

## 5. Integrações Externas

### Google Gemini API (`@google/genai`)
A biblioteca oficial é usada para todas as chamadas de IA.
*   **Modelos usados:**
    *   `gemini-2.5-flash`: Roteiro e Metadados.
    *   `gemini-2.5-flash-preview-tts`: Voz.
    *   `gemini-2.5-flash-image` / `imagen-3.0`: Imagens.

### Pollinations.ai
Usado como fallback ou alternativa gratuita para geração de imagens.
*   Implementa uma estratégia de **Proxy Reverso** (configurado no `vite.config.ts`) para evitar problemas de CORS durante o desenvolvimento local.

### Pexels API
Usada para buscar vídeos de stock reais (B-Roll) baseados nos prompts visuais gerados pelo roteiro.

---

## 6. Funcionalidades de UI/UX

*   **Temas:** Suporte nativo a Dark Mode e Light Mode (Tailwind `dark:` classes).
*   **Internacionalização (i18n):** Suporte a PT, EN, ES via dicionário de objetos (`translations.ts`).
*   **Drag & Drop:** Sistema customizado no Canvas para posicionar Logotipos e Overlays.

---

## 7. Solução de Problemas Comuns

1.  **Erro 429 (Quota Exceeded):**
    *   *Causa:* Limite da API gratuita do Google atingido.
    *   *Solução:* Adicionar mais chaves de API nas configurações separadas por vírgula.

2.  **Áudio não toca (Autoplay Policy):**
    *   *Causa:* Navegadores bloqueiam áudio sem interação do usuário.
    *   *Solução:* O app exige um clique inicial ("Gerar" ou "Play") para resumir o `AudioContext`.

3.  **Tela preta na exportação:**
    *   *Causa:* O `MediaRecorder` pode falhar se a aba perder o foco em alguns navegadores.
    *   *Solução:* Manter a aba ativa durante a renderização ou usar a versão Electron.

---

## 8. Licença

Este software é proprietário.
**Copyright © 2025 Fábio Arieira.**
