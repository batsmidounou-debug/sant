/**
 * GAB-SANTE - Assistant IA Clinique & Régulation Sanitaire Gabon
 * Module autonome : ai-assistant.js
 *
 * Fonctionnalités :
 * - Gestion locale sécurisée de la clé API et du Prompt Système (sauvegarde chiffrée ou locale)
 * - Support direct Google Gemini API (gemini-1.5-flash / gemini-2.0-flash / gemini-1.5-pro)
 * - Support OpenAI & DeepSeek compatibles (chat/completions)
 * - Raccourcis médicaux cliniques gabonais (Analyse DMP, Avis RCP, Vérification Ordonnance, Orientation SAMU 1300)
 */

class AiAssistantService {
  constructor() {
    this.storageKeyConfig = 'sani_ai_config';
    this.storageKeyHistory = 'sani_ai_chat_history';
    this.config = this.loadConfig();
    this.chatHistory = this.loadHistory();
    this.isGenerating = false;
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKeyConfig);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration automatique vers le modèle gratuit actuellement en service sur OpenRouter
        if (!parsed.model || parsed.model.includes('deepseek') || parsed.model.includes('gemma')) {
          parsed.model = 'nvidia/nemotron-3.5-lightning:free';
          this.saveConfig(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[GAB-SANTE AI] Erreur chargement config locale:', e);
    }
    return {
      provider: 'openrouter',
      apiKey: 'YOUR_API_KEY_HERE', // Remplacez par votre clé OpenRouter sur https://openrouter.ai/keys
      model: 'nvidia/nemotron-3.5-lightning:free',
      systemPrompt: `Tu es l'Assistant Médical Clinique de GAB-SANTE (Réseau CHUL, CHUO, CHUA, HIAO, Melen au Gabon).
Tu aides les médecins, urgentistes et pharmaciens dans :
1. L'analyse des dossiers médicaux partagés (DMP) et l'aide au diagnostic différentiel.
2. La détection des interactions médicamenteuses et contre-indications selon les allergies du patient.
3. Les protocoles sanitaires du Gabon (Paludisme grave, Drépanocytose SS, Dengue, HTA maligne, Urgences obstétricales).
4. La régulation des transferts SAMU 1300 et le conseil pour les RCP inter-CHU.
Règles strictes :
- Sois rigoureux, clair, concis et directement exploitable en pratique médicale.
- Précise toujours les signes de gravité et alertes vitales en priorité.`
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(this.storageKeyConfig, JSON.stringify(this.config));
    } catch (e) {
      console.error('[GAB-SANTE AI] Impossible de sauvegarder la configuration:', e);
    }
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKeyHistory);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('[GAB-SANTE AI] Erreur historique:', e);
    }
    return [
      {
        role: 'assistant',
        content: `👋 **Bonjour Docteur.** Je suis votre Assistant IA Clinique GAB-SANTE.\n\nVous pouvez me poser une question clinique libre, ou cliquer sur l'un des raccourcis médicaux ci-dessous pour analyser un patient, vérifier une ordonnance ou rédiger un avis de télé-expertise.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }

  saveHistory() {
    try {
      localStorage.setItem(this.storageKeyHistory, JSON.stringify(this.chatHistory));
    } catch (e) {
      console.warn('[GAB-SANTE AI] Sauvegarde historique échouée:', e);
    }
  }

  clearHistory() {
    this.chatHistory = [
      {
        role: 'assistant',
        content: `Conversation réinitialisée. Comment puis-je vous aider ?`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
    this.saveHistory();
  }

  /**
   * Détecte si l'app tourne sur Vercel (proxy sécurisé disponible)
   * Dans ce cas, la clé API n'est pas nécessaire côté client.
   */
  _isVercelDeployment() {
    const host = window.location.hostname;
    return host.endsWith('.vercel.app') || host.endsWith('vercel.app');
  }

  /**
   * Appel unifié vers l'API IA (Gemini ou OpenAI/DeepSeek)
   * Sur Vercel : utilise le proxy sécurisé /api/ai-proxy (clé côté serveur)
   * En local / GitHub Pages : utilise la clé API stockée dans localStorage
   */
  async sendMessage(userMessage, contextData = '') {
    const onVercel = this._isVercelDeployment();

    // Sur Vercel le proxy gère la clé — sinon vérifier que la clé est présente
    if (!onVercel && (!this.config.apiKey || this.config.apiKey === 'YOUR_API_KEY_HERE')) {
      throw new Error("Clé API manquante. Veuillez renseigner votre clé API dans l'onglet 'Configuration IA & Prompts'.");
    }

    const fullUserPrompt = contextData
      ? `[DONNÉES DU PATIENT / CONTEXTE GAB-SANTE]\n${contextData}\n\n[DEMANDE DU PRATICIEN]\n${userMessage}`
      : userMessage;

    // Ajout message utilisateur à l'historique
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.chatHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: nowTime
    });
    this.saveHistory();

    let assistantReply = '';

    // Sur Vercel : appel via le proxy sécurisé (clé API invisible au client)
    if (onVercel && this.config.provider !== 'gemini') {
      assistantReply = await this._callVercelProxy(fullUserPrompt);
    } else if (this.config.provider === 'gemini') {
      assistantReply = await this._callGeminiApi(fullUserPrompt);
    } else {
      assistantReply = await this._callOpenAiCompatibleApi(fullUserPrompt);
    }

    this.chatHistory.push({
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    this.saveHistory();

    return assistantReply;
  }

  /**
   * Appel via le proxy Vercel sécurisé /api/ai-proxy
   * La clé OPENROUTER_API_KEY reste côté serveur, jamais exposée au navigateur.
   */
  async _callVercelProxy(promptText) {
    const recentMessages = this.chatHistory.slice(-8, -1).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'nvidia/nemotron-3.5-lightning:free',
        systemPrompt: this.config.systemPrompt || '',
        messages: [
          ...recentMessages,
          { role: 'user', content: promptText }
        ]
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erreur proxy HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.reply) throw new Error('Réponse vide renvoyée par le proxy IA.');
    return data.reply;
  }

  async _callGeminiApi(promptText) {
    const model = this.config.model || 'gemini-1.5-flash';
    const apiKey = this.config.apiKey.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [];

    // Système prompt intégré
    const systemInstruction = this.config.systemPrompt ? {
      role: 'user',
      parts: [{ text: `INSTRUCTIONS SYSTÈME CLINIQUES (À RESPECTER STRICTEMENT) :\n${this.config.systemPrompt}` }]
    } : null;

    if (systemInstruction) {
      contents.push(systemInstruction);
      contents.push({ role: 'model', parts: [{ text: "Bien reçu. J'applique ces directives cliniques rigoureusement." }] });
    }

    // Historique récent (5 derniers échanges max pour limiter le payload)
    const recentHistory = this.chatHistory.slice(-6, -1);
    recentHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    // Dernier prompt
    contents.push({
      role: 'user',
      parts: [{ text: promptText }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2, // Faible température pour rigueur médicale
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `Erreur HTTP ${response.status}`;
      throw new Error(`Échec API Gemini : ${msg}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Réponse vide renvoyée par le modèle Gemini.");
    return text;
  }

  async _callOpenAiCompatibleApi(promptText) {
    const apiKey = this.config.apiKey.trim();
    let endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    if (this.config.provider === 'openai') {
      endpoint = 'https://api.openai.com/v1/chat/completions';
    } else if (this.config.provider === 'deepseek') {
      endpoint = 'https://api.deepseek.com/chat/completions';
    }

    const messages = [
      { role: 'system', content: this.config.systemPrompt }
    ];

    // Historique
    const recentHistory = this.chatHistory.slice(-6, -1);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: promptText });

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Recommandé par OpenRouter pour identifier l'application
    if (this.config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
      headers['X-Title'] = 'GAB-SANTE Interconnexion Hospitaliere';
    }

    const defaultModel = this.config.provider === 'openrouter'
      ? 'nvidia/nemotron-3.5-lightning:free'
      : (this.config.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model || defaultModel,
        messages,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `Erreur HTTP ${response.status}`;
      
      // Détection explicite des erreurs de crédits ou de modèle payant
      if (response.status === 402 || msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('balance')) {
        throw new Error(
          `Solde de crédits insuffisant sur OpenRouter pour ce modèle payant.\n\n` +
          `👉 Solution immédiate : Cliquez sur "⚙️ Configuration IA & Prompts" et sélectionnez un modèle gratuit avec l'étiquette (Gratuit - 0 Crédit Requis), par exemple : "deepseek/deepseek-r1:free" ou "google/gemini-2.0-flash-exp:free".`
        );
      }
      throw new Error(`Échec API ${this.config.provider} : ${msg}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) return "Réponse vide de l'API.";
    // Modèles de raisonnement (comme DeepSeek R1) qui renvoient reasoning + content
    if (message.content) {
      return message.content;
    } else if (message.reasoning || message.reasoning_content) {
      return `*Raisonnement clinique :*\n${message.reasoning || message.reasoning_content}`;
    }
    return "Aucune réponse textuelle générée.";
  }

  /**
   * Formate du texte Markdown basique en HTML propre
   */
  markdownToHtml(md) {
    if (!md) return '';
    let escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Titres
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="color:#0f172a; margin: 8px 0 4px; font-size: 0.9rem;">$1</h4>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h3 style="color:#0284c7; margin: 10px 0 6px; font-size: 1rem;">$1</h3>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h2 style="color:#0f4c81; margin: 12px 0 8px; font-size: 1.1rem;">$1</h2>');

    // Gras et Italique
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Listes à puces et numérotées
    escaped = escaped.replace(/^\s*[-•*]\s+(.*)$/gim, '<li style="margin-left: 1.25rem; list-style-type: disc;">$1</li>');
    escaped = escaped.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li style="margin-left: 1.25rem; list-style-type: decimal;">$2</li>');

    // Blocs de code ou citations
    escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px; font-size:0.85em; color:#0369a1;">$1</code>');

    // Paragraphes / retours à la ligne (sans casser les <li>)
    escaped = escaped.replace(/\n\n/g, '<br><br>');
    escaped = escaped.replace(/<\/li>\n/g, '</li>');
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
  }
}

// Instance globale exposée
window.AiAssistantService = new AiAssistantService();
