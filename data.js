/**
 * GAB-SANTE - Référentiel de Données Maîtresses Hospitalières du Gabon
 * Structures hospitalières de référence, presets nationaux, patients initiaux DMP,
 * transferts régulés SAMU 1300, télé-expertises RCP et stocks de sang CNTS.
 */

// Données maîtresses initiales des 4 CHU universitaires du Gabon
const CHU_DATA = {
  chul: {
    id: 'chul',
    name: 'CHU de Libreville (CHUL)',
    shortName: 'CHUL',
    location: 'Libreville Centre (Boulevard Triomphal)',
    pole: 'Pôle Général & Urgences Polyvalentes',
    totalBeds: 650,
    occupiedBeds: 410,
    reaBeds: 32,
    reaOccupied: 18,
    director: 'Pr. Eric Baye (Directeur Médical)',
    phone: '+241 (0)11 79 90 00',
    emergencyPhone: '1300 (SAMU Régulation)',
    color: '#0284c7',
    tagClass: 'tag-chul',
    isDefault: true,
    specialties: ['Urgences Médico-Chirurgicales', 'Réanimation Adulte', 'Médecine Interne', 'Néphrologie & Dialyse', 'Cardiologie', 'Chirurgie Viscérale'],
    coords: { x: 380, y: 310 }
  },
  chuo: {
    id: 'chuo',
    name: "CHU d'Owendo (CHUO)",
    shortName: 'CHUO',
    location: 'Owendo (Zone Portuaire / Akournam)',
    pole: 'Pôle Excellence Traumatologie & Orthopédie',
    totalBeds: 160,
    occupiedBeds: 98,
    reaBeds: 16,
    reaOccupied: 8,
    director: 'Dr. Elise Ondo (Chef de Pôle Chirurgical)',
    phone: '+241 (0)11 70 34 50',
    emergencyPhone: '+241 (0)66 45 10 20',
    color: '#d97706',
    tagClass: 'tag-chuo',
    isDefault: true,
    specialties: ['Traumatologie d\'Urgence (AVP N1)', 'Chirurgie Orthopédique & Réparatrice', 'Rééducation Fonctionnelle', 'Scanner & IRM Osseuse'],
    coords: { x: 420, y: 410 }
  },
  chumef: {
    id: 'chumef',
    name: 'CHU Mère-Enfant Fondation Jeanne Ebori (CHUMEF)',
    shortName: 'CHUMEF Jeanne Ebori',
    location: 'Libreville (Boulevard de la Corniche)',
    pole: 'Pôle National Périnatologie & Mère-Enfant',
    totalBeds: 220,
    occupiedBeds: 136,
    reaBeds: 24,
    reaOccupied: 11,
    director: 'Pr. Solange Ntsame (Cheffe de Clinique Obstétrique)',
    phone: '+241 (0)11 73 22 10',
    emergencyPhone: '+241 (0)65 12 34 00',
    color: '#db2777',
    tagClass: 'tag-chumef',
    isDefault: true,
    specialties: ['Maternité Haut Risque', 'Néonatalogie & Réanimation Néonatale', 'Pédiatrie de Pointe', 'PMA (Procréation Médicale)', 'Génétique'],
    coords: { x: 340, y: 250 }
  },
  chua: {
    id: 'chua',
    name: "CHU d'Angondjé (CHUA)",
    shortName: 'CHUA Angondjé',
    location: 'Akanda (Nord Libreville / Angondjé)',
    pole: 'Institut National d\'Oncologie & Cancérologie',
    totalBeds: 180,
    occupiedBeds: 108,
    reaBeds: 14,
    reaOccupied: 6,
    director: 'Dr. Marcel Mbadinga (Coordonnateur Cancérologie)',
    phone: '+241 (0)11 45 80 00',
    emergencyPhone: '+241 (0)77 22 88 99',
    color: '#059669',
    tagClass: 'tag-chua',
    isDefault: true,
    specialties: ['Oncologie Médicale', 'Radiothérapie (Accélérateur Linéaire)', 'Chimiothérapie Ambulatoire', 'Soins Palliatifs', 'Anatomopathologie'],
    coords: { x: 440, y: 130 }
  }
};

