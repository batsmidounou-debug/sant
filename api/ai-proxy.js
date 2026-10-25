// ============================================================
// Vercel Serverless Function — Proxy securise OpenRouter
// /api/ai-proxy.js  (CommonJS - compatible Vercel Node.js)
//
// Lit OPENROUTER_API_KEY depuis les variables d'environnement Vercel
// et transmet la requete a OpenRouter sans exposer la cle au client.
// ============================================================

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode non autorisee. Utilisez POST.' });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: 'Cle API non configuree. Ajoutez OPENROUTER_API_KEY dans les variables Vercel.'
    });
  }

  try {
    const body = req.body || {};
    const messages    = body.messages;
    const model       = body.model       || 'nvidia/nemotron-3.5-lightning:free';
    const systemPrompt = body.systemPrompt || '';

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Le champ "messages" est requis.' });
    }

    const payload = {
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages
      ],
      temperature: 0.2,
      max_tokens: 2048
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gab-sante.vercel.app',
        'X-Title': 'GAB-SANTE Assistant IA Clinique'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(function() { return {}; });
      const errMsg  = (errJson.error && errJson.error.message) ? errJson.error.message : ('Erreur HTTP ' + response.status);
      return res.status(response.status).json({ error: 'OpenRouter : ' + errMsg });
    }

    const data  = await response.json();
    const choices = data.choices;
    const reply = (choices && choices[0] && choices[0].message) ? choices[0].message.content : null;

    if (!reply) {
      return res.status(502).json({ error: 'Reponse vide renvoyee par le modele IA.' });
    }

    return res.status(200).json({ reply: reply });

  } catch (err) {
    console.error('[GAB-SANTE Proxy] Erreur:', err);
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
};
