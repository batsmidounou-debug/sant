/**
 * GAB-SANTE - Carte Radar Géosanitaire Interactive de l'Estuaire du Gabon
 * Visualisation cartographique SVG de la Baie de Libreville, Owendo, Akanda,
 * corridors sanitaires d'urgence et suivi temps réel des ambulances SMUR / SAMU 1300.
 */

const RadarMapService = {
  /**
   * Rend la carte radar SVG interactive dans le conteneur spécifié
   * @param {HTMLElement|string} container - Élément DOM ou sélecteur ID
   * @param {Object} chuStatus - État des structures hospitalières
   */
  render(container, chuStatus = {}) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    el.innerHTML = `
      <div style="position: relative; width: 100%; height: 380px; background: #0b192c; border-radius: 10px; overflow: hidden; border: 1px solid #1e293b;">
        <svg viewBox="0 0 800 450" style="width: 100%; height: 100%;">
          <defs>
            <radialGradient id="oceanGrad" cx="30%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#0f2942" />
              <stop offset="100%" stop-color="#081422" />
            </radialGradient>
            <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#009e49" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#fcd116" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#0072ce" stop-opacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Océan Atlantique / Baie de Libreville -->
          <rect width="800" height="450" fill="url(#oceanGrad)" />

          <!-- Forme de la côte gabonaise (Estuaire de Libreville) -->
          <path d="M 120,0 
                   Q 220,100 280,140 
                   Q 330,190 350,230 
                   Q 370,280 390,320 
                   Q 440,380 470,450 
                   L 800,450 L 800,0 Z" 
                fill="#132338" stroke="#1e3a5f" stroke-width="2" />

          <!-- Labels géographiques -->
          <text x="140" y="240" fill="#334e68" font-size="14" font-weight="700" letter-spacing="2" transform="rotate(-20 140 240)">ESTUAIRE DU GABON / OCÉAN ATLANTIQUE</text>
          <text x="560" y="50" fill="#486581" font-size="12" font-weight="600">COMMUNE D'AKANDA (Nord)</text>
          <text x="600" y="220" fill="#486581" font-size="12" font-weight="600">LIBREVILLE CENTRE (Boulevard Triomphal)</text>
          <text x="620" y="410" fill="#486581" font-size="12" font-weight="600">COMMUNE D'OWENDO (Port / Sud)</text>

          <!-- Corridors sanitaires sécurisés -->
          <path d="M 440,130 L 380,310" stroke="url(#routeLine)" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.75" />
          <path d="M 380,310 L 420,410" stroke="url(#routeLine)" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.75" />
          <path d="M 380,310 L 340,250" stroke="url(#routeLine)" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.75" />

          <!-- Ambulance animée SAMU 1300 sur le couloir CHUL ➔ CHUMEF -->
          <circle cx="360" cy="280" r="5" fill="#fcd116" filter="url(#glow)">
            <animate attributeName="cx" from="380" to="340" dur="4s" repeatCount="indefinite" />
            <animate attributeName="cy" from="310" to="250" dur="4s" repeatCount="indefinite" />
          </circle>

          <!-- CHUA Angondjé (Nord - Cancérologie) -->
          <g transform="translate(440, 130)">
            <circle r="18" fill="rgba(5, 150, 105, 0.2)" stroke="#059669" stroke-width="2" />
            <circle r="7" fill="#059669" />
            <rect x="-80" y="-36" width="160" height="22" rx="4" fill="#091e3a" stroke="#059669" stroke-width="1" />
            <text x="0" y="-21" fill="#fff" font-size="11" font-weight="700" text-anchor="middle">CHUA (Angondjé) - Cancérologie</text>
          </g>

          <!-- CHUMEF Jeanne Ebori (Corniche - Mère/Enfant) -->
          <g transform="translate(340, 250)">
            <circle r="18" fill="rgba(219, 39, 119, 0.2)" stroke="#db2777" stroke-width="2" />
            <circle r="7" fill="#db2777" />
            <rect x="-85" y="-36" width="170" height="22" rx="4" fill="#091e3a" stroke="#db2777" stroke-width="1" />
            <text x="0" y="-21" fill="#fff" font-size="11" font-weight="700" text-anchor="middle">CHUMEF (Jeanne Ebori) - Mère/Enfant</text>
          </g>

          <!-- CHUL Libreville (Centre - Hôpital Général & Urgences) -->
          <g transform="translate(380, 310)">
            <circle r="22" fill="rgba(2, 132, 199, 0.25)" stroke="#0284c7" stroke-width="2" />
            <circle r="9" fill="#0284c7" />
            <rect x="-95" y="-38" width="190" height="24" rx="4" fill="#091e3a" stroke="#0284c7" stroke-width="1" />
            <text x="0" y="-22" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">CHUL - Hôpital Général</text>
          </g>

          <!-- CHUO Owendo (Sud - Traumatologie & Orthopédie) -->
          <g transform="translate(420, 410)">
            <circle r="18" fill="rgba(217, 119, 6, 0.2)" stroke="#d97706" stroke-width="2" />
            <circle r="7" fill="#d97706" />
            <rect x="-80" y="-36" width="160" height="22" rx="4" fill="#091e3a" stroke="#d97706" stroke-width="1" />
            <text x="0" y="-21" fill="#fff" font-size="11" font-weight="700" text-anchor="middle">CHUO (Owendo) - Traumatologie</text>
          </g>

          <!-- Nœud SAMU 1300 / CNTS Central -->
          <g transform="translate(470, 270)">
            <rect x="-50" y="-12" width="100" height="24" rx="12" fill="#009e49" stroke="#fff" stroke-width="1" />
            <text x="0" y="4" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">🩸 CNTS / SAMU</text>
          </g>
        </svg>

        <!-- Légende radar -->
        <div style="position: absolute; bottom: 10px; left: 12px; background: rgba(9, 30, 58, 0.85); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; color: #cbd5e1; display: flex; gap: 12px; flex-wrap: wrap;">
          <span>🟢 Cancérologie</span>
          <span>🔵 Polyvalent</span>
          <span>🟠 Traumatologie</span>
          <span>🟣 Mère-Enfant</span>
          <span style="color:#fcd116;">⚡ Réseau GAB-SANTE</span>
        </div>
      </div>
    `;
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.RadarMapService = RadarMapService;
}