// Établissements de référence nationaux disponibles pour raccordement en 1 clic
const PRESET_HOSPITALS = {
  hiao_obo: {
    id: 'hiao_obo',
    name: "Hôpital d'Instruction des Armées Omar Bongo Ondimba (HIA-OBO)",
    shortName: 'HIA-OBO Pk9',
    location: 'Libreville (Pk9 / Pôle Militaire & Civil)',
    pole: 'Chirurgie Polyvalente, Caisson Hyperbare & Urgences',
    totalBeds: 400,
    occupiedBeds: 245,
    reaBeds: 28,
    reaOccupied: 12,
    director: 'Médecin Général Pr. Ogandaga',
    phone: '+241 (0)11 79 00 00',
    emergencyPhone: '1300 / +241 066 00 11 22',
    color: '#0369a1',
    tagClass: 'tag-chul',
    isCustom: true,
    specialties: ['Médecine Hyperbare', 'Chirurgie Viscérale & Plastique', 'Réanimation Militaire', 'Traumatologie Balistique'],
    coords: { x: 410, y: 220 }
  },
  hiao: {
    id: 'hiao',
    name: "Hôpital d'Instruction des Armées d'Owendo (HIAO)",
    shortName: 'HIAO Owendo',
    location: 'Owendo (Zone Militaire)',
    pole: 'Chirurgie Ambulatoire, Rééducation & Urgences Maritimes',
    totalBeds: 120,
    occupiedBeds: 70,
    reaBeds: 10,
    reaOccupied: 4,
    director: 'Médecin Colonel Dr. Ndong',
    phone: '+241 (0)11 70 12 34',
    emergencyPhone: '+241 065 44 33 22',
    color: '#0891b2',
    tagClass: 'tag-chuo',
    isCustom: true,
    specialties: ['Chirurgie Générale', 'Médecine du Travail Portuaire', 'Soins de Suite'],
    coords: { x: 430, y: 430 }
  },
  hasl: {
    id: 'hasl',
    name: 'Hôpital Albert Schweitzer de Lambaréné (HASL)',
    shortName: 'Hôpital Schweitzer',
    location: 'Lambaréné (Moyen-Ogooué)',
    pole: 'Recherche Clinique (CERMEL), Infectiologie & Médecine Tropicale',
    totalBeds: 150,
    occupiedBeds: 88,
    reaBeds: 12,
    reaOccupied: 5,
    director: 'Dr. Jean-Claude Mouloungui',
    phone: '+241 (0)11 58 10 20',
    emergencyPhone: '+241 077 30 40 50',
    color: '#059669',
    tagClass: 'tag-chua',
    isCustom: true,
    specialties: ['Recherche Paludisme (CERMEL)', 'Infectiologie & Tuberculose', 'Pédiatrie Tropicale'],
    coords: { x: 300, y: 380 }
  },
  chrpog: {
    id: 'chrpog',
    name: 'Centre Hospitalier Régional de Port-Gentil (CHRPOG)',
    shortName: 'CHR Port-Gentil',
    location: 'Port-Gentil (Ogooué-Maritime)',
    pole: 'Pôle Régional Maritime & Urgences Pétrolières',
    totalBeds: 200,
    occupiedBeds: 124,
    reaBeds: 16,
    reaOccupied: 7,
    director: 'Dr. Patrick Nziengui',
    phone: '+241 (0)11 55 20 40',
    emergencyPhone: '+241 066 88 99 00',
    color: '#7c3aed',
    tagClass: 'tag-chumef',
    isCustom: true,
    specialties: ['Urgences Offshore & Pétrolières', 'Chirurgie d\'Urgence', 'Maternité Provinciale'],
    coords: { x: 260, y: 440 }
  },
  chrf: {
    id: 'chrf',
    name: 'CHR Amissa Bongo de Franceville (CHRF)',
    shortName: 'CHR Franceville',
    location: 'Franceville (Haut-Ogooué)',
    pole: 'Pôle Sud-Est & Partenaire CIRMF (Infectiologie Virale)',
    totalBeds: 180,
    occupiedBeds: 110,
    reaBeds: 14,
    reaOccupied: 6,
    director: 'Pr. Guy Nguema',
    phone: '+241 (0)11 67 05 10',
    emergencyPhone: '+241 074 55 66 77',
    color: '#ea580c',
    tagClass: 'tag-chuo',
    isCustom: true,
    specialties: ['Infectiologie Virale (CIRMF)', 'Médecine Interne', 'Pédiatrie Régionale'],
    coords: { x: 500, y: 390 }
  },
  chrk: {
    id: 'chrk',
    name: 'Centre Hospitalier Régional de Koula-Moutou (CHRK)',
    shortName: 'CHR Koula-Moutou',
    location: 'Koula-Moutou (Ogooué-Lolo)',
    pole: 'Pôle Centre-Est & Urgences Médico-Chirurgicales',
    totalBeds: 130,
    occupiedBeds: 68,
    reaBeds: 10,
    reaOccupied: 4,
    director: 'Dr. Martin Boussamba',
    phone: '+241 (0)11 65 12 00',
    emergencyPhone: '+241 077 88 11 22',
    color: '#0d9488',
    tagClass: 'tag-chul',
    isCustom: true,
    specialties: ['Médecine Générale', 'Maternité & Chirurgie d\'Urgence', 'Pédiatrie'],
    coords: { x: 460, y: 360 }
  }
};

