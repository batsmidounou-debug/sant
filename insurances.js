/**
 * GAB-SANTE - Référentiel Officiel des Régimes d'Assurance Maladie du Gabon
 * CNAMGS (Fonctionnaires, PVNR, Secteur Privé Formel, Indépendants TIS, Étudiants),
 * CNSS (Risques Professionnels & AT/MP), Mutuelles Professionnelles & Ministérielles,
 * Compagnies d'Assurance Privées avec Tiers-Payant (ASCOMA, OGAR, AXA, NSIA, Sanlam, etc.)
 */

const INSURANCE_LIST = {
  // ── Régimes Publics Obligatoires (CNAMGS & CNSS) ───────────────────
  CNAMGS_FONC: {
    code: 'CNAMGS-FONC',
    label: 'CNAMGS – Fonctionnaires & Agents Publics de l\'État (GE)',
    shortLabel: 'CNAMGS Fonctionnaires',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '🏛️',
    color: '#0072ce',
    coverageRate: '80%',
    copay: '20% (0% en cas d\'ALD & Maternité)',
    tiers_payant: true,
    contact: '1488 (Vert) / +241 01 74 24 00',
    description: 'Prise en charge à 80% des consultations, hospitalisations et actes chirurgicaux. 100% pour ALD et maternité dans le réseau hospitalier national.',
    validity: '31/12/2026'
  },
  CNAMGS_PVNR: {
    code: 'CNAMGS-PVNR',
    label: 'CNAMGS – Gabonais Économiquement Faibles / PVNR',
    shortLabel: 'CNAMGS PVNR (GEF)',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '🤝',
    color: '#059669',
    coverageRate: '100%',
    copay: '0% (Exonération Totale du Ticket Modérateur)',
    tiers_payant: true,
    contact: '1488 (Vert) / +241 01 74 24 00',
    description: 'Prise en charge intégrale à 100% des soins d\'urgence, médicaments génériques, accouchements et dialyse dans l\'ensemble des structures publiques.',
    validity: '31/12/2026'
  },
  CNAMGS_SECT_PRIVE: {
    code: 'CNAMGS-PRIV',
    label: 'CNAMGS – Salariés du Secteur Privé Formel (SPF)',
    shortLabel: 'CNAMGS Privé Formel',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '🏢',
    color: '#7c3aed',
    coverageRate: '80%',
    copay: '20% (Ticket modérateur conventionné)',
    tiers_payant: true,
    contact: '1488 (Vert) / +241 01 74 24 00',
    description: 'Couverture maladie des travailleurs immatriculés à la CNSS. Prise en charge à 80% sur tarifs conventionnés dans les CHU.',
    validity: '31/12/2026'
  },
  CNAMGS_TIS: {
    code: 'CNAMGS-TIS',
    label: 'CNAMGS – Travailleurs Indépendants & Secteur Informel (TIS)',
    shortLabel: 'CNAMGS Indépendants (TIS)',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '💼',
    color: '#0284c7',
    coverageRate: '80%',
    copay: '20% (Ticket modérateur)',
    tiers_payant: true,
    contact: '1488 / +241 01 74 24 00',
    description: 'Régime d\'adhésion pour artisans, commerçants et professions libérales. Prise en charge conventionnée de 80% du panier de soins.',
    validity: '31/12/2026'
  },
  CNAMGS_ETUD: {
    code: 'CNAMGS-ETUD',
    label: 'CNAMGS – Étudiants de l\'Enseignement Supérieur & Scolaires',
    shortLabel: 'CNAMGS Étudiants & Scolaires',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '🎓',
    color: '#0891b2',
    coverageRate: '80%',
    copay: '20% (100% urgences hospitalières)',
    tiers_payant: true,
    contact: '1488 / +241 01 74 24 00',
    description: 'Couverture sociale dédiée aux étudiants universités UOB, USTMAS, USTM et grandes écoles du Gabon.',
    validity: '31/12/2026'
  },
  CNSS: {
    code: 'CNSS-ATMP',
    label: 'CNSS – Risques Professionnels (Accidents du Travail & Maladies Pro)',
    shortLabel: 'CNSS Risques Professionnels',
    group: 'public',
    groupName: 'Régimes Publics Obligatoires (CNAMGS & CNSS)',
    logo: '🛡️',
    color: '#d97706',
    coverageRate: '100%',
    copay: '0% (Prise en charge intégrale par la caisse)',
    tiers_payant: true,
    contact: '+241 01 70 26 62',
    description: 'Prise en charge directe à 100% des frais médicaux, chirurgicaux, rééducation et hospitalisation suite accident sur le lieu de travail ou trajet.',
    validity: '31/12/2026'
  },

  // ── Mutuelles Professionnelles & Ministérielles ───────────────────
  MUTUELLE_EDUC: {
    code: 'MUT-EDUC',
    label: 'Mutuelle de l\'Éducation Nationale (MEN)',
    shortLabel: 'Mutuelle Éducation (MEN)',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '📚',
    color: '#0891b2',
    coverageRate: '85%',
    copay: '15% (Complémentaire CNAMGS)',
    tiers_payant: true,
    contact: '+241 01 72 05 11',
    description: 'Complémentaire santé pour enseignants et personnels administratifs du Ministère de l\'Éducation Nationale.',
    validity: '31/12/2026'
  },
  MUTUELLE_SANTE: {
    code: 'MUT-SANTE',
    label: 'Mutuelle des Agents du Ministère de la Santé (MAMS)',
    shortLabel: 'Mutuelle Agents de Santé',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '⚕️',
    color: '#dc2626',
    coverageRate: '90%',
    copay: '10% (Exonération interne CHU)',
    tiers_payant: true,
    contact: '+241 01 76 42 38',
    description: 'Couverture renforcée pour les soignants, médecins et personnels techniques des 4 CHU et hôpitaux régionaux.',
    validity: '31/12/2026'
  },
  MUTUELLE_FORCES_ARMEES: {
    code: 'MUT-FA',
    label: 'Mutuelle des Forces de Défense et de Sécurité (FAG, Police, Gendarmerie)',
    shortLabel: 'Mutuelle Forces Armées (FAG)',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '🎖️',
    color: '#065f46',
    coverageRate: '95%',
    copay: '5% (Accès prioritaire HIA-OBO et CHU)',
    tiers_payant: true,
    contact: '+241 01 77 15 70',
    description: 'Couverture étendue pour militaires, gendarmes, policiers et ayants droit avec convention inter-hospitalière et HIA-OBO.',
    validity: '31/12/2026'
  },
  MUTUELLE_MAGISTRATURE: {
    code: 'MUT-MAG',
    label: 'Mutuelle de la Magistrature et des Personnels de Justice',
    shortLabel: 'Mutuelle Justice & Magistrats',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '⚖️',
    color: '#92400e',
    coverageRate: '85%',
    copay: '15%',
    tiers_payant: true,
    contact: '+241 01 74 13 90',
    description: 'Prise en charge complémentaire des magistrats et greffiers des cours et tribunaux de Libreville et de province.',
    validity: '31/12/2026'
  },
  MUTUELLE_GABON_TELECOM: {
    code: 'MUT-GT',
    label: 'Mutuelle Gabon Telecom / Moov Africa Libertis',
    shortLabel: 'Mutuelle Telecom / Moov',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '📡',
    color: '#0369a1',
    coverageRate: '80%',
    copay: '20%',
    tiers_payant: true,
    contact: '+241 01 79 72 00',
    description: 'Couverture santé groupe des salariés du secteur télécoms et réseaux au Gabon.',
    validity: '31/12/2026'
  },
  MUTUELLE_PETROLE: {
    code: 'MUT-PETROL',
    label: 'Mutuelle des Hydrocarbures & Sociétés Pétrolières (Total, Perenco, Assala)',
    shortLabel: 'Mutuelle Hydrocarbures Pétrole',
    group: 'mutuelle',
    groupName: 'Mutuelles Professionnelles & Ministérielles',
    logo: '🛢️',
    color: '#b45309',
    coverageRate: '95%',
    copay: '5% (Plafond de soins haute garantie)',
    tiers_payant: true,
    contact: '+241 01 55 60 00',
    description: 'Garantie d\'excellence santé pour personnels de l\'industrie pétrolière à Port-Gentil, Gamba et Libreville.',
    validity: '31/12/2026'
  },

  // ── Compagnies d'Assurance Privées & Tiers Payant ──────────────────
  ASCOMA_GABON: {
    code: 'ASCOMA',
    label: 'ASCOMA Gabon – Réseau Tiers-Payant Santé & Gestion Déléguée',
    shortLabel: 'ASCOMA Santé Gabon',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🌐',
    color: '#2563eb',
    coverageRate: '80% à 100%',
    copay: 'Variable selon police (0% à 20%)',
    tiers_payant: true,
    contact: '+241 01 74 32 32 / +241 077 19 20 21',
    description: 'Leader du tiers-payant médical au Gabon. Télé-transmission directe avec les cliniques et CHU partenaires.',
    validity: '31/12/2026'
  },
  OGAR: {
    code: 'OGAR',
    label: 'OGAR – Omnium Gabonais d\'Assurances et de Réassurances',
    shortLabel: 'OGAR Assurances',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🟠',
    color: '#ea580c',
    coverageRate: '80%',
    copay: '20% (Réseau conventionné de soins)',
    tiers_payant: true,
    contact: '+241 01 72 13 04',
    description: 'Compagnie historique gabonaise. Prise en charge hospitalière, chirurgicale et pharmaceutique.',
    validity: '31/12/2026'
  },
  AXA_GABON: {
    code: 'AXA-GAB',
    label: 'AXA Assurances Gabon – Couverture Maladie & Hospitalisation',
    shortLabel: 'AXA Assurances',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🔴',
    color: '#be123c',
    coverageRate: '85%',
    copay: '15%',
    tiers_payant: true,
    contact: '+241 01 72 09 09',
    description: 'Contrats groupe santé et individuels avec garantie d\'évacuation sanitaire et prise en charge hospitalière.',
    validity: '31/12/2026'
  },
  NSIA_VIE: {
    code: 'NSIA-VIE',
    label: 'NSIA Assurances Gabon (Vie & Santé)',
    shortLabel: 'NSIA Assurances',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🔵',
    color: '#1d4ed8',
    coverageRate: '80%',
    copay: '20%',
    tiers_payant: true,
    contact: '+241 01 74 97 00',
    description: 'Prise en charge intégrée santé entreprise et particulier dans les cliniques et hôpitaux de référence.',
    validity: '31/12/2026'
  },
  SANLAM_GABON: {
    code: 'SANLAM',
    label: 'Sanlam Assurance Gabon (ex-Saham)',
    shortLabel: 'Sanlam Assurance',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🔷',
    color: '#0284c7',
    coverageRate: '80%',
    copay: '20%',
    tiers_payant: true,
    contact: '+241 01 76 15 15',
    description: 'Réseau panafricain de santé avec entente préalable pour hospitalisations et interventions au Gabon.',
    validity: '31/12/2026'
  },
  SUNU_GABON: {
    code: 'SUNU',
    label: 'SUNU Assurances Gabon',
    shortLabel: 'SUNU Assurances',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '☀️',
    color: '#d97706',
    coverageRate: '80%',
    copay: '20%',
    tiers_payant: true,
    contact: '+241 01 74 35 30',
    description: 'Assurance santé et prévoyance avec prise en charge directe auprès des pharmacies et centres hospitaliers.',
    validity: '31/12/2026'
  },
  ASSINCO: {
    code: 'ASSINCO',
    label: 'ASSINCO – Assurances Incomparables du Gabon',
    shortLabel: 'ASSINCO Gabon',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🟢',
    color: '#15803d',
    coverageRate: '75%',
    copay: '25%',
    tiers_payant: true,
    contact: '+241 01 76 03 50',
    description: 'Contrats santé PME et grands comptes avec tiers-payant pharmacie et hospitalisation.',
    validity: '31/12/2026'
  },
  COLINA_GABON: {
    code: 'COLINA',
    label: 'Colina Gabon – Prévoyance & Soins de Santé',
    shortLabel: 'Colina Gabon',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '⚪',
    color: '#475569',
    coverageRate: '80%',
    copay: '20%',
    tiers_payant: true,
    contact: '+241 01 74 37 80',
    description: 'Prise en charge hospitalière et soins ambulatoires.',
    validity: '31/12/2026'
  },
  GRAS_SAVOYE: {
    code: 'WTW-GS',
    label: 'WTW Gras Savoye Gabon – Courtage Santé & Gestion Tiers-Payant',
    shortLabel: 'WTW Gras Savoye',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '📑',
    color: '#4338ca',
    coverageRate: '85%',
    copay: '15%',
    tiers_payant: true,
    contact: '+241 01 76 28 00',
    description: 'Gestion déléguée pour entreprises multinationales et pétrolières au Gabon.',
    validity: '31/12/2026'
  },
  UAG: {
    code: 'UAG',
    label: 'UAG – Union des Assurances du Gabon',
    shortLabel: 'UAG Assurances',
    group: 'privee',
    groupName: 'Compagnies d\'Assurance Privées & Tiers Payant',
    logo: '🟡',
    color: '#a16207',
    coverageRate: '70%',
    copay: '30%',
    tiers_payant: false,
    contact: '+241 01 72 30 00',
    description: 'Remboursement sur facture acquittée ou entente préalable pour actes lourds.',
    validity: '31/12/2026'
  },

  // ── Régimes Spécifiques & Internationaux ──────────────────────────
  AME_DIPLOMATIQUE: {
    code: 'AME-DIP',
    label: 'Aide Médicale – Corps Diplomatique & Consulaire (AME)',
    shortLabel: 'Corps Diplomatique / AME',
    group: 'internationale',
    groupName: 'Régimes Spécifiques & Internationaux',
    logo: '🌍',
    color: '#0f766e',
    coverageRate: '100%',
    copay: '0% (Prise en charge d\'ambassade)',
    tiers_payant: true,
    contact: '+241 01 76 10 00',
    description: 'Couverture internationale pour diplomates, consuls et coopérants accrédités en République Gabonaise.',
    validity: '31/12/2026'
  },
  MSF_COUVERTURE: {
    code: 'MSF',
    label: 'MSF / ONG Humanitaire – Prise en charge d\'Urgence Directe',
    shortLabel: 'MSF / Humanitaire',
    group: 'internationale',
    groupName: 'Régimes Spécifiques & Internationaux',
    logo: '🏥',
    color: '#dc2626',
    coverageRate: '100%',
    copay: '0% (Financement d\'urgence ONG)',
    tiers_payant: true,
    contact: '+241 077 00 47 22',
    description: 'Prise en charge humanitaire directe pour personnes déplacées, réfugiés ou cas d\'extrême détresse médicale.',
    validity: '31/12/2026'
  },

  // ── Sans Couverture d'Assurance ───────────────────────────────────
  NON_ASSURE: {
    code: 'AUCUNE',
    label: 'Non Assuré – Paiement Direct au Comptant (Ticket 100%)',
    shortLabel: 'Non Assuré (Direct)',
    group: 'aucune',
    groupName: 'Sans Couverture d\'Assurance',
    logo: '💰',
    color: '#64748b',
    coverageRate: '0%',
    copay: '100% à charge du patient ou de la famille',
    tiers_payant: false,
    contact: 'Service Facturation & Recouvrement CHU',
    description: 'Plein tarif appliqué selon la nomenclature hospitalière. Paiement au comptant exigé avant délivrance d\'actes programmés.',
    validity: 'Non applicable'
  }
};

// Fonctions utilitaires d'assurance
const InsuranceService = {
  get(key) {
    return INSURANCE_LIST[key] || INSURANCE_LIST.NON_ASSURE;
  },

  renderBadge(key) {
    const ins = this.get(key);
    let badgeClass = 'insurance-badge-public';
    if (ins.group === 'public' && ins.coverageRate === '100%') badgeClass = 'insurance-badge-pvnr';
    else if (ins.group === 'mutuelle') badgeClass = 'insurance-badge-mutuelle';
    else if (ins.group === 'privee') badgeClass = 'insurance-badge-privee';
    else if (ins.group === 'aucune') badgeClass = 'insurance-badge-aucune';

    return `
      <span class="insurance-badge ${badgeClass}" title="${ins.label} - Taux: ${ins.coverageRate}">
        <span>${ins.logo}</span>
        <span>${ins.shortLabel}</span>
        <span style="font-weight: 700; opacity: 0.9; margin-left: 2px;">(${ins.coverageRate})</span>
      </span>
    `;
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.INSURANCE_LIST = INSURANCE_LIST;
  window.InsuranceService = InsuranceService;
}
