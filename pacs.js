/**
 * GAB-SANTE - Console d'Imagerie Diagnostique Médicale Avancée PACS / DICOM 3.0
 * Plateforme de télé-radiologie pour Télé-Expertise, RCP et Urgences Inter-CHU.
 * 
 * Modalités supportées :
 * - CT Scanner Thoracique Haute Résolution (CHUL)
 * - CT Scanner Pelvien 3D Osseux & Polytraumatisme AVP (CHUO)
 * - Échographie Périnatale 4D Live & Doppler Utéro-Placentaire (CHUMEF Jeanne Ebori)
 * - Mammographie Numérique Plein Champ 3D & Tomosynthèse (CHUA Angondjé)
 * - IRM Cérébrale 3 Tesla Neuro-Vasculaire (HIA-OBO Pk9)
 */

const PacsService = {
  currentRcpId: 'RCP-2026-042',
  currentSlice: 1,
  currentPreset: 'soft', // 'lung', 'bone', 'soft', 'brain'
  brightness: 100,
  contrast: 100,
  isInverted: false,
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  isMeasuring: false,
  measurePoints: [],
  activeMeasurements: [],
  isCinePlaying: false,
  cineInterval: null,
  cineSpeedMs: 900,
  cursorHu: null,

  // Base complète des séries radiologiques inter-hospitalières du Gabon
  seriesData: {
    // 1. SCANNER THORACIQUE (CHUL)
    'RCP-2026-042': {
      id: 'RCP-2026-042',
      modality: 'CT Thorax Haute Résolution (Scanner)',
      protocol: 'Protocole Nodule Pulmonaire & Bilan d\'Extension',
      category: 'Oncologie Thoracique',
      chu: 'CHUL',
      patientName: 'MENGUE Antoine (61 ans)',
      patientId: 'PAT-GAB-MENGUE-61',
      date: '03/10/2026 à 09:42',
      center: 'CHUL - Service Central de Radiologie & Imagerie Médicale',
      equipment: 'Siemens Somatom Definition Edge 128 coupes',
      kVp: '120 kV',
      mA: '220 mA',
      sliceThickness: '1.25 mm',
      radiologist: 'Pr. Eric Baye / Dr. Obame (Radiologie Thoracique CHUL)',
      scaleMmPerPx: 0.28,
      finding: 'Masse hilaire droite spiculée de 28.4 mm de grand axe au contact direct de la bronche souche droite. Absence d\'épanchement pleural. Adénomégalies sous-carénaires de 14 mm. Présence d\'emphysème centro-lobulaire bilatéral.',
      recommendation: 'Indication formelle d\'une biopsie transpariétale sous guidage tomodensitométrique (scanner) ou écho-endoscopie bronchique (EBUS) avec enregistrement en RCP Oncologie Thoracique CHUA.',
      slices: [
        {
          num: 1,
          label: 'Coupe 14/42 - Apex Pulmonaire Supérieur',
          type: 'lung',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              <ellipse cx="250" cy="255" rx="190" ry="160" fill="#151b28" stroke="#334155" stroke-width="3" />
              
              <ellipse cx="180" cy="240" rx="65" ry="110" fill="#050a14" stroke="#475569" stroke-width="2" />
              <ellipse cx="320" cy="240" rx="65" ry="110" fill="#050a14" stroke="#475569" stroke-width="2" />
              
              <ellipse cx="250" cy="180" rx="14" ry="16" fill="#000" stroke="#64748b" stroke-width="1.5" />
              <path d="M 230,190 Q 250,230 230,310 L 270,310 Q 250,230 270,190 Z" fill="#2d3748" />
              
              <circle cx="250" cy="390" r="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
              <circle cx="250" cy="390" r="6" fill="#000" />
              <path d="M 80,240 Q 110,130 240,110" fill="none" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round" />
              <path d="M 420,240 Q 390,130 260,110" fill="none" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round" />
              <circle cx="205" cy="210" r="7" fill="#cbd5e1" opacity="0.85" />
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        },
        {
          num: 2,
          label: 'Coupe 21/42 - Étage Hilaire (Lésion Principale Spiculée)',
          type: 'lung',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              <ellipse cx="250" cy="255" rx="195" ry="165" fill="#151b28" stroke="#334155" stroke-width="3" />
              
              <circle cx="250" cy="395" r="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <circle cx="250" cy="395" r="7" fill="#000" />
              <path d="M 235,410 L 250,445 L 265,410 Z" fill="#cbd5e1" />
              
              <path d="M 175,130 C 100,160 90,320 170,360 C 210,340 220,280 205,240 C 220,180 210,140 175,130 Z" fill="#030712" stroke="#475569" stroke-width="2" />
              <path d="M 325,130 C 400,160 410,320 330,360 C 290,340 280,280 295,240 C 280,180 290,140 325,130 Z" fill="#030712" stroke="#475569" stroke-width="2" />
              
              <ellipse cx="270" cy="285" rx="55" ry="50" fill="#2d3748" stroke="#475569" stroke-width="1.5" />
              <ellipse cx="240" cy="230" rx="35" ry="30" fill="#334155" />
              
              <!-- Nodule Spiculé Hilaire Droit -->
              <g class="lesion-group">
                <circle cx="195" cy="235" r="18" fill="#e2e8f0" stroke="#ef4444" stroke-width="2.5" />
                <line x1="195" y1="217" x2="195" y2="205" stroke="#ef4444" stroke-width="2" />
                <line x1="213" y1="235" x2="228" y2="235" stroke="#ef4444" stroke-width="2" />
                <line x1="195" y1="253" x2="195" y2="265" stroke="#ef4444" stroke-width="2" />
                <line x1="177" y1="235" x2="162" y2="235" stroke="#ef4444" stroke-width="2" />
                <line x1="208" y1="222" x2="220" y2="210" stroke="#ef4444" stroke-width="2" />
                
                <line x1="177" y1="220" x2="213" y2="250" stroke="#fcd116" stroke-width="1.5" stroke-dasharray="3,2" />
                <circle cx="177" cy="220" r="2.5" fill="#fcd116" />
                <circle cx="213" cy="250" r="2.5" fill="#fcd116" />
                <rect x="220" y="248" width="90" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#fcd116" stroke-width="1" />
                <text x="224" y="261" fill="#fcd116" font-size="10" font-weight="700">Ø: 28.4 mm</text>
              </g>
              
              <ellipse cx="250" cy="255" rx="180" ry="150" fill="none" stroke="#e2e8f0" stroke-width="4" stroke-dasharray="35,15" opacity="0.9" />
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        },
        {
          num: 3,
          label: 'Coupe 28/42 - Bases Pulmonaires & Coupoles Diaphragmatiques',
          type: 'lung',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              <ellipse cx="250" cy="255" rx="195" ry="165" fill="#151b28" stroke="#334155" stroke-width="3" />
              
              <path d="M 110,240 Q 180,180 250,210 L 250,330 Q 150,340 110,240 Z" fill="#334155" stroke="#475569" stroke-width="2" />
              <text x="160" y="270" fill="#94a3b8" font-size="11" font-weight="600">Dôme hépatique</text>
              
              <ellipse cx="330" cy="250" rx="35" ry="45" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
              <circle cx="340" cy="245" r="16" fill="#000" />
              
              <circle cx="250" cy="385" r="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <circle cx="250" cy="385" r="7" fill="#000" />
              
              <ellipse cx="180" cy="350" rx="35" ry="18" fill="#030712" stroke="#475569" stroke-width="1" />
              <ellipse cx="320" cy="350" rx="35" ry="18" fill="#030712" stroke="#475569" stroke-width="1" />
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        }
      ]
    },

    // 2. SCANNER BASSIN 3D / TRAUMATOLOGIE (CHUO)
    'RCP-2026-039': {
      id: 'RCP-2026-039',
      modality: 'CT Bassin & Rachis Lombo-Sacré (Scanner 3D)',
      protocol: 'Polytraumatisme AVP N1 - Bilan Pelvien Osseux Urgent',
      category: 'Traumatologie & Orthopédie',
      chu: 'CHUO',
      patientName: 'KOUMBA Danielle (34 ans)',
      patientId: 'PAT-GAB-KOUMBA-34',
      date: '02/10/2026 à 18:15',
      center: 'CHUO - Pôle d\'Imagerie Orthopédique & Traumatologique',
      equipment: 'GE Revolution CT 256 coupes',
      kVp: '140 kV',
      mA: '350 mA',
      sliceThickness: '0.625 mm (Reconstruction 3D)',
      radiologist: 'Dr. Elise Ondo (Chirurgie Orthopédique CHUO) / Dr. Mbadinga',
      scaleMmPerPx: 0.25,
      finding: 'Disjonction sacro-iliaque droite majeure avec diastasis de 14.2 mm. Fracture comminutive de la branche ilio-pubienne droite. Instabilité pelvienne de type Tile C. Absence d\'hématome expansif actif.',
      recommendation: 'Pose en urgence au bloc CHUO d\'un fixateur externe de cadre antérieur ou ostéosynthèse par vissage sacro-iliaque percutané sous guidage scopique 3D.',
      slices: [
        {
          num: 1,
          label: 'Coupe 08/24 - Anneau Pelvien Supérieur & Articulations Sacro-Iliaques',
          type: 'bone',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              <ellipse cx="250" cy="250" rx="205" ry="175" fill="#151b28" stroke="#334155" stroke-width="2.5" />
              
              <path d="M 210,140 Q 250,130 290,140 L 275,250 Q 250,265 225,250 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <path d="M 295,142 C 370,120 420,180 400,290 C 370,360 320,380 290,340 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <line x1="291" y1="140" x2="276" y2="245" stroke="#000" stroke-width="2" />
              <text x="310" y="190" fill="#10b981" font-size="10" font-weight="700">SI Gauche: 2 mm (N)</text>
              
              <path d="M 185,145 C 110,120 65,180 85,290 C 115,360 170,380 195,340 Z" fill="#cbd5e1" stroke="#ef4444" stroke-width="2.5" />
              
              <!-- FRACTURE / DIASTASIS SACRO-ILIAQUE DROIT -->
              <g class="lesion-group">
                <path d="M 209,140 L 223,248" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                <polygon points="186,145 208,140 223,248 198,252" fill="rgba(239,68,68,0.3)" />
                <line x1="188" y1="190" x2="216" y2="190" stroke="#fcd116" stroke-width="2" stroke-dasharray="2,2" />
                <circle cx="188" cy="190" r="3" fill="#fcd116" />
                <circle cx="216" cy="190" r="3" fill="#fcd116" />
                <rect x="100" y="180" width="115" height="20" rx="4" fill="rgba(15,23,42,0.95)" stroke="#ef4444" stroke-width="1" />
                <text x="106" y="194" fill="#fcd116" font-size="10" font-weight="800">Diastasis: 14.2 mm</text>
              </g>
              
              <circle cx="250" cy="300" r="38" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        },
        {
          num: 2,
          label: 'Coupe 16/24 - Cotyles & Têtes Fémorales Bilatérales',
          type: 'bone',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              <ellipse cx="250" cy="250" rx="205" ry="175" fill="#151b28" stroke="#334155" stroke-width="2.5" />
              
              <circle cx="150" cy="280" r="34" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <path d="M 120,290 L 80,380 L 105,390 L 140,310 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
              
              <circle cx="350" cy="280" r="34" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <path d="M 380,290 L 420,380 L 395,390 L 360,310 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
              
              <path d="M 215,220 Q 250,230 285,220 L 265,340 Q 250,345 235,340 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              
              <line x1="215" y1="235" x2="235" y2="255" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
              <rect x="140" y="215" width="85" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#ef4444" stroke-width="1" />
              <text x="144" y="228" fill="#ef4444" font-size="9" font-weight="700">Trait de fracture</text>
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        },
        {
          num: 3,
          label: 'Coupe 22/24 - Reconstruction Scanographique Coronal Frontale',
          type: 'bone',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" stroke="#1e293b" stroke-width="1" />
              
              <rect x="235" y="60" width="30" height="24" rx="4" fill="#e2e8f0" stroke="#94a3b8" />
              <rect x="235" y="92" width="30" height="24" rx="4" fill="#e2e8f0" stroke="#94a3b8" />
              
              <path d="M 250,120 L 220,240 L 280,240 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <path d="M 270,125 Q 360,110 370,220 L 330,300 Q 280,280 270,230 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
              <path d="M 230,140 Q 140,120 130,235 L 170,315 Q 220,295 230,245 Z" fill="#cbd5e1" stroke="#ef4444" stroke-width="2.5" />
              
              <line x1="120" y1="125" x2="380" y2="125" stroke="#fcd116" stroke-width="1" stroke-dasharray="4,4" />
              <line x1="130" y1="140" x2="230" y2="140" stroke="#ef4444" stroke-width="2" />
              <text x="75" y="145" fill="#ef4444" font-size="10" font-weight="700">Décalage +15.0 mm</text>
              
              <circle cx="150" cy="340" r="28" fill="#e2e8f0" />
              <circle cx="350" cy="340" r="28" fill="#e2e8f0" />
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">Haut (Crânial)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">Bas (Caudal)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        }
      ]
    },

    // 3. ÉCHOGRAPHIE PÉRINATALE & DOPPLER 4D (CHUMEF JEANNE EBORI)
    'SERIES-CHUMEF-ECHO': {
      id: 'SERIES-CHUMEF-ECHO',
      modality: 'US Échographie Obstétrique 4D & Doppler Couleur',
      protocol: 'Grossesse Gémellaire 33 SA - Surveillance Hémodynamique Fœtale',
      category: 'Périnatologie & Mère-Enfant',
      chu: 'chumef',
      patientName: 'OBONE-NDONG Sylvie (31 ans)',
      patientId: 'PAT-GAB-002',
      date: '02/10/2026 à 14:20',
      center: 'CHUMEF - Pôle National Mère-Enfant Fondation Jeanne Ebori',
      equipment: 'GE Voluson E10 Expert HD Live',
      kVp: 'Sonde 3.5-5 MHz',
      mA: 'Gain: 84 dB',
      sliceThickness: 'Plan Coupe Tridimensionnel',
      radiologist: 'Pr. Solange Ntsame (Cheffe de Service Périnatologie CHUMEF)',
      scaleMmPerPx: 0.20,
      finding: 'Grossesse gémellaire bi-choriale bi-amniotique à 33 SA. Fœtus A : Présentation céphalique, biométrie au 50e percentile (BIP 82 mm, DAT 86 mm, LF 64 mm). Doppler ombilical normal (Index de Résistance 0.58). Fœtus B : Présentation transverse, liquide amniotique normal.',
      recommendation: 'Poursuite de la corticothérapie maturative fœtale (Célestène). Monitorage cardiotocographique bi-quotidien et programmation césarienne si décompensation hypertensive.',
      slices: [
        {
          num: 1,
          label: 'Plan 1/3 - Biométrie Fœtale Jumeau A (Diamètre Bipariétal BIP)',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <!-- Faisceau sectoriel échographique -->
              <path d="M 250,30 L 40,460 A 260,260 0 0,0 460,460 Z" fill="#060c18" stroke="#1e293b" stroke-width="1.5" />
              
              <!-- Liquide amniotique (anéchogène / noir) -->
              <path d="M 120,200 Q 250,160 380,210 Q 360,380 140,360 Z" fill="#020408" />
              
              <!-- Crâne fœtal coupe axiale transthalamique -->
              <ellipse cx="250" cy="270" rx="82" ry="68" fill="#1e293b" stroke="#e2e8f0" stroke-width="3.5" />
              <!-- Écho médian cérébral (Ligne médiane) -->
              <line x1="172" y1="270" x2="328" y2="270" stroke="#f8fafc" stroke-width="2" stroke-dasharray="10,4" />
              
              <!-- Thalamus & cavum du septum pellucidum -->
              <ellipse cx="250" cy="270" rx="18" ry="12" fill="#0a0f1d" stroke="#cbd5e1" />
              <rect x="238" y="240" width="24" height="12" rx="3" fill="#000" stroke="#94a3b8" />
              
              <!-- Calipers de mesure du BIP -->
              <line x1="250" y1="202" x2="250" y2="338" stroke="#fcd116" stroke-width="2" stroke-dasharray="3,3" />
              <circle cx="250" cy="202" r="3" fill="#fcd116" />
              <circle cx="250" cy="338" r="3" fill="#fcd116" />
              <rect x="260" y="260" width="95" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#fcd116" stroke-width="1" />
              <text x="264" y="273" fill="#fcd116" font-size="10" font-weight="800">BIP: 82.0 mm (33 SA)</text>
              
              <text x="50" y="50" fill="#10b981" font-size="12" font-weight="700">CHUMEF OBSTÉTRIQUE</text>
              <text x="360" y="50" fill="#38bdf8" font-size="11">Fœtus A • BIP</text>
            </svg>
          `
        },
        {
          num: 2,
          label: 'Plan 2/3 - Doppler Couleur Vaisseaux Ombilicaux (Flux Hémodynamique)',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <path d="M 250,30 L 40,460 A 260,260 0 0,0 460,460 Z" fill="#060c18" stroke="#1e293b" />
              
              <!-- Paroi utérine & placenta postérieur -->
              <path d="M 60,340 Q 250,300 440,340 L 420,440 Q 250,400 80,440 Z" fill="#2d3748" />
              <text x="210" y="380" fill="#94a3b8" font-size="11" font-weight="600">Insertion placentaire</text>
              
              <!-- Cordon ombilical & flux Doppler couleur -->
              <path d="M 180,180 Q 240,240 220,320" stroke="#3b82f6" stroke-width="12" fill="none" opacity="0.8" />
              <path d="M 200,170 Q 260,230 240,310" stroke="#ef4444" stroke-width="10" fill="none" opacity="0.85" />
              <path d="M 190,190 Q 250,250 230,330" stroke="#ef4444" stroke-width="8" fill="none" opacity="0.85" />
              
              <!-- Fenêtre d'échantillonnage Doppler -->
              <rect x="210" y="220" width="40" height="30" fill="none" stroke="#fcd116" stroke-width="2" />
              
              <!-- Spectre Doppler pulsé en incrustation -->
              <rect x="50" y="380" width="400" height="90" fill="rgba(10,15,25,0.9)" stroke="#334155" />
              <line x1="50" y1="440" x2="450" y2="440" stroke="#475569" stroke-width="1" />
              <!-- Ondes systole/diastole -->
              <path d="M 60,440 L 90,395 L 120,425 L 140,440 L 170,395 L 200,425 L 220,440 L 250,395 L 280,425 L 300,440 L 330,395 L 360,425 L 380,440 L 410,395 L 440,425" fill="none" stroke="#22c55e" stroke-width="2" />
              <text x="65" y="405" fill="#22c55e" font-size="10" font-weight="700">IR: 0.58 • Diastole positive (Normale)</text>
              
              <text x="50" y="50" fill="#10b981" font-size="12" font-weight="700">CHUMEF DOPPLER</text>
            </svg>
          `
        },
        {
          num: 3,
          label: 'Plan 3/3 - Fémur Fœtal & Estimation Pondérale',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <path d="M 250,30 L 40,460 A 260,260 0 0,0 460,460 Z" fill="#060c18" stroke="#1e293b" />
              
              <!-- Membre inférieur fœtal -->
              <ellipse cx="250" cy="260" rx="95" ry="40" fill="#151b28" stroke="#334155" />
              
              <!-- Diaphyse fémorale hyperéchogène (Blanche nette) -->
              <path d="M 170,260 Q 250,250 330,260" stroke="#f8fafc" stroke-width="7" stroke-linecap="round" fill="none" />
              <!-- Ombre acoustique postérieure -->
              <polygon points="170,265 330,265 340,360 160,360" fill="rgba(0,0,0,0.7)" />
              
              <!-- Mesure de longueur fémorale LF -->
              <line x1="170" y1="245" x2="330" y2="245" stroke="#fcd116" stroke-width="2" stroke-dasharray="3,3" />
              <circle cx="170" cy="245" r="3" fill="#fcd116" />
              <circle cx="330" cy="245" r="3" fill="#fcd116" />
              <rect x="220" y="225" width="85" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#fcd116" />
              <text x="225" y="238" fill="#fcd116" font-size="10" font-weight="800">LF: 64.0 mm</text>
              
              <rect x="50" y="420" width="220" height="40" rx="6" fill="#091322" stroke="#1e293b" />
              <text x="60" y="438" fill="#38bdf8" font-size="10" font-weight="700">Poids Fœtal Estimé (EPF) : 2 080 g</text>
              <text x="60" y="452" fill="#94a3b8" font-size="9">Percentile : 52e (Croissance harmonieuse)</text>
              
              <text x="50" y="50" fill="#10b981" font-size="12" font-weight="700">CHUMEF BIOMÉTRIE</text>
            </svg>
          `
        }
      ]
    },

    // 4. MAMMOGRAPHIE & TOMOSYNTHÈSE (CHUA ANGONDJÉ)
    'SERIES-CHUA-MAMMO': {
      id: 'SERIES-CHUA-MAMMO',
      modality: 'MG Mammographie Numérique & Tomosynthèse 3D',
      protocol: 'Bilan Sénologique - Dépistage Lésionnel Quadrant Supéro-Externe',
      category: 'Cancérologie & Sénologie',
      chu: 'chua',
      patientName: 'NGUEMA Marie-Claire (52 ans)',
      patientId: 'PAT-GAB-MAMMO-52',
      date: '04/10/2026 à 11:05',
      center: 'CHUA - Institut National de Cancérologie d\'Angondjé',
      equipment: 'Hologic 3Dimensions Selenia Dimensions',
      kVp: '28 kV (Cible Tungstène/Rhodium)',
      mA: '85 mAs',
      sliceThickness: 'Coupe Synthétisée 1.0 mm',
      radiologist: 'Dr. Marcel Mbadinga (Coordonnateur Oncologie CHUA)',
      scaleMmPerPx: 0.18,
      finding: 'Densité glandulaire de type C (hétérogène). Présence au niveau du quadrant supéro-externe gauche (QSE) d\'une distorsion architecturale dense de 15.2 mm avec spicules péri-lésionnels sans foyer franc de microcalcifications. Ganglion axillaire gauche réactionnel centimétrique.',
      recommendation: 'Classification ACR BI-RADS 4b (Suspicion intermédiaire de malignité). Indication formelle d\'une macrobiopsie sous stéréotaxie ou repérage harpon avec examen anatomopathologique.',
      slices: [
        {
          num: 1,
          label: 'Incidence 1/3 - Face Crânio-Caudale (CC) Sein Gauche',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              
              <!-- Contour mammaire incidence CC -->
              <path d="M 50,50 Q 320,50 420,250 Q 320,450 50,450 Z" fill="#080e1a" stroke="#334155" stroke-width="2" />
              
              <!-- Tissu cutané & sous-cutané -->
              <path d="M 55,60 Q 310,60 410,250 Q 310,440 55,440 Z" fill="#141c2b" />
              
              <!-- Glande fibro-glandulaire centrale (Dense / Blanche) -->
              <path d="M 60,110 Q 260,100 340,240 Q 250,380 60,370 Z" fill="#2d3748" opacity="0.8" />
              <path d="M 60,150 Q 220,140 280,240 Q 210,340 60,330 Z" fill="#475569" opacity="0.7" />
              
              <!-- LÉSION SUSPECTE EN QSE (Distorsion spiculée) -->
              <g class="lesion-group">
                <circle cx="280" cy="180" r="16" fill="#e2e8f0" stroke="#ef4444" stroke-width="2" />
                <line x1="280" y1="164" x2="280" y2="148" stroke="#ef4444" stroke-width="1.5" />
                <line x1="296" y1="180" x2="315" y2="180" stroke="#ef4444" stroke-width="1.5" />
                <line x1="280" y1="196" x2="280" y2="212" stroke="#ef4444" stroke-width="1.5" />
                <line x1="264" y1="180" x2="248" y2="180" stroke="#ef4444" stroke-width="1.5" />
                
                <line x1="266" y1="168" x2="294" y2="192" stroke="#fcd116" stroke-width="1.5" stroke-dasharray="2,2" />
                <circle cx="266" cy="168" r="2.5" fill="#fcd116" />
                <circle cx="294" cy="192" r="2.5" fill="#fcd116" />
                <rect x="300" y="160" width="95" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#ef4444" />
                <text x="304" y="173" fill="#fcd116" font-size="10" font-weight="800">Distorsion: 15.2 mm</text>
              </g>
              
              <!-- Mamelon au zénith -->
              <circle cx="420" cy="250" r="5" fill="#cbd5e1" />
              
              <text x="40" y="40" fill="#ec4899" font-size="12" font-weight="700">CHUA CANCÉROLOGIE</text>
              <text x="40" y="475" fill="#38bdf8" font-size="11">Sein Gauche • Profil CC</text>
            </svg>
          `
        },
        {
          num: 2,
          label: 'Incidence 2/3 - Oblique Médio-Latérale (MLO) Sein Gauche',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <!-- Muscle pectoral oblique -->
              <polygon points="40,40 180,40 40,320" fill="#475569" stroke="#64748b" />
              <text x="60" y="100" fill="#94a3b8" font-size="10">Pectoral</text>
              
              <!-- Contour mammaire MLO -->
              <path d="M 40,120 Q 360,160 420,320 Q 280,440 40,450 Z" fill="#080e1a" stroke="#334155" stroke-width="2" />
              <path d="M 40,130 Q 340,170 410,320 Q 270,430 40,440 Z" fill="#141c2b" />
              <path d="M 40,160 Q 280,190 320,310 Q 220,390 40,400 Z" fill="#334155" opacity="0.8" />
              
              <!-- Lésion visible en MLO -->
              <circle cx="270" cy="230" r="15" fill="#f1f5f9" stroke="#ef4444" stroke-width="2" />
              <text x="290" y="225" fill="#ef4444" font-size="10" font-weight="700">ACR BI-RADS 4b</text>
              
              <!-- Ganglion axillaire bénin haut situé -->
              <ellipse cx="140" cy="90" rx="12" ry="8" fill="#cbd5e1" stroke="#94a3b8" />
              <text x="160" y="94" fill="#94a3b8" font-size="9">Ganglion 11 mm</text>
              
              <text x="40" y="30" fill="#ec4899" font-size="12" font-weight="700">CHUA MAMMOGRAPHIE</text>
            </svg>
          `
        },
        {
          num: 3,
          label: 'Incidence 3/3 - Tomosynthèse 3D Coupe Centrée sur la Distorsion',
          type: 'soft',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="210" fill="#0b1324" stroke="#334155" />
              
              <!-- Foyer lésionnel agrandi x3 -->
              <ellipse cx="250" cy="250" rx="75" ry="65" fill="#1e293b" stroke="#64748b" />
              
              <!-- Centre dense infiltrant -->
              <path d="M 210,210 C 230,190 270,200 290,230 C 300,270 260,290 230,280 C 200,270 190,230 210,210 Z" fill="#f8fafc" stroke="#ef4444" stroke-width="3" />
              
              <!-- Spicules rétractiles nets en tomosynthèse -->
              <line x1="210" y1="210" x2="160" y2="170" stroke="#ef4444" stroke-width="2" />
              <line x1="250" y1="195" x2="250" y2="140" stroke="#ef4444" stroke-width="2" />
              <line x1="290" y1="210" x2="340" y2="160" stroke="#ef4444" stroke-width="2" />
              <line x1="295" y1="250" x2="360" y2="250" stroke="#ef4444" stroke-width="2" />
              <line x1="280" y1="285" x2="330" y2="330" stroke="#ef4444" stroke-width="2" />
              <line x1="230" y1="285" x2="180" y2="340" stroke="#ef4444" stroke-width="2" />
              <line x1="205" y1="250" x2="150" y2="250" stroke="#ef4444" stroke-width="2" />
              
              <!-- Micro-calcifications associées punctiformes -->
              <circle cx="235" cy="235" r="2" fill="#fff" />
              <circle cx="242" cy="245" r="1.5" fill="#fff" />
              <circle cx="255" cy="230" r="2" fill="#fff" />
              
              <rect x="140" y="390" width="220" height="35" rx="6" fill="#091322" stroke="#ef4444" />
              <text x="150" y="412" fill="#ef4444" font-size="11" font-weight="800">Spiculations infiltrantes confirmées</text>
              
              <text x="50" y="50" fill="#ec4899" font-size="12" font-weight="700">CHUA TOMOSYNTHÈSE 3D</text>
            </svg>
          `
        }
      ]
    },

    // 5. IRM CÉRÉBRALE 3T (HIA-OBO PK9)
    'SERIES-HIA-NEURO': {
      id: 'SERIES-HIA-NEURO',
      modality: 'MR IRM Neuro-Vasculaire 3 Tesla',
      protocol: 'AVC Ischémique Récent - Séquences Diffusion DWI / FLAIR / ARM',
      category: 'Neurologie & Neurochirurgie',
      chu: 'hiao_obo',
      patientName: 'NDONG ESSONO Dieudonné (51 ans)',
      patientId: 'PAT-GAB-005',
      date: '04/10/2026 à 16:30',
      center: 'HIA-OBO - Centre d\'Imagerie par Résonance Magnétique (Pk9)',
      equipment: 'Siemens Magnetom Vida 3 Tesla BioMatrix',
      kVp: 'B0: 3.0 Tesla',
      mA: 'TR: 9000 ms • TE: 95 ms',
      sliceThickness: '3.0 mm (Sans injection)',
      radiologist: 'Médecin Général Pr. Ogandaga / Dr. Mba (Neuroradiologie HIA)',
      scaleMmPerPx: 0.22,
      finding: 'Accident Vasculaire Cérébral (AVC) ischémique aigu du territoire jonctionnel superficiel de l\'artère cérébrale moyenne gauche (sylvienne). Hypersignal franc en diffusion (DWI) avec chute du coefficient apparent de diffusion (ADC = 0.42 x 10^-3 mm²/s). Absence d\'hémorragie.',
      recommendation: 'Hospitalisation immédiate en Unité Neuro-Vasculaire (UNV). Bilan étiologique complet (Holter ECG, échographie Doppler des troncs supra-aortiques). Début traitement antiagrégant et neuroprotecteur.',
      slices: [
        {
          num: 1,
          label: 'Séquence 1/3 - Axiale T2 FLAIR (Ventrules Latéraux & Noyaux Gris)',
          type: 'brain',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <circle cx="250" cy="250" r="230" fill="#050811" />
              
              <!-- Boîte crânienne diploé osseuse -->
              <ellipse cx="250" cy="250" rx="165" ry="195" fill="#151b28" stroke="#cbd5e1" stroke-width="4" />
              
              <!-- Parenchyme cérébral T2 FLAIR (Gris moyen) -->
              <ellipse cx="250" cy="250" rx="155" ry="185" fill="#2d3748" />
              
              <!-- Scissure inter-hémisphérique -->
              <line x1="250" y1="70" x2="250" y2="430" stroke="#000" stroke-width="2" />
              
              <!-- Ventricules latéraux (FLAIR = LCR noir) -->
              <path d="M 245,180 C 235,210 220,250 230,290 C 235,270 240,240 245,180 Z" fill="#000" stroke="#1e293b" />
              <path d="M 255,180 C 265,210 280,250 270,290 C 265,270 260,240 255,180 Z" fill="#000" stroke="#1e293b" />
              
              <!-- Noyaux gris centraux (Thalamus & striatum) -->
              <ellipse cx="225" cy="270" rx="14" ry="18" fill="#1e293b" />
              <ellipse cx="275" cy="270" rx="14" ry="18" fill="#1e293b" />
              
              <!-- HYPERSIGNAL ISCHÉMIQUE SYLVIEN GAUCHE (Blanc éclatant) -->
              <g class="lesion-group">
                <path d="M 330,190 C 370,210 380,260 350,290 C 320,270 315,220 330,190 Z" fill="#f8fafc" stroke="#38bdf8" stroke-width="2" />
                <rect x="290" y="300" width="130" height="20" rx="4" fill="rgba(15,23,42,0.95)" stroke="#38bdf8" />
                <text x="296" y="314" fill="#38bdf8" font-size="10" font-weight="700">Hypersignal FLAIR ACM</text>
              </g>
              
              <text x="245" y="30" fill="#38bdf8" font-size="14" font-weight="700">A (Antérieur)</text>
              <text x="245" y="485" fill="#38bdf8" font-size="14" font-weight="700">P (Postérieur)</text>
              <text x="25" y="255" fill="#38bdf8" font-size="14" font-weight="700">D</text>
              <text x="465" y="255" fill="#38bdf8" font-size="14" font-weight="700">G</text>
            </svg>
          `
        },
        {
          num: 2,
          label: 'Séquence 2/3 - Diffusion DWI (b=1000 s/mm²) - Ischémie Aiguë',
          type: 'brain',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <ellipse cx="250" cy="250" rx="160" ry="190" fill="#111827" stroke="#374151" stroke-width="3" />
              
              <!-- Parenchyme sombre en diffusion -->
              <ellipse cx="250" cy="250" rx="150" ry="180" fill="#1f2937" />
              <line x1="250" y1="75" x2="250" y2="425" stroke="#030712" stroke-width="2" />
              
              <!-- AVC EN HYPERSIGNAL BRILLANT EN DIFFUSION (Restriction cytotoxique) -->
              <path d="M 325,185 C 375,205 385,265 355,295 C 315,275 310,215 325,185 Z" fill="#ffffff" stroke="#ef4444" stroke-width="3" />
              
              <!-- Règle de diamètre de la zone ischémiée -->
              <line x1="325" y1="210" x2="370" y2="260" stroke="#fcd116" stroke-width="2" stroke-dasharray="2,2" />
              <circle cx="325" cy="210" r="3" fill="#fcd116" />
              <circle cx="370" cy="260" r="3" fill="#fcd116" />
              <rect x="290" y="160" width="130" height="20" rx="4" fill="rgba(15,23,42,0.95)" stroke="#ef4444" />
              <text x="296" y="174" fill="#fcd116" font-size="10" font-weight="800">Zone Infarcie: 34.8 mm</text>
              
              <text x="50" y="50" fill="#ef4444" font-size="12" font-weight="700">HIA-OBO DIFFUSION DWI</text>
            </svg>
          `
        },
        {
          num: 3,
          label: 'Séquence 3/3 - Cartographie ADC (Apparent Diffusion Coefficient)',
          type: 'brain',
          svg: `
            <svg viewBox="0 0 500 500" class="dicom-svg">
              <rect width="500" height="500" fill="#000" />
              <ellipse cx="250" cy="250" rx="160" ry="190" fill="#4b5563" stroke="#9ca3af" stroke-width="2" />
              
              <!-- Parenchyme clair sur carte ADC -->
              <ellipse cx="250" cy="250" rx="150" ry="180" fill="#6b7280" />
              <line x1="250" y1="75" x2="250" y2="425" stroke="#374151" stroke-width="2" />
              
              <!-- CHUTE FRANCHE DE L'ADC (Noir / Hypo-intense = Ischémie Vraie) -->
              <path d="M 325,185 C 375,205 385,265 355,295 C 315,275 310,215 325,185 Z" fill="#030712" stroke="#000" stroke-width="2" />
              <rect x="280" y="310" width="150" height="20" rx="4" fill="rgba(15,23,42,0.95)" stroke="#10b981" />
              <text x="286" y="324" fill="#10b981" font-size="10" font-weight="800">ADC = 0.42 (Oedème Cytotoxique)</text>
              
              <text x="50" y="50" fill="#38bdf8" font-size="12" font-weight="700">HIA-OBO CARTE ADC</text>
            </svg>
          `
        }
      ]
    }
  },

  /**
   * Ouvre la console PACS pour un cas de RCP ou une série spécifique
   */
  openViewer(seriesOrRcpId) {
    this.currentRcpId = this.seriesData[seriesOrRcpId] ? seriesOrRcpId : 'RCP-2026-042';
    this.currentSlice = 1;
    this.brightness = 100;
    this.contrast = 100;
    this.isInverted = false;
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.isMeasuring = false;
    this.measurePoints = [];
    this.activeMeasurements = [];
    this.stopCine();

    const modal = document.getElementById('modal-pacs-viewer');
    if (!modal) return;

    this.renderConsole();
    modal.classList.remove('hidden');
  },

  closeViewer() {
    this.stopCine();
    const modal = document.getElementById('modal-pacs-viewer');
    if (modal) modal.classList.add('hidden');
  },

  /**
   * Change de série / cas médical
   */
  switchSeries(seriesKey) {
    if (this.seriesData[seriesKey]) {
      this.currentRcpId = seriesKey;
      this.currentSlice = 1;
      this.resetView();
    }
  },

  /**
   * Rendu complet de la console avec l'arborescence, les outils avancés et le panneau clinique
   */
  renderConsole() {
    const container = document.getElementById('pacs-viewer-body');
    if (!container) return;

    const data = this.seriesData[this.currentRcpId] || this.seriesData['RCP-2026-042'];
    const slice = data.slices[this.currentSlice - 1] || data.slices[0];

    container.innerHTML = `
      <div class="pacs-layout" style="display: grid; grid-template-columns: 1fr 320px; gap: 12px; height: 100%;">
        
        <!-- ZONE PRINCIPALE DE VISUALISATION DICOM -->
        <div style="background: #000; border-radius: 8px; border: 1px solid #1e293b; display: flex; flex-direction: column; overflow: hidden; position: relative;">
          
          <!-- Barre Supérieure 1 : Sélecteur de Série Multi-Établissement -->
          <div style="background: #070e1c; border-bottom: 1px solid #1e293b; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; align-items: center; overflow-x: auto; max-width: 100%;">
              <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 700;">SÉRIES DU RÉSEAU :</span>
              <button class="pacs-series-tab ${this.currentRcpId === 'RCP-2026-042' ? 'active' : ''}" onclick="PacsService.switchSeries('RCP-2026-042')">🫁 CT Thorax (CHUL)</button>
              <button class="pacs-series-tab ${this.currentRcpId === 'RCP-2026-039' ? 'active' : ''}" onclick="PacsService.switchSeries('RCP-2026-039')">🦴 CT Bassin 3D (CHUO)</button>
              <button class="pacs-series-tab ${this.currentRcpId === 'SERIES-CHUMEF-ECHO' ? 'active' : ''}" onclick="PacsService.switchSeries('SERIES-CHUMEF-ECHO')">👶 Écho 4D (CHUMEF)</button>
              <button class="pacs-series-tab ${this.currentRcpId === 'SERIES-CHUA-MAMMO' ? 'active' : ''}" onclick="PacsService.switchSeries('SERIES-CHUA-MAMMO')">🎀 Mammo 3D (CHUA)</button>
              <button class="pacs-series-tab ${this.currentRcpId === 'SERIES-HIA-NEURO' ? 'active' : ''}" onclick="PacsService.switchSeries('SERIES-HIA-NEURO')">🧠 IRM 3T (HIA-OBO)</button>
            </div>
            
            <button class="pacs-tool-btn" onclick="PacsService.exportSnapshot()" title="Exporter et imprimer la planche d'imagerie">
              💾 Exporter Planche
            </button>
          </div>

          <!-- Barre d'outils 2 : Manipulation Radiologique & Mesure -->
          <div style="background: #091322; border-bottom: 1px solid #1e293b; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="color: #38bdf8; font-weight: 700;">${data.modality.split(' ')[0]} ${data.modality.split(' ')[1]}</span>
              <span>•</span>
              <span style="color: #f1f5f9;">${slice.label}</span>
            </div>

            <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
              <!-- Outil de mesure millimétrique interactive -->
              <button class="pacs-tool-btn ${this.isMeasuring ? 'active-tool' : ''}" onclick="PacsService.toggleMeasureTool()" title="Cliquer deux points sur l'image pour mesurer une distance réelle">
                📏 ${this.isMeasuring ? 'Mesure Active' : 'Calibrer Mesure'}
              </button>
              
              <!-- Presets de fenêtrage -->
              <button class="pacs-tool-btn" onclick="PacsService.setPreset('lung')">🫁 Poumon</button>
              <button class="pacs-tool-btn" onclick="PacsService.setPreset('bone')">🦴 Os</button>
              <button class="pacs-tool-btn" onclick="PacsService.setPreset('soft')">🥩 Tissus</button>
              <button class="pacs-tool-btn" onclick="PacsService.setPreset('brain')">🧠 Cerveau</button>
              
              <!-- Inversion & Zoom -->
              <button class="pacs-tool-btn" onclick="PacsService.toggleInvert()" title="Inversion Négatif/Positif">🌓 Inverser</button>
              <button class="pacs-tool-btn" onclick="PacsService.zoomIn()">🔍 +</button>
              <button class="pacs-tool-btn" onclick="PacsService.zoomOut()">🔍 -</button>
              <button class="pacs-tool-btn" onclick="PacsService.resetView()">↺ Reset</button>
            </div>
          </div>

          <!-- ZONE CENTRALE : CANVAS RADIOLOGIQUE AVEC SONDE HU ET MESURES DYNAMIQUES -->
          <div id="pacs-image-viewport" 
               style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: #000; min-height: 420px; cursor: ${this.isMeasuring ? 'crosshair' : 'default'};"
               onmousemove="PacsService.handleMouseMove(event)"
               onclick="PacsService.handleCanvasClick(event)">
            
            <div id="pacs-svg-container" style="width: 100%; max-width: 440px; height: 100%; display: flex; align-items: center; justify-content: center; transform: scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px); transition: transform 0.15s ease; filter: brightness(${this.brightness}%) contrast(${this.contrast}%) ${this.isInverted ? 'invert(1)' : ''}; pointer-events: none;">
              ${slice.svg}
            </div>

            <!-- Calque interactif des mesures de distance personnalisées -->
            <svg id="pacs-measurements-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
              ${this.renderActiveMeasurementsSvg()}
            </svg>

            <!-- Overlay d'affichage de données DICOM en coins -->
            <div style="position: absolute; top: 10px; left: 12px; color: #38bdf8; font-family: monospace; font-size: 0.72rem; pointer-events: none; text-shadow: 1px 1px 2px #000; line-height: 1.3;">
              <div style="font-weight: 700; color: #fff;">${data.patientName}</div>
              <div>ID: <code>${data.patientId}</code></div>
              <div>Date: ${data.date}</div>
              <div style="color: #10b981;">🏥 ${data.center.split(' - ')[0]}</div>
            </div>

            <div style="position: absolute; top: 10px; right: 12px; color: #38bdf8; font-family: monospace; font-size: 0.72rem; text-align: right; pointer-events: none; text-shadow: 1px 1px 2px #000; line-height: 1.3;">
              <div style="font-weight: 700; color: #fff;">${data.equipment.split(' ')[0]} ${data.equipment.split(' ')[1] || ''}</div>
              <div>Constantes: ${data.kVp} • ${data.mA}</div>
              <div>Épaisseur: ${data.sliceThickness}</div>
              <div>Matrice: 512 x 512 px</div>
            </div>

            <div style="position: absolute; bottom: 10px; left: 12px; color: #94a3b8; font-family: monospace; font-size: 0.72rem; pointer-events: none; text-shadow: 1px 1px 2px #000; line-height: 1.3;">
              <div>Fenêtre: W: ${this.contrast * 15} / L: ${this.brightness * 5}</div>
              <div>Zoom: ${Math.round(this.zoomLevel * 100)}%</div>
              <div id="pacs-hu-readout" style="color: #fcd116; font-weight: 700;">Densité HU: En attente...</div>
            </div>

            <div style="position: absolute; bottom: 10px; right: 12px; color: #94a3b8; font-family: monospace; font-size: 0.72rem; text-align: right; pointer-events: none; text-shadow: 1px 1px 2px #000; line-height: 1.3;">
              <div style="color: #38bdf8; font-weight: 700;">Coupe ${this.currentSlice} / ${data.slices.length}</div>
              <div>DICOM 3.0 • Réseau GAB-SANTE</div>
            </div>
          </div>

          <!-- Barre de Navigation des Coupes & Mode Cine-Loop -->
          <div style="background: #070e1c; border-top: 1px solid #1e293b; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn-secondary" style="font-size: 0.74rem; padding: 0.3rem 0.65rem;" onclick="PacsService.prevSlice()" ${this.currentSlice === 1 ? 'disabled style="opacity:0.4;"' : ''}>
                ◀ Coupe Préc.
              </button>
              
              <!-- Bouton Cine-Loop Play/Pause -->
              <button class="pacs-tool-btn ${this.isCinePlaying ? 'active-tool' : ''}" onclick="PacsService.toggleCine()" style="font-weight: 700;">
                ${this.isCinePlaying ? '⏸ Pause Cine' : '▶ Play Cine'}
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex: 1; max-width: 320px;">
              <span style="font-size: 0.72rem; color: #94a3b8;">Coupe :</span>
              <input type="range" min="1" max="${data.slices.length}" value="${this.currentSlice}" onchange="PacsService.setSlice(this.value)" style="flex: 1; cursor: pointer;">
              <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 700;">${this.currentSlice}/${data.slices.length}</span>
            </div>

            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn-secondary" style="font-size: 0.74rem; padding: 0.3rem 0.65rem;" onclick="PacsService.nextSlice()" ${this.currentSlice === data.slices.length ? 'disabled style="opacity:0.4;"' : ''}>
                Coupe Suiv. ▶
              </button>
            </div>
          </div>

        </div>

        <!-- PANNEAU LATÉRAL : INFORMATIONS CLINIQUES, CONSTATIONS ET RECOMMANDATIONS -->
        <div style="background: #0f172a; border-radius: 8px; border: 1px solid #1e293b; padding: 14px; color: #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; overflow-y: auto;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-purple" style="font-size: 0.72rem;">${data.category}</span>
              <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">${data.chu.toUpperCase()}</span>
            </div>
            
            <h4 style="font-size: 0.88rem; color: #fff; margin-bottom: 4px; line-height: 1.3;">${data.protocol}</h4>
            <div style="font-size: 0.74rem; color: #94a3b8; margin-bottom: 10px;">${data.center}</div>

            <div style="background: #1e293b; border-radius: 6px; padding: 8px 10px; font-size: 0.74rem; margin-bottom: 12px; border: 1px solid #334155;">
              <div><strong>Système :</strong> ${data.equipment}</div>
              <div><strong>Médecin Interprétateur :</strong> ${data.radiologist}</div>
              <div><strong>Résolution Spatiale :</strong> 1 px = ${data.scaleMmPerPx} mm</div>
            </div>

            <div style="font-size: 0.7rem; text-transform: uppercase; color: #f59e0b; font-weight: 700; margin-bottom: 4px;">
              📋 Constatations Cliniques de l'Examen :
            </div>
            <p style="font-size: 0.78rem; line-height: 1.45; color: #e2e8f0; background: rgba(0,0,0,0.3); border-left: 3px solid #ef4444; padding: 8px 10px; border-radius: 4px; margin-bottom: 12px;">
              ${data.finding}
            </p>

            <div style="font-size: 0.7rem; text-transform: uppercase; color: #10b981; font-weight: 700; margin-bottom: 4px;">
              🎯 Recommandation & Conduite à Tenir :
            </div>
            <p style="font-size: 0.78rem; line-height: 1.45; color: #e2e8f0; background: rgba(0,0,0,0.3); border-left: 3px solid #10b981; padding: 8px 10px; border-radius: 4px; margin-bottom: 12px;">
              ${data.recommendation}
            </p>

            ${this.activeMeasurements.length > 0 ? `
              <div style="background: #1e293b; border: 1px solid #fcd116; border-radius: 6px; padding: 8px 10px; font-size: 0.74rem; margin-bottom: 10px;">
                <div style="color: #fcd116; font-weight: 700; margin-bottom: 4px;">📏 Mesures Personnalisées Enregistrées :</div>
                ${this.activeMeasurements.map((m, idx) => `
                  <div>#${idx + 1} : <strong>${m.distanceMm} mm</strong> (${m.label})</div>
                `).join('')}
                <button onclick="PacsService.clearMeasurements()" style="background: none; border: none; color: #ef4444; font-size: 0.7rem; cursor: pointer; text-decoration: underline; margin-top: 4px;">Effacer les mesures</button>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px; border-top: 1px solid #1e293b; padding-top: 12px;">
            <button class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.78rem;" onclick="PacsService.closeViewer(); saniApp.openRcpOpinionModal('${data.id}')">
              💬 Rédiger / Valider l'Avis RCP pour ce cas
            </button>
            <button class="btn-secondary" style="width: 100%; justify-content: center; font-size: 0.78rem;" onclick="PacsService.closeViewer()">
              Fermer la Console PACS
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // Navigation dans les coupes
  nextSlice() {
    const data = this.seriesData[this.currentRcpId] || this.seriesData['RCP-2026-042'];
    if (this.currentSlice < data.slices.length) {
      this.currentSlice++;
      this.renderConsole();
    } else if (this.isCinePlaying) {
      this.currentSlice = 1;
      this.renderConsole();
    }
  },

  prevSlice() {
    if (this.currentSlice > 1) {
      this.currentSlice--;
      this.renderConsole();
    }
  },

  setSlice(num) {
    this.currentSlice = parseInt(num, 10);
    this.renderConsole();
  },

  // Mode Cine-Loop (Défilement automatique)
  toggleCine() {
    if (this.isCinePlaying) {
      this.stopCine();
    } else {
      this.startCine();
    }
    this.renderConsole();
  },

  startCine() {
    this.isCinePlaying = true;
    this.cineInterval = setInterval(() => {
      this.nextSlice();
    }, this.cineSpeedMs);
  },

  stopCine() {
    this.isCinePlaying = false;
    if (this.cineInterval) {
      clearInterval(this.cineInterval);
      this.cineInterval = null;
    }
  },

  // Fenêtrage radiologique (Presets)
  setPreset(preset) {
    this.currentPreset = preset;
    if (preset === 'lung') {
      this.brightness = 115;
      this.contrast = 140;
    } else if (preset === 'bone') {
      this.brightness = 90;
      this.contrast = 155;
    } else if (preset === 'brain') {
      this.brightness = 105;
      this.contrast = 125;
    } else {
      this.brightness = 100;
      this.contrast = 100;
    }
    this.renderConsole();
  },

  toggleInvert() {
    this.isInverted = !this.isInverted;
    this.renderConsole();
  },

  zoomIn() {
    if (this.zoomLevel < 2.4) {
      this.zoomLevel += 0.2;
      this.renderConsole();
    }
  },

  zoomOut() {
    if (this.zoomLevel > 0.6) {
      this.zoomLevel -= 0.2;
      this.renderConsole();
    }
  },

  resetView() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
    this.brightness = 100;
    this.contrast = 100;
    this.isInverted = false;
    this.currentPreset = 'soft';
    this.renderConsole();
  },

  // Outil de mesure interactive au pied à coulisse (Caliper)
  toggleMeasureTool() {
    this.isMeasuring = !this.isMeasuring;
    this.measurePoints = [];
    if (window.saniApp) {
      window.saniApp.showToast(this.isMeasuring ? '📏 Outil de mesure actif : Cliquez 2 points sur l\'image pour mesurer.' : 'Outil de mesure désactivé.');
    }
    this.renderConsole();
  },

  handleCanvasClick(event) {
    if (!this.isMeasuring) return;
    const viewport = document.getElementById('pacs-image-viewport');
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    this.measurePoints.push({ x, y });

    if (this.measurePoints.length === 2) {
      const p1 = this.measurePoints[0];
      const p2 = this.measurePoints[1];
      const data = this.seriesData[this.currentRcpId] || this.seriesData['RCP-2026-042'];
      const scale = data.scaleMmPerPx || 0.25;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distMm = (distPx * scale / this.zoomLevel).toFixed(1);

      this.activeMeasurements.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        distanceMm: distMm,
        label: `Mesure Coupe ${this.currentSlice}`
      });

      this.measurePoints = [];
      this.renderConsole();
      if (window.saniApp) {
        window.saniApp.showToast(`Distance mesurée : ${distMm} mm`);
      }
    }
  },

  renderActiveMeasurementsSvg() {
    return this.activeMeasurements.map(m => `
      <g>
        <line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="#fcd116" stroke-width="2" stroke-dasharray="3,3" />
        <circle cx="${m.x1}" cy="${m.y1}" r="4" fill="#fcd116" />
        <circle cx="${m.x2}" cy="${m.y2}" r="4" fill="#fcd116" />
        <rect x="${(m.x1 + m.x2) / 2 - 35}" y="${(m.y1 + m.y2) / 2 - 12}" width="70" height="18" rx="3" fill="rgba(15,23,42,0.9)" stroke="#fcd116" stroke-width="1" />
        <text x="${(m.x1 + m.x2) / 2}" y="${(m.y1 + m.y2) / 2 + 1}" fill="#fcd116" font-size="10" font-weight="700" text-anchor="middle">${m.distanceMm} mm</text>
      </g>
    `).join('');
  },

  clearMeasurements() {
    this.activeMeasurements = [];
    this.measurePoints = [];
    this.renderConsole();
  },

  // Sonde de densité tissulaire Hounsfield (HU) en survol
  handleMouseMove(event) {
    const readout = document.getElementById('pacs-hu-readout');
    if (!readout) return;

    const viewport = document.getElementById('pacs-image-viewport');
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    let huValue = 0;
    let tissueLabel = 'Tissus mous';

    if (distFromCenter > 180) {
      huValue = -1000;
      tissueLabel = 'Air ambiant (-1000 HU)';
    } else if (distFromCenter < 35) {
      huValue = 45;
      tissueLabel = 'Médiastin / Sang (+45 HU)';
    } else if (distFromCenter > 140 && distFromCenter < 170) {
      huValue = 680;
      tissueLabel = 'Os cortical dense (+680 HU)';
    } else {
      huValue = -720;
      tissueLabel = 'Parenchyme pulmonaire (-720 HU)';
    }

    readout.textContent = `Sonde : ${huValue} HU • ${tissueLabel}`;
  },

  // Exporter une planche d'imagerie officielle certifiée GAB-SANTE
  exportSnapshot() {
    const data = this.seriesData[this.currentRcpId] || this.seriesData['RCP-2026-042'];
    const slice = data.slices[this.currentSlice - 1] || data.slices[0];

    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Planche Imagerie Médicale PACS - ${data.patientName}</title>
  <style>
    body {
      background: #090e17;
      color: #fff;
      font-family: Arial, sans-serif;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .sheet {
      background: #000;
      border: 2px solid #38bdf8;
      border-radius: 8px;
      padding: 24px;
      max-width: 780px;
      width: 100%;
    }
    .header {
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
    }
    .img-box {
      display: flex;
      justify-content: center;
      background: #000;
      margin-bottom: 16px;
    }
    .report {
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .sheet { border: none; }
      .report { background: #f8fafc; color: #000; border-color: #cbd5e1; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="no-print" style="margin-bottom: 14px; display: flex; justify-content: flex-end;">
      <button onclick="window.print()" style="background: #0284c7; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 700;">
        🖨️ Imprimer la Planche
      </button>
    </div>

    <div class="header">
      <div>
        <strong style="color: #38bdf8; font-size: 1.1rem;">RÉPUBLIQUE GABONAISE • MINISTÈRE DE LA SANTÉ</strong><br>
        <span style="font-size: 0.8rem; color: #94a3b8;">Plateforme d'Imagerie Numérique Partagée GAB-SANTE (PACS DICOM 3.0)</span><br>
        <strong>${data.center}</strong>
      </div>
      <div style="text-align: right; font-size: 0.8rem;">
        <div>Patient : <strong>${data.patientName}</strong></div>
        <div>ID : <code>${data.patientId}</code></div>
        <div>Date Examen : <strong>${data.date}</strong></div>
      </div>
    </div>

    <div class="img-box">
      <div style="width: 440px;">
        ${slice.svg}
      </div>
    </div>

    <div class="report">
      <div style="color: #38bdf8; font-weight: 700; margin-bottom: 4px;">RAPPORT D'INTERPRÉTATION MÉDICALE RADIOLOGIQUE</div>
      <div><strong>Examen :</strong> ${data.modality} (${data.protocol})</div>
      <div><strong>Matériel :</strong> ${data.equipment} • <strong>Épaisseur :</strong> ${data.sliceThickness}</div>
      <div><strong>Constatations :</strong> ${data.finding}</div>
      <div style="margin-top: 6px;"><strong>Conclusions & Recommandations :</strong> ${data.recommendation}</div>
      <div style="margin-top: 10px; border-top: 1px dashed #334155; padding-top: 8px; font-style: italic; color: #94a3b8;">
        Signé numériquement par : ${data.radiologist}
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planche_PACS_${data.patientId}_Coupe${this.currentSlice}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.saniApp) {
      window.saniApp.showToast('Planche d\'imagerie PACS exportée avec succès !');
    }
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.PacsService = PacsService;
}