// Base initiale des patients partagés (DMP-Gabon)
const INITIAL_PATIENTS = [
  {
    id: 'PAT-GAB-001',
    ins: 'INS-GA-820412-001',
    cnamgs: '820412-CHUL-01',
    insurance: 'CNAMGS_FONC',
    name: 'MBOUMBA Jean-Pierre',
    birthdate: '1982-04-12',
    gender: 'M',
    bloodType: 'A+',
    allergies: ['Pénicilline', 'Sulfamides'],
    chronicDiseases: ['Drépanocytose (Trait AS)', 'Hypertension Artérielle (HTA)'],
    currentLocation: 'chuo',
    currentService: 'Traumatologie & Soins de suite',
    contacts: '+241 077 45 89 12 (Épouse)',
    history: [
      {
        date: '2026-09-28',
        chu: 'chuo',
        service: 'Orthopédie',
        doctor: 'Dr. Elise Ondo',
        type: 'Intervention',
        summary: 'Ostéosynthèse par plaque verrouillée du fémur droit suite AVP sur la N1. Évolution favorable.'
      },
      {
        date: '2026-09-27',
        chu: 'chul',
        service: 'Urgences / Déchoquage',
        doctor: 'Dr. Eric Baye',
        type: 'Transfert d\'urgence',
        summary: 'Prise en charge initiale post-AVP. Stabilisation hémodynamique et transfert vers CHUO pour chirurgie orthopédique d\'urgence.'
      }
    ]
  },
  {
    id: 'PAT-GAB-002',
    ins: 'INS-GA-951004-002',
    cnamgs: '951004-JE-02',
    insurance: 'CNAMGS_PVNR',
    name: 'OBONE-NDONG Sylvie',
    birthdate: '1995-10-04',
    gender: 'F',
    bloodType: 'O-',
    allergies: ['Aucune connue'],
    chronicDiseases: ['Asthme léger', 'Pré-éclampsie modérée'],
    currentLocation: 'chumef',
    currentService: 'Maternité / Grossesses à Haut Risque',
    contacts: '+241 065 22 11 90',
    history: [
      {
        date: '2026-10-02',
        chu: 'chumef',
        service: 'Néonat & Obstétrique',
        doctor: 'Pr. Solange Ntsame',
        type: 'Hospitalisation',
        summary: 'Grossesse gémellaire à 33 SA avec menace d\'accouchement prématuré. Cure de maturation pulmonaire par corticoïdes.'
      }
    ]
  },
  {
    id: 'PAT-GAB-003',
    ins: 'INS-GA-680719-003',
    cnamgs: '680719-ANG-03',
    insurance: 'OGAR',
    name: 'NZAMBA Patrick',
    birthdate: '1968-07-19',
    gender: 'M',
    bloodType: 'B+',
    allergies: ['Aspirine'],
    chronicDiseases: ['Adénocarcinome Prostatique (Gleason 7)', 'Diabète type 2'],
    currentLocation: 'chua',
    currentService: 'Institut d\'Oncologie / Radiothérapie',
    contacts: '+241 074 18 30 55',
    history: [
      {
        date: '2026-10-01',
        chu: 'chua',
        service: 'Radiothérapie',
        doctor: 'Dr. Marcel Mbadinga',
        type: 'Traitement',
        summary: 'Séance 14/35 de radiothérapie conformationnelle par accélérateur linéaire.'
      }
    ]
  },
  {
    id: 'PAT-GAB-004',
    ins: 'INS-GA-160522-004',
    cnamgs: '160522-JE-04',
    insurance: 'CNAMGS_PVNR',
    name: 'BIYOGHE Axel',
    birthdate: '2016-05-22',
    gender: 'M',
    bloodType: 'O+',
    allergies: ['Aucune connue'],
    chronicDiseases: ['Drépanocytose Majeure (SS)'],
    currentLocation: 'chumef',
    currentService: 'Pédiatrie / Soins Intensifs Néonat & Enfants',
    contacts: '+241 066 99 88 77 (Mère)',
    history: [
      {
        date: '2026-10-03',
        chu: 'chumef',
        service: 'Pédiatrie Spécialisée',
        doctor: 'Dr. Biveghe',
        type: 'Urgence pédiatrique',
        summary: 'Crise vaso-occlusive hyperalgique compliquée d\'un syndrome thoracique aigu. Hyperhydratation et antalgie.'
      }
    ]
  },
  {
    id: 'PAT-GAB-005',
    ins: 'INS-GA-750910-005',
    cnamgs: '750910-HIA-05',
    insurance: 'MUTUELLE_FORCES_ARMEES',
    name: 'NDONG ESSONO Dieudonné',
    birthdate: '1975-09-10',
    gender: 'M',
    bloodType: 'AB+',
    allergies: ['Aucune connue'],
    chronicDiseases: ['Traumatisme crânien ancien', 'Surdité partielle'],
    currentLocation: 'chul',
    currentService: 'Chirurgie Viscérale & Traumatologie',
    contacts: '+241 066 33 22 11 (Caserne)',
    history: [
      {
        date: '2026-10-04',
        chu: 'chul',
        service: 'Chirurgie',
        doctor: 'Pr. Eric Baye',
        type: 'Consultation Spécialisée',
        summary: 'Bilan pré-opératoire hernie inguinale sous couverture Mutuelle Forces Armées (95% tiers-payant).'
      }
    ]
  },
  {
    id: 'PAT-GAB-006',
    ins: 'INS-GA-911130-006',
    cnamgs: '911130-ASC-06',
    insurance: 'ASCOMA_GABON',
    name: 'NGUEMA Mireille',
    birthdate: '1991-11-30',
    gender: 'F',
    bloodType: 'O+',
    allergies: ['Iode'],
    chronicDiseases: ['Endométriose'],
    currentLocation: 'chumef',
    currentService: 'Gynécologie & PMA',
    contacts: '+241 077 12 34 56',
    history: [
      {
        date: '2026-10-05',
        chu: 'chumef',
        service: 'Gynécologie',
        doctor: 'Pr. Solange Ntsame',
        type: 'Suivi PMA',
        summary: 'Échographie pelvienne de contrôle et bilan hormonal. Prise en charge validée via carte ASCOMA Santé.'
      }
    ]
  }
];

