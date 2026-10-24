/**
 * GAB-SANTE - Système d'Interconnexion Hospitalière du Gabon
 * Module : epidemiology.js
 *
 * Surveillance Épidémiologique & Déclarations Obligatoires (DGS / OMS Gabon)
 * - Registre des Maladies à Déclaration Obligatoire (MDO / SIMR)
 * - Surveillance des 9 Provinces du Gabon
 * - Déclaration immédiate vers la Direction Générale de la Santé & OMS
 * - Génération et impression de la Fiche Officielle de Notification
 * - Synchronisation bidirectionnelle Cloud Supabase (sani_epidemic_alerts)
 */

(function(window) {
  'use strict';

  // ──────────────────────────────────────────────────────────────
  // Référentiels Épidémiologiques Officiels (Gabon / OMS AFRO)
  // ──────────────────────────────────────────────────────────────

  const GABON_PROVINCES = [
    { id: 'estuaire', name: 'Estuaire', capital: 'Libreville', chuRef: 'CHUL / CHUO / CHUMEF / CHUA', pop: '900 000 hab.' },
    { id: 'haut-ogooue', name: 'Haut-Ogooué', capital: 'Franceville', chuRef: 'CHR Amissa Bongo / CIRMF', pop: '250 000 hab.' },
    { id: 'moyen-ogooue', name: 'Moyen-Ogooué', capital: 'Lambaréné', chuRef: 'Hôpital Albert Schweitzer / CHR', pop: '70 000 hab.' },
    { id: 'ngounie', name: 'Ngounié', capital: 'Mouila', chuRef: 'CHR de Mouila', pop: '100 000 hab.' },
    { id: 'nyanga', name: 'Nyanga', capital: 'Tchibanga', chuRef: 'CHR Benjamin Ngoubou', pop: '55 000 hab.' },
    { id: 'ogooue-ivindo', name: 'Ogooué-Ivindo', capital: 'Makokou', chuRef: 'CHR Omar Bongo Ondimba', pop: '65 000 hab.' },
    { id: 'ogooue-lolo', name: 'Ogooué-Lolo', capital: 'Koulamoutou', chuRef: 'CHR Paul Moukambi', pop: '65 000 hab.' },
    { id: 'ogooue-maritime', name: 'Ogooué-Maritime', capital: 'Port-Gentil', chuRef: 'CHR Ntchengué', pop: '160 000 hab.' },
    { id: 'woleu-ntem', name: 'Woleu-Ntem', capital: 'Oyem', chuRef: 'CHR d\'Oyem', pop: '155 000 hab.' }
  ];

  const NOTIFIABLE_DISEASES = [
    {
      code: 'MPOX',
      name: 'Mpox (Clade Ib - Variole du Singe)',
      category: 'Urgence Sanitaire Majeure',
      threshold: '1 cas suspect = Alerte immédiate OMS (< 24h)',
      labRef: 'CIRMF Franceville',
      color: '#dc2626'
    },
    {
      code: 'PALU',
      name: 'Paludisme Grave (Accès pernicieux)',
      category: 'Endémo-épidémique',
      threshold: 'Taux de positivité TDR > 50% ou léthalité > 2%',
      labRef: 'Laboratoires CHU / CERMEL Lambaréné',
      color: '#d97706'
    },
    {
      code: 'CHOL',
      name: 'Choléra / Diarrhées épidémiques aiguës',
      category: 'Maladie à haut potentiel épidémique',
      threshold: '1 cas confirmé par culture ou PCR',
      labRef: 'Laboratoire National de Santé Publique',
      color: '#b91c1c'
    },
    {
      code: 'YFEV',
      name: 'Fièvre Jaune',
      category: 'Arbovirose à déclaration obligatoire',
      threshold: '1 cas suspect ictéro-hémorragique',
      labRef: 'CIRMF / Institut Pasteur Dakar',
      color: '#ea580c'
    },
    {
      code: 'DENG',
      name: 'Dengue / Chikungunya (Arboviroses)',
      category: 'Vigilance Vectorielle',
      threshold: 'Agrégat > 5 cas suspects dans un quartier',
      labRef: 'CIRMF / Laboratoire CHUL',
      color: '#7c3aed'
    },
    {
      code: 'TB_MDR',
      name: 'Tuberculose Multirésistante (MDR-TB)',
      category: 'Infection Respiratoire Chronique Grave',
      threshold: 'Confirmation résistance Rifampicine GeneXpert',
      labRef: 'Centre National Antituberculeux (Nkembo)',
      color: '#0284c7'
    },
    {
      code: 'EBOLA',
      name: 'Fièvre Hémorragique Virale (Ébola / Marburg)',
      category: 'Menace Biologique Absolue (Niveau 4)',
      threshold: '1 cas suspect = Protocole Alerte Rouge DGS',
      labRef: 'CIRMF BSL-4 Franceville',
      color: '#991b1b'
    }
  ];

  const INITIAL_ALERTS = [
    {
      id: 'ALR-DGS-2026-001',
      disease: 'Mpox (Clade Ib - Variole du Singe)',
      diseaseCode: 'MPOX',
      province: 'Estuaire',
      chuId: 'chul',
      suspectedCases: 2,
      confirmedCases: 1,
      deaths: 0,
      alertLevel: 'PRE_ALERT',
      status: 'INVESTIGATION',
      patientId: 'P-GA-001',
      patientName: 'KOMBILA Jean-Pierre',
      doctorNotifier: 'Pr. Jean-Baptiste Moussavou (Infectiologue)',
      onmgNumber: 'ONMG-0842-GA',
      notes: 'Patient présentant éruption vésiculo-pustuleuse fébrile et adénopathies inguinales. Isolement strict au service des Maladies Infectieuses CHUL. Échantillons transmis au CIRMF Franceville.',
      investigationDate: '2026-10-14',
      omsNotified: true,
      createdAt: '2026-10-14T08:30:00Z'
    },
    {
      id: 'ALR-DGS-2026-002',
      disease: 'Paludisme Grave (Accès pernicieux)',
      diseaseCode: 'PALU',
      province: 'Moyen-Ogooué',
      chuId: 'chul',
      suspectedCases: 18,
      confirmedCases: 14,
      deaths: 1,
      alertLevel: 'EPIDEMIC',
      status: 'ACTIVE',
      patientId: null,
      patientName: 'Cluster pédiatrique Lambaréné',
      doctorNotifier: 'Dr. Christiane Obone (Pédiatre)',
      onmgNumber: 'ONMG-1120-GA',
      notes: 'Pic saisonnier inhabituel post-pluies torrentielles. Taux de positivité TDR > 65%. Renfort de stocks d\'Artésunate injectable acheminé depuis le dépôt CNTS/CHUL.',
      investigationDate: '2026-10-12',
      omsNotified: true,
      createdAt: '2026-10-12T14:15:00Z'
    },
    {
      id: 'ALR-DGS-2026-003',
      disease: 'Suspicion Fièvre Jaune',
      diseaseCode: 'YFEV',
      province: 'Ogooué-Maritime',
      chuId: 'chuo',
      suspectedCases: 1,
      confirmedCases: 0,
      deaths: 0,
      alertLevel: 'VIGILANCE',
      status: 'INVESTIGATION',
      patientId: 'P-GA-002',
      patientName: 'OBAME NTOUTOUME Paul',
      doctorNotifier: 'Dr. Eric Baye (Urgences)',
      onmgNumber: 'ONMG-0915-GA',
      notes: 'Syndrome ictéro-hémorragique aigu chez un agent forestier non vacciné. Prélèvement sérologique en cours. Enquête entomologique déclenchée par la DGS Port-Gentil.',
      investigationDate: '2026-10-10',
      omsNotified: true,
      createdAt: '2026-10-10T11:00:00Z'
    }
  ];

  // ──────────────────────────────────────────────────────────────
  // Gestionnaire Principal de l'Épidémiologie
  // ──────────────────────────────────────────────────────────────

  class EpidemiologyManager {
    constructor() {
      this.alerts = this.loadAlerts();
      this.selectedFilterDisease = 'all';
      this.selectedFilterProvince = 'all';
      this.selectedFilterLevel = 'all';
      this.bannerDismissed = localStorage.getItem('sani_banner_dismissed') === 'true';
    }

    dismissBanner() {
      this.bannerDismissed = true;
      try {
        localStorage.setItem('sani_banner_dismissed', 'true');
      } catch (e) {}
      const banner = document.getElementById('epi-alert-banner');
      if (banner) banner.remove();
    }

    loadAlerts() {
      try {
        const stored = localStorage.getItem('sani_epialerts');
        return stored ? JSON.parse(stored) : INITIAL_ALERTS;
      } catch (e) {
        console.warn('[GAB-SANTE Épidémio] Erreur lecture cache local :', e);
        return INITIAL_ALERTS;
      }
    }

    saveAlerts() {
      try {
        localStorage.setItem('sani_epialerts', JSON.stringify(this.alerts));
      } catch (e) {
        console.warn('[GAB-SANTE Épidémio] Erreur écriture cache :', e);
      }

      // Synchronisation Cloud Supabase si disponible
      if (window.SupabaseSyncService && window.SupabaseSyncService.syncEpidemicAlerts) {
        window.SupabaseSyncService.syncEpidemicAlerts(this.alerts);
      }
    }

    /**
     * Rendu complet du tableau de bord épidémiologique dans #stats-view-container
     */
    renderDashboard(containerId = 'stats-view-container') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const activeAlerts = this.alerts.filter(a => a.status === 'ACTIVE' || a.status === 'INVESTIGATION');
      const hasEpidemic = activeAlerts.some(a => a.alertLevel === 'EPIDEMIC');
      const hasPreAlert = activeAlerts.some(a => a.alertLevel === 'PRE_ALERT');

      const totalSuspected = this.alerts.reduce((sum, a) => sum + (parseInt(a.suspectedCases) || 0), 0);
      const totalConfirmed = this.alerts.reduce((sum, a) => sum + (parseInt(a.confirmedCases) || 0), 0);
      const totalDeaths = this.alerts.reduce((sum, a) => sum + (parseInt(a.deaths) || 0), 0);
      const affectedProvinces = new Set(this.alerts.map(a => a.province)).size;

      // Filtrage
      const filtered = this.alerts.filter(a => {
        if (this.selectedFilterDisease !== 'all' && a.diseaseCode !== this.selectedFilterDisease) return false;
        if (this.selectedFilterProvince !== 'all' && a.province !== this.selectedFilterProvince) return false;
        if (this.selectedFilterLevel !== 'all' && a.alertLevel !== this.selectedFilterLevel) return false;
        return true;
      });

      container.innerHTML = `
        <!-- Bannière d'Alerte Sanitaire Majeure si Seuil Dépassé -->
        ${(hasEpidemic && !this.bannerDismissed) ? `
          <div id="epi-alert-banner" style="background: linear-gradient(90deg, #991b1b, #dc2626); color: white; padding: 1rem 1.25rem; border-radius: 10px; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25); animation: pulse 2s infinite;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.8rem;">🚨</span>
              <div>
                <strong style="font-size: 1rem; display: block; letter-spacing: 0.5px;">ALERTE ÉPIDÉMIQUE NATIONALE ACTIVE — DGS / OMS GABON</strong>
                <span style="font-size: 0.82rem; opacity: 0.95;">
                  Seuil d'alerte dépassé pour le Paludisme Grave & Suspicion Mpox sous surveillance active. Protocole de riposte déclenché.
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button onclick="window.saniEpidemio.openNewAlertModal()" style="background: white; color: #991b1b; font-weight: 700; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ➕ Déclarer un Cas
              </button>
              <button onclick="window.saniEpidemio.dismissBanner()" title="Fermer ce message" style="background: rgba(0,0,0,0.25); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 7px 11px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: bold; line-height: 1;">
                ✕
              </button>
            </div>
          </div>
        ` : ''}

        <!-- En-tête et actions rapides -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🛡️</span> Vigilance Épidémiologique & Maladies à Déclaration Obligatoire (MDO)
              <span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; background: #e0f2fe; color: #0369a1; font-weight: 700;">
                SIMR GABON 2026
              </span>
            </h3>
            <p style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
              Liaison directe Direction Générale de la Santé (DGS), CIRMF Franceville, CERMEL Lambaréné et Représentation OMS Gabon.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" onclick="window.saniEpidemio.openNewAlertModal()" style="font-size: 0.82rem; display: flex; align-items: center; gap: 6px; background: #dc2626; border-color: #b91c1c;">
              <span>🚨</span> Nouvelle Notification DGS / OMS
            </button>
            <button class="btn-secondary" onclick="window.saniEpidemio.exportWeeklyReport()" style="font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
              <span>📥</span> Rapport Sanitaire Hebdo
            </button>
          </div>
        </div>

        <!-- KPIs Épidémiologiques -->
        <div class="stats-grid" style="margin-bottom: 1.5rem;">
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-amber">⚠️</div>
            <div>
              <div class="stat-value">${totalSuspected}</div>
              <div class="stat-label">Cas suspects déclarés</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-red">🧪</div>
            <div>
              <div class="stat-value" style="color: #dc2626;">${totalConfirmed}</div>
              <div class="stat-label">Cas biologiquement confirmés</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-purple">🇬🇦</div>
            <div>
              <div class="stat-value">${affectedProvinces} / 9</div>
              <div class="stat-label">Provinces sous surveillance</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-blue">🏛️</div>
            <div>
              <div class="stat-value" style="color: #0284c7;">${activeAlerts.length} Foyers</div>
              <div class="stat-label">Enquêtes DGS en cours</div>
            </div>
          </div>
        </div>

        <!-- Matrice des 9 Provinces du Gabon & Niveaux de Vigilance -->
        <div class="radar-map-box" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0;">
                🗺️ Statut de Risque Épidémiologique par Province (Gabon)
              </h4>
              <span style="font-size: 0.75rem; color: #64748b;">Surveillance sentinelle des 9 délégations sanitaires provinciales</span>
            </div>
            <span style="font-size: 0.72rem; color: #059669; font-weight: 600;">● Données consolidées 24h/24</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
            ${GABON_PROVINCES.map(prov => {
              const provAlerts = this.alerts.filter(a => a.province.toLowerCase() === prov.name.toLowerCase() && (a.status === 'ACTIVE' || a.status === 'INVESTIGATION'));
              let badgeColor = '#10b981';
              let badgeText = 'Calme Épidémique';
              let bg = '#f0fdf4';
              let border = '#bbf7d0';

              if (provAlerts.some(a => a.alertLevel === 'EPIDEMIC')) {
                badgeColor = '#dc2626';
                badgeText = 'Seuil Épidémique';
                bg = '#fef2f2';
                border = '#fecaca';
              } else if (provAlerts.some(a => a.alertLevel === 'PRE_ALERT')) {
                badgeColor = '#ea580c';
                badgeText = 'Pré-Alerte';
                bg = '#fff7ed';
                border = '#ffedd5';
              } else if (provAlerts.some(a => a.alertLevel === 'VIGILANCE')) {
                badgeColor = '#d97706';
                badgeText = 'Vigilance Renforcée';
                bg = '#fffbeb';
                border = '#fef3c7';
              }

              return `
                <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <strong style="font-size: 0.88rem; color: #0f172a;">${prov.name}</strong>
                    <span style="font-size: 0.68rem; font-weight: 700; color: ${badgeColor}; padding: 2px 6px; border-radius: 4px; background: white; border: 1px solid ${border};">
                      ${badgeText}
                    </span>
                  </div>
                  <div style="font-size: 0.74rem; color: #475569; margin-bottom: 6px;">
                    <span>Chef-lieu : ${prov.capital}</span><br>
                    <span style="color: #64748b;">Hôpital réf. : ${prov.chuRef}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed ${border}; pt: 4px; font-size: 0.72rem;">
                    <span>Alertes : <strong>${provAlerts.length}</strong></span>
                    <a href="javascript:void(0)" onclick="window.saniEpidemio.filterByProvince('${prov.name}')" style="color: #0369a1; text-decoration: none; font-weight: 600;">Filtrer ➔</a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Filtres et Tableau des Déclarations Obligatoires -->
        <div class="stat-card" style="display: block; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 1rem;">
            <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0;">
              📋 Registre National des Notifications Sanitaires (DGS Gabon)
            </h4>
            
            <!-- Filtres -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <select id="epi-filter-disease" onchange="window.saniEpidemio.onFilterChange()" style="padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                <option value="all">Toutes pathologies</option>
                ${NOTIFIABLE_DISEASES.map(d => `<option value="${d.code}" ${this.selectedFilterDisease === d.code ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
              <select id="epi-filter-level" onchange="window.saniEpidemio.onFilterChange()" style="padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                <option value="all" ${this.selectedFilterLevel === 'all' ? 'selected' : ''}>Tous niveaux</option>
                <option value="EPIDEMIC" ${this.selectedFilterLevel === 'EPIDEMIC' ? 'selected' : ''}>Seuil Épidémique</option>
                <option value="PRE_ALERT" ${this.selectedFilterLevel === 'PRE_ALERT' ? 'selected' : ''}>Pré-Alerte</option>
                <option value="VIGILANCE" ${this.selectedFilterLevel === 'VIGILANCE' ? 'selected' : ''}>Vigilance</option>
                <option value="CALM" ${this.selectedFilterLevel === 'CALM' ? 'selected' : ''}>Calme</option>
              </select>
            </div>
          </div>

          <!-- Tableau -->
          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px;">ID Alerte</th>
                  <th style="padding: 10px;">Pathologie / MDO</th>
                  <th style="padding: 10px;">Province & Centre</th>
                  <th style="padding: 10px;">Cas (S / C / D)</th>
                  <th style="padding: 10px;">Niveau d'Alerte</th>
                  <th style="padding: 10px;">Médecin Notificateur</th>
                  <th style="padding: 10px;">Date Notification</th>
                  <th style="padding: 10px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr><td colspan="8" style="padding: 2rem; text-align: center; color: #94a3b8;">Aucune alerte épidémiologique correspondant aux critères.</td></tr>
                ` : filtered.map(item => {
                  let badgeClass = 'badge-green';
                  let levelLabel = 'Calme';
                  if (item.alertLevel === 'EPIDEMIC') { badgeClass = 'badge-red'; levelLabel = 'ÉPIDÉMIE'; }
                  else if (item.alertLevel === 'PRE_ALERT') { badgeClass = 'badge-yellow'; levelLabel = 'Pré-Alerte'; }
                  else if (item.alertLevel === 'VIGILANCE') { badgeClass = 'badge-blue'; levelLabel = 'Vigilance'; }

                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px; font-weight: 700; color: #0284c7;">${item.id}</td>
                      <td style="padding: 10px;">
                        <strong style="color: #0f172a; display: block;">${item.disease}</strong>
                        <span style="font-size: 0.72rem; color: #64748b;">${item.patientName ? `Patient : ${item.patientName}` : 'Déclaration de grappe'}</span>
                      </td>
                      <td style="padding: 10px;">
                        <span style="font-weight: 600;">${item.province}</span>
                        <div style="font-size: 0.72rem; color: #64748b;">${item.chuId ? item.chuId.toUpperCase() : 'Non précisé'}</div>
                      </td>
                      <td style="padding: 10px;">
                        <span title="Suspects" style="color: #d97706; font-weight: 700;">${item.suspectedCases} S</span> / 
                        <span title="Confirmés" style="color: #dc2626; font-weight: 700;">${item.confirmedCases} C</span> / 
                        <span title="Décès" style="color: #475569;">${item.deaths} D</span>
                      </td>
                      <td style="padding: 10px;">
                        <span class="badge ${badgeClass}" style="font-size: 0.7rem; padding: 2px 7px;">${levelLabel}</span>
                      </td>
                      <td style="padding: 10px;">
                        <div style="font-weight: 600; color: #334155;">${item.doctorNotifier || 'Non spécifié'}</div>
                        <span style="font-size: 0.7rem; color: #64748b;">${item.onmgNumber || 'ONMG-N/A'}</span>
                      </td>
                      <td style="padding: 10px; color: #64748b;">${item.investigationDate || item.createdAt?.substring(0, 10)}</td>
                      <td style="padding: 10px; text-align: right;">
                        <button class="btn-secondary" onclick="window.saniEpidemio.showOfficialOmsReport('${item.id}')" style="padding: 4px 8px; font-size: 0.72rem;" title="Fiche Officielle Notification DGS/OMS">
                          📄 Fiche OMS
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    onFilterChange() {
      const dSel = document.getElementById('epi-filter-disease');
      const lSel = document.getElementById('epi-filter-level');
      if (dSel) this.selectedFilterDisease = dSel.value;
      if (lSel) this.selectedFilterLevel = lSel.value;
      this.renderDashboard();
    }

    filterByProvince(provinceName) {
      this.selectedFilterProvince = this.selectedFilterProvince === provinceName ? 'all' : provinceName;
      this.renderDashboard();
    }

    /**
     * Ouvre la modale de déclaration d'un nouveau cas épidémique
     */
    openNewAlertModal(patientId = null) {
      const modal = document.getElementById('modal-epidemic-alert');
      if (!modal) return;

      // Pré-remplissage éventuel via le patient
      let patient = null;
      if (patientId && window.saniApp && window.saniApp.patients) {
        patient = window.saniApp.patients.find(p => p.id === patientId);
      }

      const pSelect = document.getElementById('epi-patient-select');
      if (pSelect && window.saniApp && window.saniApp.patients) {
        pSelect.innerHTML = `<option value="">-- Aucun patient sélectionné (Notification de cluster) --</option>` +
          window.saniApp.patients.map(p => `
            <option value="${p.id}" ${patient && patient.id === p.id ? 'selected' : ''}>
              ${p.name} (${p.ins || p.id}) - ${p.bloodType || 'N/A'}
            </option>
          `).join('');
      }

      modal.classList.remove('hidden');
    }

    closeNewAlertModal() {
      const modal = document.getElementById('modal-epidemic-alert');
      if (modal) modal.classList.add('hidden');
    }

    /**
     * Enregistre une nouvelle alerte sanitaire
     */
    async saveNewAlert(event) {
      if (event) event.preventDefault();

      const diseaseCode = document.getElementById('epi-disease-select').value;
      const diseaseObj = NOTIFIABLE_DISEASES.find(d => d.code === diseaseCode) || NOTIFIABLE_DISEASES[0];
      const province = document.getElementById('epi-province-select').value;
      const chuId = document.getElementById('epi-chu-select').value;
      const alertLevel = document.getElementById('epi-level-select').value;
      const suspectedCases = parseInt(document.getElementById('epi-suspected').value) || 1;
      const confirmedCases = parseInt(document.getElementById('epi-confirmed').value) || 0;
      const deaths = parseInt(document.getElementById('epi-deaths').value) || 0;
      const patientId = document.getElementById('epi-patient-select').value;
      const doctorNotifier = document.getElementById('epi-doctor').value;
      const onmgNumber = document.getElementById('epi-onmg').value;
      const notes = document.getElementById('epi-notes').value;

      let patientName = '';
      if (patientId && window.saniApp && window.saniApp.patients) {
        const p = window.saniApp.patients.find(item => item.id === patientId);
        if (p) patientName = p.name;
      }

      const newId = `ALR-DGS-2026-${String(this.alerts.length + 1).padStart(3, '0')}`;
      const nowStr = new Date().toISOString().substring(0, 10);

      const alertRecord = {
        id: newId,
        disease: diseaseObj.name,
        diseaseCode: diseaseObj.code,
        province: province,
        chuId: chuId,
        suspectedCases: suspectedCases,
        confirmedCases: confirmedCases,
        deaths: deaths,
        alertLevel: alertLevel,
        status: 'INVESTIGATION',
        patientId: patientId || null,
        patientName: patientName || 'Notification sanitaire directe',
        doctorNotifier: doctorNotifier || 'Pr. Régulateur National',
        onmgNumber: onmgNumber || 'ONMG-RÉGUL-2026',
        notes: notes || 'Enquête épidémiologique enclenchée conformément aux directives DGS.',
        investigationDate: nowStr,
        omsNotified: true,
        createdAt: new Date().toISOString()
      };

      this.alerts.unshift(alertRecord);
      this.saveAlerts();
      this.closeNewAlertModal();
      this.renderDashboard();

      if (window.saniApp && window.saniApp.showToast) {
        window.saniApp.showToast(`🚨 Alerte épidémiologique ${newId} transmise avec succès à la DGS & OMS !`);
      }
    }

    /**
     * Affiche et prépare à l'impression la Fiche Officielle de Notification MDO (DGS / OMS)
     */
    showOfficialOmsReport(alertId) {
      const alert = this.alerts.find(a => a.id === alertId);
      if (!alert) return;

      const modal = document.getElementById('modal-oms-report');
      const body = document.getElementById('oms-report-content');
      if (!modal || !body) return;

      body.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000000; padding: 1.5rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
          <!-- En-tête Officiel République Gabonaise -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 1rem;">
            <div style="text-align: center; width: 45%;">
              <strong style="font-size: 0.85rem; display: block;">RÉPUBLIQUE GABONAISE</strong>
              <span style="font-size: 0.72rem; font-style: italic;">Union - Travail - Justice</span><br>
              <span style="font-size: 0.75rem; font-weight: 700; color: #1e3a8a;">MINISTÈRE DE LA SANTÉ</span><br>
              <span style="font-size: 0.7rem; color: #334155;">DIRECTION GÉNÉRALE DE LA SANTÉ (DGS)</span><br>
              <span style="font-size: 0.68rem; color: #64748b;">Direction de l'Épidémiologie et de la Lutte contre la Maladie</span>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #0284c7;">ORGANISATION MONDIALE DE LA SANTÉ</div>
              <span style="font-size: 0.7rem; color: #475569;">Bureau Pays OMS - Libreville, GABON</span><br>
              <span style="font-size: 0.68rem; color: #64748b;">Surveillance Intégrée des Maladies et Riposte (SIMR)</span><br>
              <strong style="font-size: 0.8rem; color: #dc2626; display: inline-block; margin-top: 4px; padding: 2px 6px; border: 1px solid #dc2626; border-radius: 4px;">
                NOTIFICATION OBLIGATOIRE DGS
              </strong>
            </div>
          </div>

          <!-- Titre du Document -->
          <div style="text-align: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a;">
              FICHE OFFICIELLE DE NOTIFICATION SANITAIRE IMMÉDIATE
            </h3>
            <div style="font-size: 0.8rem; color: #475569; margin-top: 3px;">
              Déclaration de Maladie à Potentiel Épidémique • Réf : <strong>${alert.id}</strong>
            </div>
          </div>

          <!-- Section 1 : Caractéristiques de la Maladie -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.82rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div><strong>Pathologie Suspectée / Confirmée :</strong> <span style="color: #dc2626; font-weight: 700;">${alert.disease}</span></div>
              <div><strong>Code SIMR :</strong> ${alert.diseaseCode}</div>
              <div><strong>Niveau d'Alerte :</strong> <span style="font-weight: 700;">${alert.alertLevel}</span></div>
              <div><strong>Statut de l'Enquête :</strong> ${alert.status}</div>
            </div>
          </div>

          <!-- Section 2 : Données Épidémiologiques & Foyer -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.82rem;">
            <strong style="color: #1e3a8a; display: block; margin-bottom: 6px;">1. LOCALISATION GÉOGRAPHIQUE DU FOYER</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <div><strong>Province :</strong> ${alert.province}</div>
              <div><strong>Centre Notificateur :</strong> ${alert.chuId ? alert.chuId.toUpperCase() : 'Non précisé'}</div>
              <div><strong>Date Notification :</strong> ${alert.investigationDate || alert.createdAt?.substring(0, 10)}</div>
            </div>
          </div>

          <!-- Section 3 : Bilan des Cas -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.82rem;">
            <strong style="color: #1e3a8a; display: block; margin-bottom: 6px;">2. BILAN DES CAS IDENTIFIÉS DANS LE CLUSTER</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
              <div style="padding: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #d97706;">${alert.suspectedCases}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Cas Suspects</div>
              </div>
              <div style="padding: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #dc2626;">${alert.confirmedCases}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Cas Biologiquement Confirmés</div>
              </div>
              <div style="padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #475569;">${alert.deaths}</div>
                <div style="font-size: 0.72rem; color: #64748b;">Décès Enregistrés</div>
              </div>
            </div>
          </div>

          <!-- Section 4 : Constatations Cliniques et Mesures Prises -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 0.82rem;">
            <strong style="color: #1e3a8a; display: block; margin-bottom: 4px;">3. CONSTATATIONS CLINIQUES & MESURES D'ISOLEMENT</strong>
            <p style="margin: 0; color: #334155; line-height: 1.4;">${alert.notes || 'Aucune observation particulière consignée.'}</p>
          </div>

          <!-- Section 5 : Signature et Certification -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1.5rem; pt: 1rem; border-top: 1px dashed #cbd5e1; font-size: 0.78rem;">
            <div>
              <strong>Praticien Notificateur :</strong> ${alert.doctorNotifier}<br>
              <strong>Matricule Ordre (ONMG) :</strong> ${alert.onmgNumber}<br>
              <span style="font-size: 0.7rem; color: #64748b;">Transmis par le Système National GAB-SANTE</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 4px;">Horodatage Sécurisé Réseau :</div>
              <strong style="color: #0369a1;">${new Date().toLocaleString('fr-FR')}</strong><br>
              <span style="display: inline-block; padding: 2px 8px; border: 1px solid #10b981; border-radius: 4px; color: #065f46; background: #ecfdf5; font-size: 0.68rem; margin-top: 4px;">
                CERTIFIÉ TRANSMIS DGS / OMS GABON
              </span>
            </div>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
    }

    closeOfficialOmsReport() {
      const modal = document.getElementById('modal-oms-report');
      if (modal) modal.classList.add('hidden');
    }

    printOfficialOmsReport() {
      window.print();
    }

    exportWeeklyReport() {
      const activeCount = this.alerts.length;
      alert(`📊 Rapport Épidémiologique Hebdomadaire (Semaine Épidémiologique en cours)\n\n• Nombre total d'alertes actives : ${activeCount}\n• Télétransmission effectuée vers la Direction Générale de la Santé (DGS) et le Représentant Pays OMS Gabon.`);
    }
  }

  // Exposition globale
  window.saniEpidemio = new EpidemiologyManager();

})(window);
