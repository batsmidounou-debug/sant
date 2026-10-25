// ============================================================
// Vercel Serverless Function — Proxy sécurisé OpenRouter
// /api/ai-proxy.js
//
// Lit OPENROUTER_API_KEY depuis les variables d'environnement Vercel
// et transmet la requête à l'API OpenRouter sans exposer la clé au client.
// ============================================================

export default async function handler(req, res) {
  // CORS — autoriser uniquement les requêtes depuis le même domaine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Réponse aux preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // Lire la clé API depuis les variables d'environnement Vercel (jamais exposée au client)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'Clé API non configurée sur le serveur. Ajoutez OPENROUTER_API_KEY dans les variables d\'environnement Vercel.'
    });
  }

  try {
    const { model, messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Le champ "messages" est requis et doit être un tableau.' });
    }

    // Construire le payload pour OpenRouter
    const payload = {
      model: model || 'nvidia/nemotron-3.5-lightning:free',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages
      ],
      temperature: 0.2,
      max_tokens: 2048
    };

    // Appel sécurisé vers OpenRouter (clé API côté serveur uniquement)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gab-sante.vercel.app',
        'X-Title': 'GAB-SANTE Assistant IA Clinique'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Erreur HTTP ${response.status}`;
      return res.status(response.status).json({ error: `OpenRouter : ${errMsg}` });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'Réponse vide renvoyée par le modèle IA.' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[GAB-SANTE Proxy] Erreur:', err);
    return res.status(500).json({ error: `Erreur serveur : ${err.message}` });
  }
}