// Transferts inter-hospitaliers initiaux (Régulation SAMU 1300)
const INITIAL_TRANSFERS = [
  {
    id: 'TRF-2026-089',
    patientId: 'PAT-GAB-001',
    patientName: 'MBOUMBA Jean-Pierre',
    fromChu: 'chul',
    toChu: 'chuo',
    motif: 'Polytraumatisme AVP N1 avec fracture fémorale complexe nécessitant bloc traumatologique expert CHUO',
    gravityScore: 'IGS II: 28 (Gravité Modérée)',
    status: 'Terminé',
    statusClass: 'badge-green',
    transportMode: 'Ambulance Médicalisée SAMU 1300',
    requestedAt: '2026-09-27 14:15',
    completedAt: '2026-09-27 15:40',
    doctorRequester: 'Dr. Eric Baye (CHUL)',
    doctorAcceptor: 'Dr. Elise Ondo (CHUO)'
  },
  {
    id: 'TRF-2026-091',
    patientId: 'PAT-GAB-002',
    patientName: 'OBONE-NDONG Sylvie',
    fromChu: 'chul',
    toChu: 'chumef',
    motif: 'MAP à 33 SA avec pré-éclampsie. Transfert pour réanimation néonatale de pointe Jeanne Ebori',
    gravityScore: 'Priorité Mère-Enfant P1',
    status: 'En cours de route',
    statusClass: 'badge-red',
    transportMode: 'SMUR Obstétrique Mère-Enfant',
    requestedAt: '2026-10-03 17:30',
    completedAt: 'En transit (ETA: 10 min)',
    doctorRequester: 'Dr. Eric Baye (CHUL)',
    doctorAcceptor: 'Pr. Solange Ntsame (CHUMEF)'
  }
];

