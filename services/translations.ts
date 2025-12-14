
import { Language } from "../types";

type Translations = {
    [key in Language]: {
        [key: string]: string;
    }
};

export const translations: Translations = {
    pt: {
        // === WELCOME & PRIVACY ===
        welcomeTitle: "Bem-vindo ao ViralFlow AI",
        privacyNote: "Privacidade Total:",
        privacyDesc: "Este aplicativo não coleta, armazena ou envia nenhuma informação pessoal para nossos servidores.",
        privacyLocal: "localmente no seu navegador",
        devBy: "Desenvolvido com 💜 por",
        understand: "Entendi, vamos criar!",
        
        // === UPGRADE MODAL ===
        upgradeTitle: "Desbloqueie o ViralFlow PRO",
        upgradeDesc: "Remova marcas d'água, crie vídeos longos ilimitados e acesse todas as vozes.",
        noWatermark: "Sem Marca D'água",
        durationLimit: "Duração de até 30 Minutos",
        buyLicense: "Comprar Licença Vitalícia (R$ 49)",
        pasteKey: "Cole sua chave VFPRO-...",
        activate: "Ativar",
        licenseActive: "🎉 Licença PRO Ativada com Sucesso!",
        invalidKey: "Chave inválida, expirada ou incorreta.",
        
        // === SCENE EDITOR MODAL ===
        editScene: "Editor de Cena",
        tabScript: "Roteiro",
        tabVisual: "Visual & VFX",
        tabAudio: "Áudio & Música",
        speaker: "Personagem / Falante",
        subtitleText: "Texto da Fala (Legenda)",
        voiceTTS: "Voz (TTS)",
        audioError: "Erro na Geração",
        audioSync: "Áudio Sincronizado",
        tryAgain: "Tentar Novamente",
        regenerateVoice: "Regenerar Voz",
        manualUpload: "Upload Manual (Img/Vídeo)",
        particlesVFX: "Efeitos de Partículas (VFX)",
        regenerateMedia: "Regenerar Mídia",
        generate: "Gerar",
        visualPrompt: "Prompt visual...",
        sceneSoundtrack: "Trilha Sonora da Cena",
        behavior: "Comportamento",
        chooseTrack: "Escolher Faixa",
        musicVolume: "Volume da Música",
        saveChanges: "Salvar Alterações",
        cancel: "Cancelar",
        
        // === CREATE TAB - HERO ===
        whatCreate: "O que vamos criar hoje?",
        appDesc: "O ViralFlow orquestra roteiro, voz e vídeo automaticamente.",
        heroTagline: "Crie vídeos virais com IA em minutos",
        heroSubtitle: "De uma ideia ao vídeo pronto. Automatizado.",
        
        // === CREATE TAB - QUICK ACTIONS ===
        loadJson: "Carregar JSON",
        createWithAI: "Criar com IA",
        createWithAIDesc: "Automático: Roteiro, Voz e Vídeo.",
        manualEditor: "Editor Manual",
        manualEditorDesc: "Comece do zero, cena a cena.",
        importProject: "Importar",
        importProjectDesc: "Carregar projeto .json existente.",
        
        // === CREATE TAB - FORM ===
        videoTopic: "Tópico do Vídeo",
        topicPlaceholder: "Ex: A História Secreta do Café...",
        visualStyle: "Estilo Visual",
        pacing: "Ritmo / Edição",
        format: "Formato",
        duration: "Duração",
        channelName: "Nome do Canal",
        narrator: "Voz / Narrador",
        imageProvider: "Provedor de Imagem",
        quota: "Cota",
        generateVideo: "GERAR VÍDEO VIRAL",
        generating: "GERANDO",
        generateMovie: "GERAR FILME (PRO)",
        
        // === CREATE TAB - TTS SETTINGS ===
        advancedVoiceSettings: "Configurações de Voz Avançadas (TTS)",
        ttsModel: "Modelo TTS",
        ttsModelFast: "Gemini 2.5 Flash (Rápido)",
        ttsModelQuality: "Gemini 2.5 Pro (Qualidade Máxima)",
        globalSpeechStyle: "Estilo de Fala Global",
        speechStylePlaceholder: "Ex: Como um repórter animado com sotaque mineiro...",
        autoCast: "🤖 Elenco Automático",
        customVoice: "✏️ Personalizada (Outra)...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Modelos Pollinations",
        generationModel: "Modelo de Geração",
        imageModelsPublic: "Modelos de Imagem (Público)",
        videoModelsNote: "Nota: Modelos de vídeo estão disponíveis apenas na edição manual de cenas (para usuários PRO).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Criando Roteiro & Vozes",
        respectingApiLimit: "Respeitando limite de API (1s delay)...",
        audiosGenerated: "Áudios Gerados!",
        scriptVoicesReady: "O roteiro e as vozes estão prontos. Você pode salvar o projeto agora (backup) ou continuar para gerar as imagens.",
        generateImages: "Gerar Imagens (Cena 1 em diante)",
        saveProjectBackup: "Salvar Projeto JSON (Backup)",
        generatingVisuals: "Gerando Visuais",
        renderingScenesDelay: "Renderizando cenas sequencialmente (2s delay)...",
        orText: "ou",
        loadScriptJson: "Carregar Roteiro (JSON)",
        
        // === SETTINGS TAB ===
        settings: "Configurações",
        keysTitle: "Chaves API Gemini (Google)",
        keysDesc: "Adicione múltiplas chaves separadas por vírgula para rotação automática.",
        activeKeys: "chaves ativas",
        getKey: "Obter chave no Google AI Studio",
        pexelsTitle: "Chave Pexels (Stock Video)",
        pexelsDesc: "Necessária apenas se você usar o provedor \"Stock Video\".",
        pollinationsTitle: "Chave/Token Pollinations.ai",
        pollinationsDesc: "Chave opcional (plln_sk_...) para acessar modelos PRO/Secretos.",
        localSecurity: "Segurança Local",
        localSecDesc: "Suas chaves são salvas apenas no LocalStorage do seu navegador.",
        
        // === EDITOR TAB ===
        recExport: "REC / Exportar",
        showSub: "Exibir Legendas",
        timeline: "Timeline",
        viewMeta: "Ver Metadados",
        noScenesAvailable: "Nenhuma cena disponível. Crie ou importe um projeto.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Editar Personagens em Massa",
        nameAllScenes: "Nome (Todas as Cenas)",
        assignedVoice: "Voz Atribuída",
        applyChanges: "Aplicar Mudanças",
        castUpdated: "Elenco atualizado! (Regenere o áudio se mudou a voz)",
        castNote: "Nota: Mudar o nome não afeta áudio. Mudar a voz requer \"Regenerar Tudo\".",
        
        // === EDITOR TAB - VISUAL ===
        screenFormat: "Formato de Tela",
        vertical: "Vertical",
        horizontal: "Horizontal",
        globalFilter: "Filtro Global",
        defaultTransition: "Transição Padrão",
        globalSubtitles: "Legendas Globais",
        fontSize: "Tamanho Fonte",
        verticalPosition: "Posição Vertical",
        fontFamily: "Família da Fonte",
        globalVfx: "Global VFX (Efeitos de Filme)",
        vignette: "Vinheta (Borda Escura)",
        filmGrain: "Granulação de Filme (Film Grain)",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Adicionar Música à Playlist",
        mp3WavMultiple: "MP3 ou WAV (Múltiplos arquivos)",
        playlist: "Playlist",
        track: "Faixa",
        overallVolume: "Volume Geral",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Alterar Logo",
        uploadChannelLogo: "Upload Logo do Canal",
        positionX: "Posição X",
        positionY: "Posição Y",
        sizeScale: "Tamanho (Escala)",
        removeLogo: "Remover Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Revisor Final de Qualidade",
        totalScenes: "Total de Cenas",
        estimatedDuration: "Duração Estimada",
        audioStatus: "Status do Áudio",
        visualStatus: "Status Visual",
        complete: "Completo",
        missing: "faltando",
        exportHD: "Exportar HD (720p)",
        export4k: "Exportar 4K (PRO)",
        export4kUltra: "Exportar 4K Ultra HD",
        saveProjectJson: "Salvar Projeto (JSON)",
        regenerateAll: "Regenerar Tudo",
        start: "Iniciar",
        scenes: "Cenas",
        deselectAll: "Desmarcar Todos",
        selectAll: "Selecionar Todos",
        reImagine: "Re-Imaginar",
        reDub: "Re-Dublar",
        generatingVoice: "Gerando voz...",
        audioOk: "Áudio OK",
        noAudio: "Sem Áudio",
        errorAudio: "Erro Áudio",
        layers: "Camadas",
        addNewScene: "Adicionar Nova Cena",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Aprovação do Roteiro",
        reviewSceneText: "Revise o texto de cada cena acima. Você pode editar clicando no ícone de lápis.",
        chooseGenerationOrder: "Escolha a ordem de geração:",
        audioFirst: "Áudio Primeiro",
        imagesFirst: "Imagens Primeiro",
        
        // === METADATA TAB ===
        seoOptimized: "SEO Otimizado",
        title: "Título",
        description: "Descrição",
        tags: "Tags",
        suggestedThumbs: "Thumbnails Sugeridas",
        regenerateThumbs: "Regenerar Thumbnails",
        
        // === HEADER / TABS ===
        tabCreate: "Criar",
        tabEditor: "Editor",
        tabMeta: "Metadados",
        tabConfig: "Config",
        licenseActiveBtn: "Licença Ativa",
        upgradeBtn: "Upgrade PRO",
        free: "FREE",
        pro: "PRO",
        
        // === PROGRESS MESSAGES ===
        initializing: "🚀 Inicializando motores criativos...",
        writingScript: "📝 Escrevendo roteiro com Gemini 2.5...",
        producingScene: "🎬 Produzindo Cena",
        renderComplete: "✅ Renderização Completa! Gerando Capas e Metadados...",
        errorGen: "Erro na geração:",
        fatalError: "❌ Erro fatal.",
        cancelGen: "🛑 Geração cancelada.",
        pleaseConfig: "Por favor, configure suas chaves Gemini na aba Configurações.",
        pleasePexels: "Para usar Stock Video, configure a chave Pexels em Configurações.",
        loadingVideo: "Estamos criando seu vídeo...",
        loadingDesc: "O Gemini está escrevendo o roteiro e preparando as cenas.",
        noScenesYet: "Nenhum vídeo gerado ainda.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Arquivo Personalizado (Upload)",
        uploadAudioTip: "Clique para carregar música ou efeito (.mp3, .wav)",
        fileUploaded: "Arquivo carregado",
        copyrightWarning: "Aviso de Direitos Autorais",
        copyrightBody: "Por favor, respeite os direitos autorais. Utilize apenas músicas e efeitos sonoros que você possui os direitos ou que sejam Royalty Free / Domínio Público. A plataforma não se responsabiliza por uso indevido.",
        
        // === PRO FEATURES ===
        onlyPro: "Apenas Membros PRO",
        branding: "Branding / Logo",
        uploadLogo: "Upload Logo (Canal)",
        sceneOverlay: "Overlay / Imagem Extra",
        dragToMove: "Arraste para mover, Scroll para redimensionar",
        resetPos: "Resetar Posição",
        
        // === TRANSITIONS ===
        transitions: "Transições (VFX)",
        transitionType: "Tipo de Transição",
        globalTrans: "Transição Global",
        sceneTrans: "Transição desta Cena",
        autoTrans: "🤖 IA Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Idioma do Vídeo (Conteúdo)",
        pollinationsModel: "Modelo (Pollinations)",
        selectModel: "Selecione...",
        originDomain: "Domínio de Origem (Pollinations)",
        originDesc: "Copie este endereço e cole no painel do Pollinations (Referrer) para autorizar o uso.",
        copy: "Copiar",
        copied: "Copiado!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Apenas Roteiro (Sem Imagem)",
        providerNoneSub: "Rápido / Placeholder / Manual",
        showSpeaker: "Exibir Nome do Personagem",
        speakerStyle: "Estilo da Tag",
        
        // === TOUR ===
        tutorial: "Tutorial",
        next: "Próximo",
        finish: "Concluir",
        dontShowAgain: "Não mostrar novamente",
        tourWelcome: "Bem-vindo ao Tour!",
        
        // === VIDEO TRIMMER ===
        videoPreprocessing: "Pré-processamento de Vídeo",
        startTime: "Início",
        endTime: "Fim",
        saveCut: "Salvar Corte",
        
        // === THEMES ===
        theme: "Tema",
        themeDark: "Escuro",
        themeClean: "Limpo",
        themeCreator: "Criador",
        
        // === INTENSITY ===
        visualIntensity: "Intensidade Visual",
        
        // === MISC ===
        regenerateImage: "Regenerar Imagem",
        editSceneBtn: "Editar Cena",
        
        // === FONTS ===
        fontInter: "Inter (Padrão)",
        fontMontserrat: "Montserrat (Moderno)",
        fontOswald: "Oswald (Impacto/Bold)",
        fontPlayfair: "Playfair (Clássico/Serifa)",
        fontJetBrains: "JetBrains Mono (Tech/Code)",
        fontComic: "Comic Neue (Quadrinhos)"
    },
    en: {
        // === WELCOME & PRIVACY ===
        welcomeTitle: "Welcome to ViralFlow AI",
        privacyNote: "Total Privacy:",
        privacyDesc: "This app does not collect, store, or send any personal information to our servers.",
        privacyLocal: "locally in your browser",
        devBy: "Developed with 💜 by",
        understand: "Got it, let's create!",
        
        // === UPGRADE MODAL ===
        upgradeTitle: "Unlock ViralFlow PRO",
        upgradeDesc: "Remove watermarks, create unlimited long videos, and access all voices.",
        noWatermark: "No Watermark",
        durationLimit: "Duration up to 30 Minutes",
        buyLicense: "Buy Lifetime License ($49)",
        pasteKey: "Paste your key VFPRO-...",
        activate: "Activate",
        licenseActive: "🎉 PRO License Activated Successfully!",
        invalidKey: "Invalid, expired, or incorrect key.",
        
        // === SCENE EDITOR MODAL ===
        editScene: "Scene Editor",
        tabScript: "Script",
        tabVisual: "Visual & VFX",
        tabAudio: "Audio & Music",
        speaker: "Character / Speaker",
        subtitleText: "Speech Text (Subtitle)",
        voiceTTS: "Voice (TTS)",
        audioError: "Generation Error",
        audioSync: "Audio Synced",
        tryAgain: "Try Again",
        regenerateVoice: "Regenerate Voice",
        manualUpload: "Manual Upload (Img/Video)",
        particlesVFX: "Particle Effects (VFX)",
        regenerateMedia: "Regenerate Media",
        generate: "Generate",
        visualPrompt: "Visual prompt...",
        sceneSoundtrack: "Scene Soundtrack",
        behavior: "Behavior",
        chooseTrack: "Choose Track",
        musicVolume: "Music Volume",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        
        // === CREATE TAB - HERO ===
        whatCreate: "What are we creating today?",
        appDesc: "ViralFlow orchestrates script, voice, and video automatically.",
        heroTagline: "Create viral videos with AI in minutes",
        heroSubtitle: "From an idea to finished video. Automated.",
        
        // === CREATE TAB - QUICK ACTIONS ===
        loadJson: "Load JSON",
        createWithAI: "Create with AI",
        createWithAIDesc: "Automatic: Script, Voice, and Video.",
        manualEditor: "Manual Editor",
        manualEditorDesc: "Start from scratch, scene by scene.",
        importProject: "Import",
        importProjectDesc: "Load existing .json project.",
        
        // === CREATE TAB - FORM ===
        videoTopic: "Video Topic",
        topicPlaceholder: "Ex: The Secret History of Coffee...",
        visualStyle: "Visual Style",
        pacing: "Pacing / Editing",
        format: "Format",
        duration: "Duration",
        channelName: "Channel Name",
        narrator: "Voice / Narrator",
        imageProvider: "Image Provider",
        quota: "Quota",
        generateVideo: "GENERATE VIRAL VIDEO",
        generating: "GENERATING",
        generateMovie: "GENERATE MOVIE (PRO)",
        
        // === CREATE TAB - TTS SETTINGS ===
        advancedVoiceSettings: "Advanced Voice Settings (TTS)",
        ttsModel: "TTS Model",
        ttsModelFast: "Gemini 2.5 Flash (Fast)",
        ttsModelQuality: "Gemini 2.5 Pro (Max Quality)",
        globalSpeechStyle: "Global Speech Style",
        speechStylePlaceholder: "Ex: Like an excited reporter with Southern accent...",
        autoCast: "🤖 Auto Cast",
        customVoice: "✏️ Custom (Other)...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Pollinations Models",
        generationModel: "Generation Model",
        imageModelsPublic: "Image Models (Public)",
        videoModelsNote: "Note: Video models are only available in manual scene editing (for PRO users).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Creating Script & Voices",
        respectingApiLimit: "Respecting API limit (1s delay)...",
        audiosGenerated: "Audios Generated!",
        scriptVoicesReady: "Script and voices are ready. You can save the project now (backup) or continue to generate images.",
        generateImages: "Generate Images (Scene 1 onwards)",
        saveProjectBackup: "Save Project JSON (Backup)",
        generatingVisuals: "Generating Visuals",
        renderingScenesDelay: "Rendering scenes sequentially (2s delay)...",
        orText: "or",
        loadScriptJson: "Load Script (JSON)",
        
        // === SETTINGS TAB ===
        settings: "Settings",
        keysTitle: "Gemini API Keys (Google)",
        keysDesc: "Add multiple keys separated by commas for automatic rotation.",
        activeKeys: "active keys",
        getKey: "Get key at Google AI Studio",
        pexelsTitle: "Pexels Key (Stock Video)",
        pexelsDesc: "Required only if you use the \"Stock Video\" provider.",
        pollinationsTitle: "Pollinations.ai Key/Token",
        pollinationsDesc: "Optional key (plln_sk_...) to access PRO/Secret models.",
        localSecurity: "Local Security",
        localSecDesc: "Your keys are saved only in your browser's LocalStorage.",
        
        // === EDITOR TAB ===
        recExport: "REC / Export",
        showSub: "Show Subtitles",
        timeline: "Timeline",
        viewMeta: "View Metadata",
        noScenesAvailable: "No scenes available. Create or import a project.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Edit Characters in Bulk",
        nameAllScenes: "Name (All Scenes)",
        assignedVoice: "Assigned Voice",
        applyChanges: "Apply Changes",
        castUpdated: "Cast updated! (Regenerate audio if voice changed)",
        castNote: "Note: Changing name doesn't affect audio. Changing voice requires \"Regenerate All\".",
        
        // === EDITOR TAB - VISUAL ===
        screenFormat: "Screen Format",
        vertical: "Vertical",
        horizontal: "Horizontal",
        globalFilter: "Global Filter",
        defaultTransition: "Default Transition",
        globalSubtitles: "Global Subtitles",
        fontSize: "Font Size",
        verticalPosition: "Vertical Position",
        fontFamily: "Font Family",
        globalVfx: "Global VFX (Film Effects)",
        vignette: "Vignette (Dark Border)",
        filmGrain: "Film Grain",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Add Music to Playlist",
        mp3WavMultiple: "MP3 or WAV (Multiple files)",
        playlist: "Playlist",
        track: "Track",
        overallVolume: "Overall Volume",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Change Logo",
        uploadChannelLogo: "Upload Channel Logo",
        positionX: "Position X",
        positionY: "Position Y",
        sizeScale: "Size (Scale)",
        removeLogo: "Remove Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Final Quality Reviewer",
        totalScenes: "Total Scenes",
        estimatedDuration: "Estimated Duration",
        audioStatus: "Audio Status",
        visualStatus: "Visual Status",
        complete: "Complete",
        missing: "missing",
        exportHD: "Export HD (720p)",
        export4k: "Export 4K (PRO)",
        export4kUltra: "Export 4K Ultra HD",
        saveProjectJson: "Save Project (JSON)",
        regenerateAll: "Regenerate All",
        start: "Start",
        scenes: "Scenes",
        deselectAll: "Deselect All",
        selectAll: "Select All",
        reImagine: "Re-Imagine",
        reDub: "Re-Dub",
        generatingVoice: "Generating voice...",
        audioOk: "Audio OK",
        noAudio: "No Audio",
        errorAudio: "Audio Error",
        layers: "Layers",
        addNewScene: "Add New Scene",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Script Approval",
        reviewSceneText: "Review the text of each scene above. You can edit by clicking the pencil icon.",
        chooseGenerationOrder: "Choose generation order:",
        audioFirst: "Audio First",
        imagesFirst: "Images First",
        
        // === METADATA TAB ===
        seoOptimized: "SEO Optimized",
        title: "Title",
        description: "Description",
        tags: "Tags",
        suggestedThumbs: "Suggested Thumbnails",
        regenerateThumbs: "Regenerate Thumbnails",
        
        // === HEADER / TABS ===
        tabCreate: "Create",
        tabEditor: "Editor",
        tabMeta: "Metadata",
        tabConfig: "Config",
        licenseActiveBtn: "License Active",
        upgradeBtn: "Upgrade PRO",
        free: "FREE",
        pro: "PRO",
        
        // === PROGRESS MESSAGES ===
        initializing: "🚀 Initializing creative engines...",
        writingScript: "📝 Writing script with Gemini 2.5...",
        producingScene: "🎬 Producing Scene",
        renderComplete: "✅ Render Complete! Generating Thumbs & Metadata...",
        errorGen: "Generation Error:",
        fatalError: "❌ Fatal Error.",
        cancelGen: "🛑 Generation Cancelled.",
        pleaseConfig: "Please configure your Gemini keys in the Settings tab.",
        pleasePexels: "To use Stock Video, configure Pexels key in Settings.",
        loadingVideo: "Creating your video...",
        loadingDesc: "Gemini is writing the script and preparing scenes.",
        noScenesYet: "No video generated yet.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Custom File (Upload)",
        uploadAudioTip: "Click to upload music or effect (.mp3, .wav)",
        fileUploaded: "File loaded",
        copyrightWarning: "Copyright Warning",
        copyrightBody: "Please respect copyright laws. Only use music and sound effects that you own the rights to or that are Royalty Free / Public Domain. The platform is not responsible for misuse.",
        
        // === PRO FEATURES ===
        onlyPro: "PRO Members Only",
        branding: "Branding / Logo",
        uploadLogo: "Upload Logo (Channel)",
        sceneOverlay: "Overlay / Extra Image",
        dragToMove: "Drag to move, Scroll to resize",
        resetPos: "Reset Position",
        
        // === TRANSITIONS ===
        transitions: "Transitions (VFX)",
        transitionType: "Transition Type",
        globalTrans: "Global Transition",
        sceneTrans: "Scene Transition",
        autoTrans: "🤖 AI Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Video Language (Content)",
        pollinationsModel: "Model (Pollinations)",
        selectModel: "Select...",
        originDomain: "Origin Domain (Pollinations)",
        originDesc: "Copy this address and paste it into the Pollinations dashboard (Referrer) to authorize usage.",
        copy: "Copy",
        copied: "Copied!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Script & Audio Only",
        providerNoneSub: "Fast / Placeholder / Manual",
        showSpeaker: "Show Speaker Name",
        speakerStyle: "Tag Style",
        
        // === TOUR ===
        tutorial: "Tutorial",
        next: "Next",
        finish: "Finish",
        dontShowAgain: "Don't show again",
        tourWelcome: "Welcome to the Tour!",
        
        // === VIDEO TRIMMER ===
        videoPreprocessing: "Video Pre-processing",
        startTime: "Start",
        endTime: "End",
        saveCut: "Save Cut",
        
        // === THEMES ===
        theme: "Theme",
        themeDark: "Dark",
        themeClean: "Clean",
        themeCreator: "Creator",
        
        // === INTENSITY ===
        visualIntensity: "Visual Intensity",
        
        // === MISC ===
        regenerateImage: "Regenerate Image",
        editSceneBtn: "Edit Scene",
        
        // === FONTS ===
        fontInter: "Inter (Default)",
        fontMontserrat: "Montserrat (Modern)",
        fontOswald: "Oswald (Impact/Bold)",
        fontPlayfair: "Playfair (Classic/Serif)",
        fontJetBrains: "JetBrains Mono (Tech/Code)",
        fontComic: "Comic Neue (Comics)"
    },
    es: {
        // === WELCOME & PRIVACY ===
        welcomeTitle: "Bienvenido a ViralFlow AI",
        privacyNote: "Privacidad Total:",
        privacyDesc: "Esta aplicación no recopila, almacena ni envía información personal a nuestros servidores.",
        privacyLocal: "localmente en tu navegador",
        devBy: "Desarrollado con 💜 por",
        understand: "¡Entendido, a crear!",
        
        // === UPGRADE MODAL ===
        upgradeTitle: "Desbloquear ViralFlow PRO",
        upgradeDesc: "Elimina marcas de agua, crea videos ilimitados y accede a todas las voces.",
        noWatermark: "Sin Marca de Agua",
        durationLimit: "Duración hasta 30 Minutos",
        buyLicense: "Comprar Licencia Vitalicia ($49)",
        pasteKey: "Pega tu clave VFPRO-...",
        activate: "Activar",
        licenseActive: "🎉 ¡Licencia PRO Activada!",
        invalidKey: "Clave inválida, expirada o incorrecta.",
        
        // === SCENE EDITOR MODAL ===
        editScene: "Editor de Escena",
        tabScript: "Guion",
        tabVisual: "Visual & VFX",
        tabAudio: "Audio & Música",
        speaker: "Personaje / Hablante",
        subtitleText: "Texto (Subtítulos)",
        voiceTTS: "Voz (TTS)",
        audioError: "Error de Generación",
        audioSync: "Audio Sincronizado",
        tryAgain: "Intentar de Nuevo",
        regenerateVoice: "Regenerar Voz",
        manualUpload: "Subida Manual (Img/Video)",
        particlesVFX: "Efectos de Partículas (VFX)",
        regenerateMedia: "Regenerar Multimedia",
        generate: "Generar",
        visualPrompt: "Prompt visual...",
        sceneSoundtrack: "Banda Sonora de Escena",
        behavior: "Comportamiento",
        chooseTrack: "Elegir Pista",
        musicVolume: "Volumen de Música",
        saveChanges: "Guardar Cambios",
        cancel: "Cancelar",
        
        // === CREATE TAB - HERO ===
        whatCreate: "¿Qué vamos a crear hoy?",
        appDesc: "ViralFlow orquesta guion, voz y video automáticamente.",
        heroTagline: "Crea videos virales con IA en minutos",
        heroSubtitle: "De una idea al video terminado. Automatizado.",
        
        // === CREATE TAB - QUICK ACTIONS ===
        loadJson: "Cargar JSON",
        createWithAI: "Crear con IA",
        createWithAIDesc: "Automático: Guion, Voz y Video.",
        manualEditor: "Editor Manual",
        manualEditorDesc: "Empieza desde cero, escena por escena.",
        importProject: "Importar",
        importProjectDesc: "Cargar proyecto .json existente.",
        
        // === CREATE TAB - FORM ===
        videoTopic: "Tema del Video",
        topicPlaceholder: "Ej: La Historia Secreta del Café...",
        visualStyle: "Estilo Visual",
        pacing: "Ritmo / Edición",
        format: "Formato",
        duration: "Duración",
        channelName: "Nombre del Canal",
        narrator: "Voz / Narrador",
        imageProvider: "Proveedor de Imagen",
        quota: "Cuota",
        generateVideo: "GENERAR VIDEO VIRAL",
        generating: "GENERANDO",
        generateMovie: "GENERAR PELÍCULA (PRO)",
        
        // === CREATE TAB - TTS SETTINGS ===
        advancedVoiceSettings: "Configuración de Voz Avanzada (TTS)",
        ttsModel: "Modelo TTS",
        ttsModelFast: "Gemini 2.5 Flash (Rápido)",
        ttsModelQuality: "Gemini 2.5 Pro (Máxima Calidad)",
        globalSpeechStyle: "Estilo de Habla Global",
        speechStylePlaceholder: "Ej: Como un reportero animado con acento...",
        autoCast: "🤖 Elenco Automático",
        customVoice: "✏️ Personalizada (Otra)...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Modelos Pollinations",
        generationModel: "Modelo de Generación",
        imageModelsPublic: "Modelos de Imagen (Público)",
        videoModelsNote: "Nota: Los modelos de video solo están disponibles en la edición manual de escenas (para usuarios PRO).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Creando Guion y Voces",
        respectingApiLimit: "Respetando límite de API (1s delay)...",
        audiosGenerated: "¡Audios Generados!",
        scriptVoicesReady: "El guion y las voces están listos. Puedes guardar el proyecto ahora (backup) o continuar para generar imágenes.",
        generateImages: "Generar Imágenes (Escena 1 en adelante)",
        saveProjectBackup: "Guardar Proyecto JSON (Backup)",
        generatingVisuals: "Generando Visuales",
        renderingScenesDelay: "Renderizando escenas secuencialmente (2s delay)...",
        orText: "o",
        loadScriptJson: "Cargar Guion (JSON)",
        
        // === SETTINGS TAB ===
        settings: "Configuración",
        keysTitle: "Claves API Gemini (Google)",
        keysDesc: "Añade múltiples claves separadas por comas para rotación automática.",
        activeKeys: "claves activas",
        getKey: "Obtener clave en Google AI Studio",
        pexelsTitle: "Clave Pexels (Stock Video)",
        pexelsDesc: "Requerida solo si usas el proveedor \"Stock Video\".",
        pollinationsTitle: "Clave/Token Pollinations.ai",
        pollinationsDesc: "Clave opcional (plln_sk_...) para acceder a modelos PRO/Secretos.",
        localSecurity: "Seguridad Local",
        localSecDesc: "Tus claves se guardan solo en el LocalStorage de tu navegador.",
        
        // === EDITOR TAB ===
        recExport: "REC / Exportar",
        showSub: "Mostrar Subtítulos",
        timeline: "Línea de Tiempo",
        viewMeta: "Ver Metadatos",
        noScenesAvailable: "No hay escenas disponibles. Crea o importa un proyecto.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Editar Personajes en Masa",
        nameAllScenes: "Nombre (Todas las Escenas)",
        assignedVoice: "Voz Asignada",
        applyChanges: "Aplicar Cambios",
        castUpdated: "¡Elenco actualizado! (Regenera el audio si cambió la voz)",
        castNote: "Nota: Cambiar el nombre no afecta el audio. Cambiar la voz requiere \"Regenerar Todo\".",
        
        // === EDITOR TAB - VISUAL ===
        screenFormat: "Formato de Pantalla",
        vertical: "Vertical",
        horizontal: "Horizontal",
        globalFilter: "Filtro Global",
        defaultTransition: "Transición por Defecto",
        globalSubtitles: "Subtítulos Globales",
        fontSize: "Tamaño de Fuente",
        verticalPosition: "Posición Vertical",
        fontFamily: "Familia de Fuente",
        globalVfx: "VFX Global (Efectos de Película)",
        vignette: "Viñeta (Borde Oscuro)",
        filmGrain: "Grano de Película",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Añadir Música a la Playlist",
        mp3WavMultiple: "MP3 o WAV (Múltiples archivos)",
        playlist: "Playlist",
        track: "Pista",
        overallVolume: "Volumen General",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Cambiar Logo",
        uploadChannelLogo: "Subir Logo del Canal",
        positionX: "Posición X",
        positionY: "Posición Y",
        sizeScale: "Tamaño (Escala)",
        removeLogo: "Eliminar Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Revisor de Calidad Final",
        totalScenes: "Total de Escenas",
        estimatedDuration: "Duración Estimada",
        audioStatus: "Estado del Audio",
        visualStatus: "Estado Visual",
        complete: "Completo",
        missing: "faltante",
        exportHD: "Exportar HD (720p)",
        export4k: "Exportar 4K (PRO)",
        export4kUltra: "Exportar 4K Ultra HD",
        saveProjectJson: "Guardar Proyecto (JSON)",
        regenerateAll: "Regenerar Todo",
        start: "Iniciar",
        scenes: "Escenas",
        deselectAll: "Deseleccionar Todo",
        selectAll: "Seleccionar Todo",
        reImagine: "Re-Imaginar",
        reDub: "Re-Doblar",
        generatingVoice: "Generando voz...",
        audioOk: "Audio OK",
        noAudio: "Sin Audio",
        errorAudio: "Error Audio",
        layers: "Capas",
        addNewScene: "Añadir Nueva Escena",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Aprobación del Guion",
        reviewSceneText: "Revisa el texto de cada escena arriba. Puedes editar haciendo clic en el ícono de lápiz.",
        chooseGenerationOrder: "Elige el orden de generación:",
        audioFirst: "Audio Primero",
        imagesFirst: "Imágenes Primero",
        
        // === METADATA TAB ===
        seoOptimized: "SEO Optimizado",
        title: "Título",
        description: "Descripción",
        tags: "Etiquetas",
        suggestedThumbs: "Miniaturas Sugeridas",
        regenerateThumbs: "Regenerar Miniaturas",
        
        // === HEADER / TABS ===
        tabCreate: "Crear",
        tabEditor: "Editor",
        tabMeta: "Metadatos",
        tabConfig: "Config",
        licenseActiveBtn: "Licencia Activa",
        upgradeBtn: "Mejorar a PRO",
        free: "GRATIS",
        pro: "PRO",
        
        // === PROGRESS MESSAGES ===
        initializing: "🚀 Inicializando motores creativos...",
        writingScript: "📝 Escribiendo guion con Gemini 2.5...",
        producingScene: "🎬 Produciendo Escena",
        renderComplete: "✅ ¡Render Completo! Generando Portadas...",
        errorGen: "Error en la generación:",
        fatalError: "❌ Error fatal.",
        cancelGen: "🛑 Generación cancelada.",
        pleaseConfig: "Por favor configura tus claves Gemini en la pestaña Configuración.",
        pleasePexels: "Para usar Stock Video, configura la clave Pexels en Configuración.",
        loadingVideo: "Creando tu video...",
        loadingDesc: "Gemini está escribiendo el guion y preparando las escenas.",
        noScenesYet: "Aún no se ha generado ningún video.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Archivo Personalizado (Upload)",
        uploadAudioTip: "Clic para cargar música o efecto (.mp3, .wav)",
        fileUploaded: "Archivo cargado",
        copyrightWarning: "Aviso de Derechos de Autor",
        copyrightBody: "Por favor respeta las leyes de derechos de autor. Usa solo música y efectos de sonido de los que poseas derechos o que sean Royalty Free / Dominio Público. La plataforma no se hace responsable por el mal uso.",
        
        // === PRO FEATURES ===
        onlyPro: "Sólo Miembros PRO",
        branding: "Marca / Logo",
        uploadLogo: "Subir Logo (Canal)",
        sceneOverlay: "Overlay / Imagen Extra",
        dragToMove: "Arrastra para mover, Scroll para redimensionar",
        resetPos: "Reiniciar Posición",
        
        // === TRANSITIONS ===
        transitions: "Transiciones (VFX)",
        transitionType: "Tipo de Transición",
        globalTrans: "Transición Global",
        sceneTrans: "Transición de Escena",
        autoTrans: "🤖 IA Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Idioma del Video (Contenido)",
        pollinationsModel: "Modelo (Pollinations)",
        selectModel: "Seleccionar...",
        originDomain: "Dominio de Origen (Pollinations)",
        originDesc: "Copia esta dirección y pégala en el panel de Pollinations (Referrer) para autorizar.",
        copy: "Copiar",
        copied: "¡Copiado!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Solo Guion (Sin Imagen)",
        providerNoneSub: "Rápido / Placeholder / Manual",
        showSpeaker: "Mostrar Nombre del Personaje",
        speakerStyle: "Estilo de la Etiqueta",
        
        // === TOUR ===
        tutorial: "Tutorial",
        next: "Siguiente",
        finish: "Finalizar",
        dontShowAgain: "No mostrar de nuevo",
        tourWelcome: "¡Bienvenido al Tour!",
        
        // === VIDEO TRIMMER ===
        videoPreprocessing: "Pre-procesamiento de Video",
        startTime: "Inicio",
        endTime: "Fin",
        saveCut: "Guardar Corte",
        
        // === THEMES ===
        theme: "Tema",
        themeDark: "Oscuro",
        themeClean: "Limpio",
        themeCreator: "Creador",
        
        // === INTENSITY ===
        visualIntensity: "Intensidad Visual",
        
        // === MISC ===
        regenerateImage: "Regenerar Imagen",
        editSceneBtn: "Editar Escena",
        
        // === FONTS ===
        fontInter: "Inter (Por Defecto)",
        fontMontserrat: "Montserrat (Moderno)",
        fontOswald: "Oswald (Impacto/Bold)",
        fontPlayfair: "Playfair (Clásico/Serif)",
        fontJetBrains: "JetBrains Mono (Tech/Code)",
        fontComic: "Comic Neue (Cómics)"
    }
};
