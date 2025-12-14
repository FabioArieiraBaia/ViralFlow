
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
        heroTagline: "Crie vídeos virais com IA",
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
        advancedVoiceSettings: "Configurações de Voz (TTS)",
        ttsModel: "Modelo TTS",
        ttsModelFast: "Gemini 2.5 Flash (Rápido)",
        ttsModelQuality: "Gemini 2.5 Pro (Qualidade)",
        globalSpeechStyle: "Estilo de Fala Global",
        speechStylePlaceholder: "Ex: Como um repórter animado...",
        autoCast: "🤖 Elenco Automático",
        customVoice: "✏️ Personalizada...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Modelos Pollinations",
        generationModel: "Modelo de Geração",
        imageModelsPublic: "Modelos de Imagem (Público)",
        videoModelsNote: "Modelos de vídeo disponíveis na edição manual (PRO).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Criando Roteiro & Vozes",
        respectingApiLimit: "Respeitando limite de API...",
        audiosGenerated: "Áudios Gerados!",
        scriptVoicesReady: "Roteiro e vozes prontos. Salve o projeto ou gere as imagens.",
        generateImages: "Gerar Imagens",
        saveProjectBackup: "Salvar Projeto (Backup)",
        generatingVisuals: "Gerando Visuais",
        renderingScenesDelay: "Renderizando cenas...",
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
        player: "Player",
        viewMeta: "Ver Metadados",
        noScenesAvailable: "Nenhuma cena disponível. Crie ou importe um projeto.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Editar Personagens em Massa",
        nameAllScenes: "Nome (Todas as Cenas)",
        assignedVoice: "Voz Atribuída",
        applyChanges: "Aplicar Mudanças",
        castUpdated: "Elenco atualizado!",
        castNote: "Mudar a voz requer regenerar áudio.",
        
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
        globalVfx: "VFX Global",
        vignette: "Vinheta",
        filmGrain: "Granulação de Filme",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Adicionar Música",
        mp3WavMultiple: "MP3 ou WAV",
        playlist: "Playlist",
        track: "Faixa",
        overallVolume: "Volume Geral",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Alterar Logo",
        uploadChannelLogo: "Upload Logo do Canal",
        positionX: "Posição X",
        positionY: "Posição Y",
        sizeScale: "Tamanho",
        removeLogo: "Remover Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Revisor de Qualidade",
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
        addNewScene: "Adicionar Cena",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Aprovação do Roteiro",
        reviewSceneText: "Revise o texto de cada cena. Edite clicando no lápis.",
        chooseGenerationOrder: "Escolha a ordem:",
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
        initializing: "🚀 Inicializando...",
        writingScript: "📝 Escrevendo roteiro...",
        producingScene: "🎬 Produzindo Cena",
        renderComplete: "✅ Completo!",
        errorGen: "Erro na geração:",
        fatalError: "❌ Erro fatal.",
        cancelGen: "🛑 Cancelado.",
        pleaseConfig: "Configure suas chaves Gemini em Config.",
        pleasePexels: "Configure a chave Pexels em Config.",
        loadingVideo: "Criando seu vídeo...",
        loadingDesc: "O Gemini está preparando as cenas.",
        noScenesYet: "Nenhum vídeo gerado ainda.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Upload Personalizado",
        uploadAudioTip: "Clique para carregar (.mp3, .wav)",
        fileUploaded: "Arquivo carregado",
        copyrightWarning: "Aviso de Direitos Autorais",
        copyrightBody: "Use apenas músicas Royalty Free ou de sua propriedade.",
        
        // === PRO FEATURES ===
        onlyPro: "Apenas PRO",
        branding: "Branding / Logo",
        uploadLogo: "Upload Logo",
        sceneOverlay: "Overlay",
        dragToMove: "Arraste para mover",
        resetPos: "Resetar",
        
        // === TRANSITIONS ===
        transitions: "Transições (VFX)",
        transitionType: "Tipo de Transição",
        globalTrans: "Transição Global",
        sceneTrans: "Transição da Cena",
        autoTrans: "🤖 IA Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Idioma do Vídeo",
        pollinationsModel: "Modelo (Pollinations)",
        selectModel: "Selecione...",
        originDomain: "Domínio de Origem",
        originDesc: "Cole no painel do Pollinations para autorizar.",
        copy: "Copiar",
        copied: "Copiado!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Apenas Roteiro",
        providerNoneSub: "Sem imagem",
        showSpeaker: "Exibir Personagem",
        speakerStyle: "Estilo da Tag",
        
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
        tutorial: "Tutorial",
        next: "Próximo",
        finish: "Concluir",
        dontShowAgain: "Não mostrar novamente",
        tourWelcome: "Bem-vindo ao Tour!"
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
        heroTagline: "Create viral videos with AI",
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
        advancedVoiceSettings: "Voice Settings (TTS)",
        ttsModel: "TTS Model",
        ttsModelFast: "Gemini 2.5 Flash (Fast)",
        ttsModelQuality: "Gemini 2.5 Pro (Quality)",
        globalSpeechStyle: "Global Speech Style",
        speechStylePlaceholder: "Ex: Like an excited reporter...",
        autoCast: "🤖 Auto Cast",
        customVoice: "✏️ Custom...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Pollinations Models",
        generationModel: "Generation Model",
        imageModelsPublic: "Image Models (Public)",
        videoModelsNote: "Video models available in manual editing (PRO).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Creating Script & Voices",
        respectingApiLimit: "Respecting API limit...",
        audiosGenerated: "Audios Generated!",
        scriptVoicesReady: "Script and voices ready. Save the project or generate images.",
        generateImages: "Generate Images",
        saveProjectBackup: "Save Project (Backup)",
        generatingVisuals: "Generating Visuals",
        renderingScenesDelay: "Rendering scenes...",
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
        player: "Player",
        viewMeta: "View Metadata",
        noScenesAvailable: "No scenes available. Create or import a project.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Edit Characters in Bulk",
        nameAllScenes: "Name (All Scenes)",
        assignedVoice: "Assigned Voice",
        applyChanges: "Apply Changes",
        castUpdated: "Cast updated!",
        castNote: "Changing voice requires regenerating audio.",
        
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
        globalVfx: "Global VFX",
        vignette: "Vignette",
        filmGrain: "Film Grain",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Add Music",
        mp3WavMultiple: "MP3 or WAV",
        playlist: "Playlist",
        track: "Track",
        overallVolume: "Overall Volume",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Change Logo",
        uploadChannelLogo: "Upload Channel Logo",
        positionX: "Position X",
        positionY: "Position Y",
        sizeScale: "Size",
        removeLogo: "Remove Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Quality Reviewer",
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
        addNewScene: "Add Scene",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Script Approval",
        reviewSceneText: "Review each scene's text. Edit by clicking the pencil.",
        chooseGenerationOrder: "Choose order:",
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
        initializing: "🚀 Initializing...",
        writingScript: "📝 Writing script...",
        producingScene: "🎬 Producing Scene",
        renderComplete: "✅ Complete!",
        errorGen: "Generation Error:",
        fatalError: "❌ Fatal Error.",
        cancelGen: "🛑 Cancelled.",
        pleaseConfig: "Configure your Gemini keys in Config.",
        pleasePexels: "Configure Pexels key in Config.",
        loadingVideo: "Creating your video...",
        loadingDesc: "Gemini is preparing the scenes.",
        noScenesYet: "No video generated yet.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Custom Upload",
        uploadAudioTip: "Click to upload (.mp3, .wav)",
        fileUploaded: "File loaded",
        copyrightWarning: "Copyright Warning",
        copyrightBody: "Only use Royalty Free music or music you own.",
        
        // === PRO FEATURES ===
        onlyPro: "PRO Only",
        branding: "Branding / Logo",
        uploadLogo: "Upload Logo",
        sceneOverlay: "Overlay",
        dragToMove: "Drag to move",
        resetPos: "Reset",
        
        // === TRANSITIONS ===
        transitions: "Transitions (VFX)",
        transitionType: "Transition Type",
        globalTrans: "Global Transition",
        sceneTrans: "Scene Transition",
        autoTrans: "🤖 AI Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Video Language",
        pollinationsModel: "Model (Pollinations)",
        selectModel: "Select...",
        originDomain: "Origin Domain",
        originDesc: "Paste in Pollinations dashboard to authorize.",
        copy: "Copy",
        copied: "Copied!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Script Only",
        providerNoneSub: "No image",
        showSpeaker: "Show Character",
        speakerStyle: "Tag Style",
        
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
        tutorial: "Tutorial",
        next: "Next",
        finish: "Finish",
        dontShowAgain: "Don't show again",
        tourWelcome: "Welcome to the Tour!"
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
        heroTagline: "Crea videos virales con IA",
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
        advancedVoiceSettings: "Configuración de Voz (TTS)",
        ttsModel: "Modelo TTS",
        ttsModelFast: "Gemini 2.5 Flash (Rápido)",
        ttsModelQuality: "Gemini 2.5 Pro (Calidad)",
        globalSpeechStyle: "Estilo de Habla Global",
        speechStylePlaceholder: "Ej: Como un reportero animado...",
        autoCast: "🤖 Elenco Automático",
        customVoice: "✏️ Personalizada...",
        
        // === CREATE TAB - POLLINATIONS ===
        pollinationsModels: "Modelos Pollinations",
        generationModel: "Modelo de Generación",
        imageModelsPublic: "Modelos de Imagen (Público)",
        videoModelsNote: "Modelos de video disponibles en edición manual (PRO).",
        
        // === CREATE TAB - GENERATION PHASES ===
        creatingScriptVoices: "Creando Guion y Voces",
        respectingApiLimit: "Respetando límite de API...",
        audiosGenerated: "¡Audios Generados!",
        scriptVoicesReady: "Guion y voces listos. Guarda el proyecto o genera imágenes.",
        generateImages: "Generar Imágenes",
        saveProjectBackup: "Guardar Proyecto (Backup)",
        generatingVisuals: "Generando Visuales",
        renderingScenesDelay: "Renderizando escenas...",
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
        player: "Reproductor",
        viewMeta: "Ver Metadatos",
        noScenesAvailable: "No hay escenas disponibles. Crea o importa un proyecto.",
        
        // === EDITOR TAB - CAST ===
        editCastBulk: "Editar Personajes en Masa",
        nameAllScenes: "Nombre (Todas las Escenas)",
        assignedVoice: "Voz Asignada",
        applyChanges: "Aplicar Cambios",
        castUpdated: "¡Elenco actualizado!",
        castNote: "Cambiar la voz requiere regenerar audio.",
        
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
        globalVfx: "VFX Global",
        vignette: "Viñeta",
        filmGrain: "Grano de Película",
        
        // === EDITOR TAB - AUDIO ===
        addMusicPlaylist: "Añadir Música",
        mp3WavMultiple: "MP3 o WAV",
        playlist: "Playlist",
        track: "Pista",
        overallVolume: "Volumen General",
        
        // === EDITOR TAB - BRAND ===
        changeLogo: "Cambiar Logo",
        uploadChannelLogo: "Subir Logo del Canal",
        positionX: "Posición X",
        positionY: "Posición Y",
        sizeScale: "Tamaño",
        removeLogo: "Eliminar Logo",
        
        // === EDITOR TAB - EXPORT ===
        finalQualityReviewer: "Revisor de Calidad",
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
        addNewScene: "Añadir Escena",
        
        // === EDITOR TAB - APPROVAL ===
        scriptApproval: "Aprobación del Guion",
        reviewSceneText: "Revisa el texto de cada escena. Edita haciendo clic en el lápiz.",
        chooseGenerationOrder: "Elige el orden:",
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
        initializing: "🚀 Inicializando...",
        writingScript: "📝 Escribiendo guion...",
        producingScene: "🎬 Produciendo Escena",
        renderComplete: "✅ ¡Completo!",
        errorGen: "Error en la generación:",
        fatalError: "❌ Error fatal.",
        cancelGen: "🛑 Cancelado.",
        pleaseConfig: "Configura tus claves Gemini en Config.",
        pleasePexels: "Configura la clave Pexels en Config.",
        loadingVideo: "Creando tu video...",
        loadingDesc: "Gemini está preparando las escenas.",
        noScenesYet: "Aún no se ha generado ningún video.",
        
        // === AUDIO UPLOAD ===
        customAudio: "Upload Personalizado",
        uploadAudioTip: "Clic para cargar (.mp3, .wav)",
        fileUploaded: "Archivo cargado",
        copyrightWarning: "Aviso de Derechos de Autor",
        copyrightBody: "Usa solo música Royalty Free o de tu propiedad.",
        
        // === PRO FEATURES ===
        onlyPro: "Solo PRO",
        branding: "Marca / Logo",
        uploadLogo: "Subir Logo",
        sceneOverlay: "Overlay",
        dragToMove: "Arrastra para mover",
        resetPos: "Reiniciar",
        
        // === TRANSITIONS ===
        transitions: "Transiciones (VFX)",
        transitionType: "Tipo de Transición",
        globalTrans: "Transición Global",
        sceneTrans: "Transición de Escena",
        autoTrans: "🤖 IA Auto",
        
        // === LANGUAGE & POLLINATIONS ===
        videoLang: "Idioma del Video",
        pollinationsModel: "Modelo (Pollinations)",
        selectModel: "Seleccionar...",
        originDomain: "Dominio de Origen",
        originDesc: "Pega en el panel de Pollinations para autorizar.",
        copy: "Copiar",
        copied: "¡Copiado!",
        
        // === PROVIDERS ===
        providerNone: "⛔ Solo Guion",
        providerNoneSub: "Sin imagen",
        showSpeaker: "Mostrar Personaje",
        speakerStyle: "Estilo de la Etiqueta",
        
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
        tutorial: "Tutorial",
        next: "Siguiente",
        finish: "Finalizar",
        dontShowAgain: "No mostrar de nuevo",
        tourWelcome: "¡Bienvenido al Tour!"
    }
};