// Télé-expertises & Réunions de Concertation Pluridisciplinaire (RCP)
const INITIAL_TELE_EXPERTISE = [
  {
    id: 'RCP-2026-042',
    title: 'Avis Spécialisé Cancérologie - Lésion pulmonaire suspecte',
    fromChu: 'chul',
    toChu: 'chua',
    patientName: 'MENGUE Antoine (61 ans)',
    requestedBy: 'Dr. Eric Baye (CHUL Médecine Interne)',
    expertAssigned: 'Dr. Marcel Mbadinga (CHUA Oncologie)',
    urgency: 'Sous 48h',
    status: 'En attente d\'avis',
    statusClass: 'badge-yellow',
    date: '2026-10-03',
    details: 'Patient tabagique avec opacité hilaire droite au scanner CHUL. Demande d\'avis pour biopsie sous scanner et inscription RCP.'
  },
  {
    id: 'RCP-2026-039',
    title: 'Télé-expertise Traumatologie Complexe Bassin',
    fromChu: 'chul',
    toChu: 'chuo',
    patientName: 'KOUMBA Danielle (34 ans)',
    requestedBy: 'Dr. Mba (CHUL Urgences)',
    expertAssigned: 'Dr. Elise Ondo (CHUO Orthopédie)',
    urgency: 'Urgence Vitale (Immédiat)',
    status: 'Avis rendu & Transfert accepté',
    statusClass: 'badge-green',
    date: '2026-10-02',
    details: 'Disjonction sacro-iliaque post-accident voie publique. Télé-transmission des coupes scanographiques. Avis CHUO : pose fixateur externe.'
  }
];

// Stocks de sang (CNTS et dépôts d'urgence des CHU)
const INITIAL_BLOOD_STOCK = {
  cnts: { 'O+': 85, 'O-': 18, 'A+': 42, 'A-': 8, 'B+': 36, 'B-': 6, 'AB+': 14, 'AB-': 3 },
  chul: { 'O+': 24, 'O-': 4,  'A+': 12, 'A-': 2, 'B+': 10, 'B-': 1, 'AB+': 5,  'AB-': 1 },
  chuo: { 'O+': 19, 'O-': 3,  'A+': 8,  'A-': 1, 'B+': 7,  'B-': 1, 'AB+': 3,  'AB-': 0 },
  chumef: { 'O+': 16, 'O-': 6, 'A+': 9,  'A-': 2, 'B+': 8,  'B-': 2, 'AB+': 4,  'AB-': 1 },
  chua: { 'O+': 11, 'O-': 2,  'A+': 5,  'A-': 1, 'B+': 4,  'B-': 0, 'AB+': 2,  'AB-': 0 }
};

// Historique officiel des réquisitions délivrées par le CNTS Libreville
const INITIAL_CNTS_REQUISITIONS = [
  {
    id: 'REQ-CNTS-2026-078',
    date: '2026-10-03',
    time: '18:05',
    chu: 'chumef',
    chuName: 'CHU Mère-Enfant Fondation Jeanne Ebori (CHUMEF)',
    service: 'Pôle Maternité Haut Risque & Bloc Obstétrical',
    doctor: 'Pr. Solange Ntsame (Obstétrique)',
    contactPhone: '+241 (0)65 12 34 00',
    patientName: 'OBONE-NDONG Sylvie',
    patientMeta: '31 ans (Féminin)',
    patientIns: 'GAB-EST-1995-F-00389',
    patientInsurance: 'CNAMGS_PVNR (Prise en charge 100%)',
    bloodGroup: 'O-',
    urgencyLevel: 'UVI',
    urgencyLabel: 'Urgence Vitale Immédiate',
    urgencyDescription: 'Délivrance sans délai (protocole choc hémorragique obstétrical)',
    deliveryDelay: 'Immédiat (< 15 min)',
    protocol: 'CGR O- Rhesus Négatif sans cross-match préalable complet',
    indication: 'Choc hémorragique de la délivrance post-césarienne d\'urgence à 33 SA avec hématome rétroplacentaire.',
    hemoglobin: '5.8 g/dL',
    raiStatus: 'Prélèvement envoyé en urgence',
    transfusionHistory: 'Antécédent de transfusion en 2021 sans incident',
    pregnancyHistory: 'G3P2, 2 césariennes antérieures',
    status: 'Délivré & Transfusé',
    totalQty: 4,
    items: [
      {
        type: 'CGR (Concentré de Globules Rouges)',
        description: 'Déleucocyté, phénotypé Rhésus-Kell',
        bloodGroup: 'O-',
        quantity: 2,
        batchNumbers: ['GAB-CGR-26-08819', 'GAB-CGR-26-08820'],
        expirationDate: '2026-11-12'
      },
      {
        type: 'PFC (Plasma Frais Congelé)',
        description: 'Sécurisé viro-atténué Amotosalen',
        bloodGroup: 'O-',
        quantity: 2,
        batchNumbers: ['GAB-PFC-26-04102', 'GAB-PFC-26-04103'],
        expirationDate: '2027-09-15'
      }
    ]
  },
  {
    id: 'REQ-CNTS-2026-075',
    date: '2026-09-27',
    time: '14:45',
    chu: 'chuo',
    chuName: "CHU d'Owendo (CHUO)",
    service: 'Bloc de Déchocage & Traumatologie Urgente',
    doctor: 'Dr. Elise Ondo (Chirurgie Orthopédique)',
    contactPhone: '+241 (0)66 45 10 20',
    patientName: 'MBOUMBA Jean-Pierre',
    patientMeta: '28 ans (Masculin)',
    patientIns: 'GAB-EST-1998-M-00214',
    patientInsurance: 'CNAMGS_FONC (80%)',
    bloodGroup: 'O+',
    urgencyLevel: 'UVR',
    urgencyLabel: 'Urgence Vitale Relative',
    urgencyDescription: 'Délivrance sous 2 heures avec contrôle de compatibilité',
    deliveryDelay: 'Sous 2 heures',
    protocol: 'CGR Iso-groupe Iso-Rhésus avec RAI valide',
    indication: 'Polytraumatisme AVP N1 avec fracture fémorale ouverte et spoliation sanguine aiguë.',
    hemoglobin: '6.9 g/dL',
    raiStatus: 'Négative (< 72h)',
    transfusionHistory: 'Aucun antécédent transfusionnel',
    pregnancyHistory: 'Sans objet',
    status: 'Délivré & Transfusé',
    totalQty: 3,
    items: [
      {
        type: 'CGR (Concentré de Globules Rouges)',
        description: 'Déleucocyté SAG-Mannitol',
        bloodGroup: 'O+',
        quantity: 3,
        batchNumbers: ['GAB-CGR-26-07551', 'GAB-CGR-26-07552', 'GAB-CGR-26-07553'],
        expirationDate: '2026-11-05'
      }
    ]
  }
];

// Historique / Audit des mouvements capacitaires des lits CHU
const INITIAL_BED_LOGS = [
  {
    timestamp: '2026-10-03 18:20',
    chu: 'chumef',
    chuName: 'CHUMEF Jeanne Ebori',
    type: 'rea',
    typeName: 'Lit Réanimation',
    delta: +1,
    reason: 'Admission d\'urgence néonatalogie / maternité haut risque',
    user: 'Pr. Solange Ntsame'
  },
  {
    timestamp: '2026-10-03 17:45',
    chu: 'chul',
    chuName: 'CHUL Libreville',
    type: 'occupied',
    typeName: 'Lit Conventionnel',
    delta: -1,
    reason: 'Transfert médicalisé sortant vers CHUMEF (Régulation 1300)',
    user: 'Dr. Eric Baye'
  },
  {
    timestamp: '2026-10-02 11:30',
    chu: 'chuo',
    chuName: 'CHUO Owendo',
    type: 'rea',
    typeName: 'Lit Réanimation',
    delta: +1,
    reason: 'Admission réanimation traumatologie post-AVP N1',
    user: 'Dr. Elise Ondo'
  }
];

// Référentiel des Médicaments Essentiels du Gabon (Pharmacopée Hospitalière)
const GABON_ESSENTIAL_MEDICINES = [
  { name: 'Artésunate injectable', dosage: '120 mg', form: 'Poudre pour préparation injectable IV/IM', class: 'Antipaludique d\'urgence', defaultPosology: '2.4 mg/kg à H0, H12, H24 puis 1x/jour pendant 3 jours' },
  { name: 'Arthéméther + Luméfantrine (Coartem)', dosage: '20 mg / 120 mg', form: 'Comprimés', class: 'Antipaludique oral (CTA)', defaultPosology: '4 comprimés matin et soir au milieu des repas pendant 3 jours' },
  { name: 'Paracétamol injectable', dosage: '10 mg/mL (1000 mg)', form: 'Flacon perfusion 100 mL', class: 'Antalgique / Antipyrétique', defaultPosology: '1 flacon en perfusion de 15 minutes toutes les 6 heures si douleur/fièvre' },
  { name: 'Paracétamol comprimé', dosage: '1000 mg', form: 'Comprimés sécables', class: 'Antalgique / Antipyrétique', defaultPosology: '1 comprimé toutes les 6 heures (max 4g/24h)' },
  { name: 'Amoxicilline + Acide Clavulanique', dosage: '1 g / 125 mg', form: 'Comprimés pelliculés', class: 'Antibiotique Pénicilline', defaultPosology: '1 comprimé matin et soir au début des repas pendant 7 jours' },
  { name: 'Ceftriaxone injectable', dosage: '1 g', form: 'Poudre et solvant pour solution injectable IV/IM', class: 'Céphalosporine 3e génération', defaultPosology: '1 g à 2 g par jour en injection IV lente' },
  { name: 'Ciprofloxacine', dosage: '500 mg', form: 'Comprimés pelliculés', class: 'Fluoroquinolone', defaultPosology: '1 comprimé matin et soir pendant 7 jours' },
  { name: 'Métronidazole', dosage: '500 mg', form: 'Comprimés pelliculés', class: 'Anti-infectieux / Antiparasitaire', defaultPosology: '1 comprimé matin, midi et soir pendant 7 jours' },
  { name: 'Oméprazole', dosage: '20 mg', form: 'Gélules gastro-résistantes', class: 'Inhibiteur de la pompe à protons', defaultPosology: '1 gélule le matin à jeun pendant 28 jours' },
  { name: 'Nicardipine (Loxen LP)', dosage: '50 mg', form: 'Gélules à libération prolongée', class: 'Antihypertenseur / Inhibiteur calcique', defaultPosology: '1 gélule matin et soir' },
  { name: 'Amlodipine', dosage: '5 mg', form: 'Comprimés', class: 'Antihypertenseur', defaultPosology: '1 comprimé par jour le matin' },
  { name: 'Furosémide (Lasilix)', dosage: '40 mg', form: 'Comprimés sécables', class: 'Diurétique de l\'anse', defaultPosology: '1 comprimé le matin' },
  { name: 'Énoxaparine (Lovenox)', dosage: '4 000 UI (40 mg / 0.4 mL)', form: 'Seringue préremplie SC', class: 'Anticoagulant HBPM', defaultPosology: '1 injection sous-cutanée par jour à heure fixe' },
  { name: 'Tramadol', dosage: '50 mg', form: 'Gélules', class: 'Antalgique opioïde palier 2', defaultPosology: '1 gélule toutes les 8 heures si douleur rebelle' },
  { name: 'Sels de Réhydratation Orale (SRO) + Zinc', dosage: 'Sachet pour 1L + Zinc 20mg', form: 'Poudre orale + Comprimés', class: 'Réhydratation / Gastro', defaultPosology: 'Diluer 1 sachet dans 1L d\'eau potable, boire à volonté + 1 cp zinc/jour' },
  { name: 'Salbutamol (Ventoline spray)', dosage: '100 µg / dose', form: 'Aérosol-doseur pressurisé', class: 'Bronchodilatateur d\'urgence', defaultPosology: '1 à 2 bouffées inhalées en cas de crise d\'asthme ou gêne respiratoire' },
  { name: 'Acide Folique (Folavit)', dosage: '5 mg', form: 'Comprimés', class: 'Complément Drépanocytose & Grossesse', defaultPosology: '1 comprimé par jour au long cours' },
  { name: 'Fer Fumarate + Acide Folique', dosage: '200 mg / 0.4 mg', form: 'Comprimés pelliculés', class: 'Anti-anémique martial', defaultPosology: '1 comprimé par jour au cours des repas' },
  { name: 'Metformine', dosage: '850 mg', form: 'Comprimés', class: 'Antidiabétique oral', defaultPosology: '1 comprimé au milieu des 2 principaux repas' },
  { name: 'Insuline Mixtard 30', dosage: '100 UI/mL', form: 'Flacon / Stylo injectable SC', class: 'Insuline humaine biphasique', defaultPosology: 'Selon schéma prescrit par l\'endocrinologue' }
];

// Prescriptions médicales officielles initiales enregistrées dans GAB-SANTE
const INITIAL_PRESCRIPTIONS = [
  {
    id: 'ORD-CNAMGS-2026-0814',
    date: '2026-10-03',
    patientId: 'PAT-GAB-002',
    patientName: 'OBONE-NDONG Sylvie',
    patientBirth: '1995-04-18',
    patientGender: 'Féminin',
    patientWeight: 68,
    patientIns: 'GAB-EST-1995-F-00389',
    patientInsuranceId: '7821-JE-2024',
    insuranceCode: 'CNAMGS_PVNR',
    chuId: 'chumef',
    chuName: 'CHU Mère-Enfant Fondation Jeanne Ebori (CHUMEF)',
    service: 'Obstétrique & Suites de Couches',
    doctorName: 'Pr. Solange Ntsame',
    doctorOnmg: 'ONMG-2009-G087',
    isAld: true,
    clinicalNotes: 'Surveillance tensionnelle biquotidienne et repos strict au lit. Contrôle numération formule sanguine à J+7.',
    medications: [
      {
        name: 'Énoxaparine (Lovenox)',
        dosage: '4 000 UI / 0.4 mL',
        form: 'Seringue préremplie SC',
        posology: '1 injection sous-cutanée par jour le soir à 20h',
        duration: '14 jours',
        quantity: '2 boîtes',
        nonSubstituable: true,
        instructions: 'Prévention thromboembolique post-césarienne d\'urgence.'
      },
      {
        name: 'Fer Fumarate + Acide Folique',
        dosage: '200 mg / 0.4 mg',
        form: 'Comprimés pelliculés',
        posology: '1 comprimé le matin et 1 comprimé le soir au milieu des repas',
        duration: '30 jours',
        quantity: '1 boîte',
        nonSubstituable: false,
        instructions: 'Traitement de l\'anémie post-hémorragique.'
      },
      {
        name: 'Paracétamol',
        dosage: '1000 mg',
        form: 'Comprimés sécables',
        posology: '1 comprimé toutes les 8 heures si douleur',
        duration: '5 jours',
        quantity: '2 boîtes',
        nonSubstituable: false,
        instructions: 'Antalgie post-opératoire.'
      }
    ]
  },
  {
    id: 'ORD-CNAMGS-2026-0792',
    date: '2026-09-28',
    patientId: 'PAT-GAB-001',
    patientName: 'MBOUMBA Jean-Pierre',
    patientBirth: '1998-11-12',
    patientGender: 'Masculin',
    patientWeight: 74,
    patientIns: 'GAB-EST-1998-M-00214',
    patientInsuranceId: '4512-LBV-2023',
    insuranceCode: 'CNAMGS_FONC',
    chuId: 'chuo',
    chuName: "CHU d'Owendo (CHUO)",
    service: 'Chirurgie Orthopédique & Traumatologie',
    doctorName: 'Dr. Elise Ondo',
    doctorOnmg: 'ONMG-2015-T142',
    isAld: false,
    clinicalNotes: 'Surveillance des pansements du fixateur externe et soins infirmiers quotidiens au domicile.',
    medications: [
      {
        name: 'Amoxicilline + Acide Clavulanique',
        dosage: '1 g / 125 mg',
        form: 'Comprimés pelliculés',
        posology: '1 comprimé matin, midi et soir pendant les repas',
        duration: '10 jours',
        quantity: '3 boîtes',
        nonSubstituable: false,
        instructions: 'Couverture antibioprophylactique post-fixateur externe.'
      },
      {
        name: 'Tramadol',
        dosage: '50 mg',
        form: 'Gélules',
        posology: '1 gélule toutes les 8 heures en cas de douleur vive',
        duration: '7 jours',
        quantity: '1 boîte',
        nonSubstituable: true,
        instructions: 'Ne pas dépasser 4 gélules par jour.'
      },
      {
        name: 'Oméprazole',
        dosage: '20 mg',
        form: 'Gélules gastro-résistantes',
        posology: '1 gélule le matin à jeun',
        duration: '14 jours',
        quantity: '1 boîte',
        nonSubstituable: false,
        instructions: 'Protection gastrique.'
      }
    ]
  }
];

// Exposition globale pour compatibilité avec ou sans modules
if (typeof window !== 'undefined') {
  window.CHU_DATA = CHU_DATA;
  window.PRESET_HOSPITALS = PRESET_HOSPITALS;
  window.INITIAL_PATIENTS = INITIAL_PATIENTS;
  window.INITIAL_TRANSFERS = INITIAL_TRANSFERS;
  window.INITIAL_TELE_EXPERTISE = INITIAL_TELE_EXPERTISE;
  window.INITIAL_BLOOD_STOCK = INITIAL_BLOOD_STOCK;
  window.INITIAL_CNTS_REQUISITIONS = INITIAL_CNTS_REQUISITIONS;
  window.INITIAL_BED_LOGS = INITIAL_BED_LOGS;
  window.GABON_ESSENTIAL_MEDICINES = GABON_ESSENTIAL_MEDICINES;
  window.INITIAL_PRESCRIPTIONS = INITIAL_PRESCRIPTIONS;
}
