/**
 * GAB-SANTE - Système d'Interconnexion Hospitalière Universitaire du Gabon
 * Contrôleur Principal de l'Application (SaniGabonApp)
 *
 * Dépendances modulaires (chargées depuis le même dossier) :
 * - data.js          : Référentiel des CHU, hôpitaux nationaux, patients DMP, transferts et sang.
 * - insurances.js    : Nomenclature officielle CNAMGS, CNSS, Mutuelles et Assurances privées.
 * - fhir.js          : Moteur d'interopérabilité internationale HL7 FHIR R4.
 * - radar-map.js     : Carte radar géosanitaire interactive de l'Estuaire.
 * - fiche-navette.js : Fiche navette SAMU 1300, QR Code et impression certifiée.
 */

class SaniGabonApp {
  constructor() {
    this.currentChu = 'chul';
    this.currentView = 'overview';
    this.activeInsuranceFilter = 'all';

    // Chargement persistant avec rétrocompatibilité
    const rawPatients = this.loadData('sani_patients', window.INITIAL_PATIENTS || []);
    this.patients = rawPatients.map(p => {
      if (!p.insurance) {
        if (p.cnamgs && p.cnamgs.includes('JE')) p.insurance = 'CNAMGS_PVNR';
        else if (p.cnamgs && p.cnamgs.includes('ANG')) p.insurance = 'OGAR';
        else p.insurance = 'CNAMGS_FONC';
      }
      return p;
    });

    this.transfers = this.loadData('sani_transfers', window.INITIAL_TRANSFERS || []);
    this.teleExpertise = this.loadData('sani_rcp', window.INITIAL_TELE_EXPERTISE || []);
    this.bloodStocks = this.loadData('sani_blood', window.INITIAL_BLOOD_STOCK || {});
    this.chuStatus = this.loadData('sani_chu_status', window.CHU_DATA || {});
    // Auto-recalibrage si ancien cache local saturé (> 500 lits occupés au CHUL)
    if (this.chuStatus.chul && this.chuStatus.chul.occupiedBeds > 500 && window.CHU_DATA) {
      Object.keys(window.CHU_DATA).forEach(k => {
        if (this.chuStatus[k]) {
          this.chuStatus[k].occupiedBeds = window.CHU_DATA[k].occupiedBeds;
          this.chuStatus[k].reaOccupied = window.CHU_DATA[k].reaOccupied;
        }
      });
      this.saveData('sani_chu_status', this.chuStatus, true);
    }
    this.cntsRequisitions = this.loadData('sani_cnts_requisitions', window.INITIAL_CNTS_REQUISITIONS || []);
    this.bedLogs = this.loadData('sani_bed_logs', window.INITIAL_BED_LOGS || []);
    this.prescriptions = this.loadData('sani_prescriptions', window.INITIAL_PRESCRIPTIONS || []);

    this.selectedPatient = null;
    this.currentPrescriptionId = null;
    this.init();
  }

  // Stockage local persistant
  loadData(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.warn(`[GAB-SANTE] Erreur chargement clé "${key}" :`, e);
      return fallback;
    }
  }

  saveData(key, value, skipCloudSync = false) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[GAB-SANTE] Erreur sauvegarde clé "${key}" :`, e);
    }

    if (skipCloudSync) return;

    // Synchronisation automatique en arrière-plan vers le Cloud Supabase (Santé-Gab)
    if (window.SupabaseSyncService && window.SupabaseSyncService.isConnected) {
      const syncKeys = [
        'sani_patients', 'sani_prescriptions', 'sani_transfers', 
        'sani_chu_status', 'sani_rcp', 'sani_blood', 
        'sani_cnts_requisitions', 'sani_bed_logs', 'sani_epialerts'
      ];
      if (syncKeys.includes(key)) {
        window.SupabaseSyncService.pushAllLocalDataToCloud();
      }
    }
  }

  // Initialisation applicative
  init() {
    this.refreshAllChuSelects();
    this.populateInsuranceSelect();
    this.setupEventListeners();
    this.renderCurrentView();
    this.updateLiveStats();
    this.startClock();

    // Connexion automatique et synchronisation temps réel Santé-Gab Cloud
    if (window.SupabaseSyncService) {
      window.SupabaseSyncService.init(this);
    }
  }

  // Configuration des écouteurs d'événements
  setupEventListeners() {
    // Navigation principale par onglets
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Sélecteur d'hôpital actif dans la barre supérieure
    const chuSelect = document.getElementById('current-chu-select');
    if (chuSelect) {
      chuSelect.addEventListener('change', (e) => {
        this.currentChu = e.target.value;
        const chuName = this.chuStatus[this.currentChu]?.name || this.currentChu;
        this.showToast(`Établissement actif : ${chuName}`);
        this.renderCurrentView();
      });
    }

    // Boutons de fermeture des modales
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Actions rapides topbar
    const btnNewTransfer = document.getElementById('btn-new-transfer');
    if (btnNewTransfer) {
      btnNewTransfer.addEventListener('click', () => this.openTransferModal());
    }

    const btnNewPatient = document.getElementById('btn-new-patient');
    if (btnNewPatient) {
      btnNewPatient.addEventListener('click', () => this.openPatientModal());
    }

    const btnNewRcp = document.getElementById('btn-new-rcp');
    if (btnNewRcp) {
      btnNewRcp.addEventListener('click', () => this.openRcpModal());
    }
  }

  // Horloge en direct heure du Gabon (UTC+1)
  startClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    const updateTime = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('fr-FR', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }) + ' (Gabon UTC+1)';
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // Routage des vues
  switchView(viewId) {
    this.currentView = viewId;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.app-view').forEach(viewEl => {
      viewEl.style.display = viewEl.id === `view-${viewId}` ? 'block' : 'none';
    });

    this.renderCurrentView();
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'overview':
        this.renderOverview();
        break;
      case 'dmp':
        this.renderDmp();
        break;
      case 'transfers':
        this.renderTransfers();
        break;
      case 'tele-expertise':
        this.renderTeleExpertise();
        break;
      case 'blood':
        this.renderBloodBank();
        break;
      case 'stats':
        this.renderStats();
        break;
      case 'fhir':
        this.renderFhirViewer();
        break;
      case 'ai-assistant':
        this.renderAiAssistantView();
        break;
    }
  }

  // Mise à jour synchrone de tous les menus déroulants d'hôpitaux
  refreshAllChuSelects() {
    const chuList = Object.values(this.chuStatus);

    // 1. Topbar Active CHU Select
    const topbarSelect = document.getElementById('current-chu-select');
    if (topbarSelect) {
      topbarSelect.innerHTML = chuList.map(c => `
        <option value="${c.id}" ${c.id === this.currentChu ? 'selected' : ''}>
          ${c.name}
        </option>
      `).join('');
    }

    // 2. Transfer Destination Select
    const transferSelect = document.getElementById('transfer-dest-select');
    if (transferSelect) {
      transferSelect.innerHTML = chuList.map(c => `
        <option value="${c.id}">
          ${c.name} (${c.pole})
        </option>
      `).join('');
    }

    // 3. New Patient CHU Select
    const patientChuSelect = document.getElementById('new-patient-chu');
    if (patientChuSelect) {
      patientChuSelect.innerHTML = chuList.map(c => `
        <option value="${c.id}">
          ${c.name}
        </option>
      `).join('');
    }

    // 4. Blood Requisition CHU Select
    const bloodChuSelect = document.getElementById('blood-req-chu');
    if (bloodChuSelect) {
      bloodChuSelect.innerHTML = chuList.map(c => `
        <option value="${c.id}">
          ${c.name}
        </option>
      `).join('');
    }

    // 5. RCP Specialist CHU Select
    const rcpChuSelect = document.getElementById('rcp-dest-chu');
    if (rcpChuSelect) {
      rcpChuSelect.innerHTML = chuList.map(c => `
        <option value="${c.id}">
          ${c.name} (${c.pole})
        </option>
      `).join('');
    }
  }

  // =========================================================================
  // GESTION DES RÉGIMES D'ASSURANCE MALADIE DU GABON
  // =========================================================================
  getInsurance(key) {
    if (window.InsuranceService) return window.InsuranceService.get(key);
    return (window.INSURANCE_LIST && window.INSURANCE_LIST[key]) || {
      code: 'CNAMGS-FONC', label: 'CNAMGS Fonctionnaires', shortLabel: 'CNAMGS', coverageRate: '80%', copay: '20%', tiers_payant: true
    };
  }

  renderInsuranceBadge(key) {
    if (window.InsuranceService) return window.InsuranceService.renderBadge(key);
    const ins = this.getInsurance(key);
    return `<span class="insurance-badge insurance-badge-public"><span>${ins.logo || '🏛️'}</span> <span>${ins.shortLabel || ins.label}</span></span>`;
  }

  populateInsuranceSelect() {
    const select = document.getElementById('new-patient-insurance');
    if (!select || !window.INSURANCE_LIST) return;

    const list = window.INSURANCE_LIST;
    const groups = {};
    Object.keys(list).forEach(k => {
      const item = list[k];
      if (!groups[item.groupName]) groups[item.groupName] = [];
      groups[item.groupName].push({ key: k, ...item });
    });

    let html = '';
    Object.keys(groups).forEach(gName => {
      html += `<optgroup label="${gName}">`;
      groups[gName].forEach(ins => {
        html += `<option value="${ins.key}" ${ins.key === 'CNAMGS_FONC' ? 'selected' : ''}>${ins.logo} ${ins.label} (${ins.coverageRate})</option>`;
      });
      html += `</optgroup>`;
    });

    select.innerHTML = html;
    this.onInsuranceChange(select.value || 'CNAMGS_FONC');
  }

  onInsuranceChange(key) {
    const ins = this.getInsurance(key);
    const hintBox = document.getElementById('insurance-hint-box');
    if (!hintBox) return;

    hintBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; flex-wrap: wrap; gap: 4px;">
        <strong>${ins.logo} ${ins.label}</strong>
        <span class="badge ${ins.coverageRate === '100%' ? 'badge-green' : ins.tiers_payant ? 'badge-blue' : 'badge-yellow'}">
          Taux Prise en Charge : ${ins.coverageRate}
        </span>
      </div>
      <div>
        <strong>Ticket modérateur :</strong> ${ins.copay} | 
        <strong>Tiers-payant :</strong> ${ins.tiers_payant ? '<span style="color:#059669; font-weight:600;">✓ Convention Tiers-Payant Actif</span>' : '<span style="color:#dc2626;">⚠️ Plein Tarif (Paiement direct)</span>'}
      </div>
      <div style="font-size: 0.72rem; color: #475569; margin-top: 3px;">
        ℹ️ ${ins.description}
      </div>
    `;
  }

  filterPatientsByInsurance(filterKey, buttonEl) {
    this.activeInsuranceFilter = filterKey;
    document.querySelectorAll('#insurance-filter-pills .filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn === buttonEl);
    });

    const rows = document.querySelectorAll('#dmp-patients-table-body tr');
    rows.forEach(r => {
      const insCode = r.getAttribute('data-insurance');
      const insGroup = r.getAttribute('data-insurance-group');
      if (filterKey === 'all') {
        r.style.display = '';
      } else if (filterKey === 'mutuelle' || filterKey === 'privee' || filterKey === 'public') {
        r.style.display = insGroup === filterKey ? '' : 'none';
      } else {
        r.style.display = insCode === filterKey ? '' : 'none';
      }
    });
  }

  verifyInsuranceRights(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;
    const ins = this.getInsurance(patient.insurance);
    const container = document.getElementById(`rights-verification-status-${patient.id}`);
    if (!container) return;

    container.innerHTML = `
      <span style="font-size: 0.74rem; color: #0284c7;">
        ⏳ Interrogation du serveur télématique ${ins.code}...
      </span>
    `;

    setTimeout(() => {
      if (ins.code === 'AUCUNE') {
        container.innerHTML = `
          <div class="rights-check-result rights-warning">
            <span>⚠️</span>
            <div>
              <strong>Aucune prise en charge active</strong><br>
              Patient non affilié. Facturation au comptant obligatoire (Ticket modérateur 100%).
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="rights-check-result rights-valid">
            <span>✅</span>
            <div>
              <strong>DROITS OUVERTS & VALIDÉS (Serveur Télématique Santé Gabon)</strong><br>
              Organisme : <strong>${ins.label}</strong> | N° Droits : <code>${patient.cnamgs}</code><br>
              Statut : À jour de cotisations • Taux : <strong>${ins.coverageRate}</strong> (TM patient : ${ins.copay})<br>
              Validité : <strong>${ins.validity}</strong> • Convention Tiers-Payant : <strong>${ins.tiers_payant ? 'Accordée' : 'Facturation différée'}</strong>
            </div>
          </div>
        `;
        this.showToast(`Droits ${ins.shortLabel} vérifiés et validés pour ${patient.name} !`);
      }
    }, 600);
  }

  // =========================================================================
  // VUE 1 : VUE D'ENSEMBLE, LITS ET CARTE RADAR
  // =========================================================================
  updateLiveStats() {
    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalRea = 0;
    let occupiedRea = 0;
    const chuList = Object.values(this.chuStatus);

    chuList.forEach(c => {
      totalBeds += c.totalBeds;
      occupiedBeds += c.occupiedBeds;
      totalRea += c.reaBeds;
      occupiedRea += c.reaOccupied;
    });

    const occRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const reaRate = totalRea > 0 ? Math.round((occupiedRea / totalRea) * 100) : 0;

    const totalBedsEl = document.getElementById('stat-total-beds');
    if (totalBedsEl) totalBedsEl.textContent = `${occupiedBeds} / ${totalBeds}`;

    const occRateEl = document.getElementById('stat-occ-rate');
    if (occRateEl) occRateEl.textContent = `${occRate}%`;

    const reaBedsEl = document.getElementById('stat-rea-beds');
    if (reaBedsEl) reaBedsEl.textContent = `${occupiedRea} / ${totalRea} (${reaRate}%)`;

    const connectedChuEl = document.getElementById('stat-connected-chu');
    if (connectedChuEl) connectedChuEl.textContent = `${chuList.length} Structures`;
  }

  renderOverview() {
    const container = document.getElementById('chu-cards-container');
    if (!container) return;

    container.innerHTML = Object.values(this.chuStatus).map(chu => {
      const pct = chu.totalBeds > 0 ? Math.round((chu.occupiedBeds / chu.totalBeds) * 100) : 0;
      const isCritical = pct > 88;
      const isWarning = pct >= 75 && pct <= 88;
      const barColor = isCritical ? '#dc2626' : isWarning ? '#f59e0b' : '#10b981';
      const statusBadge = isCritical ? 'badge-red' : isWarning ? 'badge-yellow' : 'badge-green';
      const statusLabel = isCritical ? 'Tension Forte / Saturé' : isWarning ? 'Flux Tendu' : 'Capacité Fluide';

      return `
        <div class="chu-card">
          <div class="chu-card-header">
            <div>
              <span class="chu-tag ${chu.tagClass || 'tag-custom'}">${chu.shortName}</span>
              <h3 style="font-size: 1.05rem; font-weight: 700; margin-top: 6px; color: #0f172a;">${chu.name}</h3>
              <p style="font-size: 0.78rem; color: #64748b;">📍 ${chu.location}</p>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="badge ${statusBadge}">
                ${statusLabel}
              </span>
              ${chu.isCustom ? `
                <button onclick="saniApp.disconnectHospital('${chu.id}')" title="Déconnecter cette structure" style="background: none; border: none; color: #dc2626; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">
                  Déconnecter
                </button>
              ` : ''}
            </div>
          </div>
          <div class="chu-body">
            <div style="font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">
              Pôle Spécialisé: <span style="font-weight: 400; color: #475569;">${chu.pole}</span>
            </div>

            <div style="margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #64748b;">
                <span>Occupation globale</span>
                <strong>${pct}% (${chu.occupiedBeds}/${chu.totalBeds})</strong>
              </div>
              <div class="progress-bar-container">
                <div class="progress-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
              </div>
            </div>

            <!-- Contrôles interactifs des Lits en direct -->
            <div style="margin-bottom: 10px;">
              <div class="bed-stepper">
                <span class="bed-stepper-label">🛏️ Lits Conv. Occupés</span>
                <div class="bed-stepper-controls">
                  <button class="bed-stepper-btn" onclick="saniApp.adjustBeds('${chu.id}', 'occupied', -1)" title="Libérer 1 lit conv.">-</button>
                  <span class="bed-stepper-value">${chu.occupiedBeds} / ${chu.totalBeds}</span>
                  <button class="bed-stepper-btn" onclick="saniApp.adjustBeds('${chu.id}', 'occupied', +1)" title="Occuper 1 lit conv.">+</button>
                </div>
              </div>

              <div class="bed-stepper" style="margin-top: 5px;">
                <span class="bed-stepper-label">🫁 Lits Réa Occupés</span>
                <div class="bed-stepper-controls">
                  <button class="bed-stepper-btn" onclick="saniApp.adjustBeds('${chu.id}', 'rea', -1)" title="Libérer 1 lit réa">-</button>
                  <span class="bed-stepper-value" style="color: ${chu.reaBeds - chu.reaOccupied <= 2 ? '#dc2626' : '#0284c7'}; font-weight: 800;">
                    ${chu.reaOccupied} / ${chu.reaBeds}
                  </span>
                  <button class="bed-stepper-btn" onclick="saniApp.adjustBeds('${chu.id}', 'rea', +1)" title="Occuper 1 lit réa">+</button>
                </div>
              </div>
            </div>

            <div class="bed-metrics" style="margin-bottom: 8px;">
              <div>
                <span style="color:#64748b; font-size:0.75rem;">Lits Dispos</span>
                <strong>${chu.totalBeds - chu.occupiedBeds}</strong>
              </div>
              <div>
                <span style="color:#64748b; font-size:0.75rem;">Réa Libres</span>
                <strong style="color: ${chu.reaBeds - chu.reaOccupied <= 2 ? '#dc2626' : '#0284c7'};">
                  ${chu.reaBeds - chu.reaOccupied}
                </strong>
              </div>
              <div>
                <span style="color:#64748b; font-size:0.75rem;">Urgences 24/7</span>
                <strong style="color: #10b981;">Actif</strong>
              </div>
            </div>

            <div style="font-size: 0.76rem; color: #475569; margin-bottom: 10px; background: #f1f5f9; padding: 6px 10px; border-radius: 6px;">
              📞 <strong>Régulation:</strong> ${chu.emergencyPhone || chu.phone} | ${chu.director}
            </div>

            <div style="display: flex; gap: 6px; margin-bottom: 6px;">
              <button class="btn-secondary" style="flex: 1; justify-content: center; font-size: 0.76rem;" onclick="saniApp.filterPatientsByChu('${chu.id}')">
                👥 Patients (${this.patients.filter(p => p.currentLocation === chu.id).length})
              </button>
              <button class="btn-primary" style="flex: 1; justify-content: center; font-size: 0.76rem;" onclick="saniApp.initiateTransferTo('${chu.id}')">
                🚑 Transférer ici
              </button>
            </div>

            <button class="btn-secondary" style="width: 100%; justify-content: center; font-size: 0.74rem; padding: 4px;" onclick="saniApp.openAdjustCapacityModal('${chu.id}')">
              ⚙️ Paramétrer Capacité & Lits
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.renderInteractiveRadarMap();
  }

  // Ajustement en direct des lits (+ / -) avec audit
  adjustBeds(chuId, type, delta) {
    const chu = this.chuStatus[chuId];
    if (!chu) return;

    if (type === 'occupied') {
      const nextVal = chu.occupiedBeds + delta;
      if (nextVal < 0) {
        this.showToast(`Nombre de lits occupés au minimum (0).`);
        return;
      }
      if (nextVal > chu.totalBeds) {
        this.showToast(`Capacité maximale atteinte (${chu.totalBeds} lits).`);
        return;
      }
      chu.occupiedBeds = nextVal;
      this.logBedMovement(chuId, chu.shortName, 'occupied', 'Lit Conventionnel', delta, delta > 0 ? 'Admission patient' : 'Sortie / Décharge patient');
      this.showToast(`${chu.shortName} : Lits conventionnels occupés = ${chu.occupiedBeds}/${chu.totalBeds}`);
    } else if (type === 'rea') {
      const nextVal = chu.reaOccupied + delta;
      if (nextVal < 0) {
        this.showToast(`Nombre de lits réa occupés au minimum (0).`);
        return;
      }
      if (nextVal > chu.reaBeds) {
        this.showToast(`Capacité réa maximale atteinte (${chu.reaBeds} lits).`);
        return;
      }
      chu.reaOccupied = nextVal;
      this.logBedMovement(chuId, chu.shortName, 'rea', 'Lit Réanimation', delta, delta > 0 ? 'Entrée Réa d\'urgence' : 'Sortie / Mutation Réa');
      this.showToast(`${chu.shortName} : Lits réanimation occupés = ${chu.reaOccupied}/${chu.reaBeds} (${chu.reaBeds - chu.reaOccupied} libres)`);
    }

    this.saveData('sani_chu_status', this.chuStatus);
    if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
      window.SupabaseSyncService.syncChuStatus(chuId, chu);
    }
    this.updateLiveStats();
    this.renderOverview();
  }

  // Enregistrement dans le journal d'audit des lits
  logBedMovement(chuId, chuName, type, typeName, delta, reason) {
    const entry = {
      timestamp: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' +
                 new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      chu: chuId,
      chuName: chuName,
      type: type,
      typeName: typeName,
      delta: delta,
      reason: reason,
      user: 'Régulateur Médical (Poste actif)'
    };
    this.bedLogs.unshift(entry);
    if (this.bedLogs.length > 50) this.bedLogs.pop();
    this.saveData('sani_bed_logs', this.bedLogs);
  }

  // Modale d'ajustement global de la capacité d'un CHU
  openAdjustCapacityModal(chuId) {
    const chu = this.chuStatus[chuId];
    if (!chu) return;

    const modal = document.getElementById('modal-adjust-chu-capacity');
    if (!modal) return;

    document.getElementById('adjust-chu-id').value = chu.id;
    document.getElementById('adjust-chu-modal-title').textContent = `⚙️ Paramétrage Capacité : ${chu.name}`;
    document.getElementById('adjust-chu-subtitle').textContent = `Pôle : ${chu.pole} • Localisation : ${chu.location}`;
    document.getElementById('adjust-chu-total-beds').value = chu.totalBeds;
    document.getElementById('adjust-chu-occupied-beds').value = chu.occupiedBeds;
    document.getElementById('adjust-chu-rea-beds').value = chu.reaBeds;
    document.getElementById('adjust-chu-rea-occupied').value = chu.reaOccupied;

    modal.classList.remove('hidden');
  }

  submitAdjustCapacity(e) {
    e.preventDefault();
    const chuId = document.getElementById('adjust-chu-id').value;
    const chu = this.chuStatus[chuId];
    if (!chu) return;

    const totalBeds = parseInt(document.getElementById('adjust-chu-total-beds').value, 10);
    const occupiedBeds = parseInt(document.getElementById('adjust-chu-occupied-beds').value, 10);
    const reaBeds = parseInt(document.getElementById('adjust-chu-rea-beds').value, 10);
    const reaOccupied = parseInt(document.getElementById('adjust-chu-rea-occupied').value, 10);
    const reason = document.getElementById('adjust-chu-reason').value.trim();

    if (occupiedBeds > totalBeds) {
      alert("Erreur : Le nombre de lits conventionnels occupés ne peut dépasser le total de lits.");
      return;
    }
    if (reaOccupied > reaBeds) {
      alert("Erreur : Le nombre de lits de réanimation occupés ne peut dépasser le total de lits réa.");
      return;
    }

    chu.totalBeds = totalBeds;
    chu.occupiedBeds = occupiedBeds;
    chu.reaBeds = reaBeds;
    chu.reaOccupied = reaOccupied;

    this.logBedMovement(chuId, chu.shortName, 'matrix', 'Matrice Globale', 0, reason || 'Réévaluation capacitaire manuelle');
    this.saveData('sani_chu_status', this.chuStatus);
    if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
      window.SupabaseSyncService.syncChuStatus(chuId, chu);
    }
    this.closeAllModals();
    this.updateLiveStats();
    this.renderOverview();
    this.showToast(`Capacités hospitalières de ${chu.name} mises à jour avec succès !`);
  }

  // Modale du Journal d'Audit des Mouvements de Lits
  openBedLogsModal() {
    const modal = document.getElementById('modal-bed-logs');
    const container = document.getElementById('bed-logs-list');
    if (!modal || !container) return;

    if (!this.bedLogs || this.bedLogs.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 1.5rem;">Aucun mouvement de lits consigné dans le registre.</div>`;
    } else {
      container.innerHTML = this.bedLogs.map(log => {
        const isPos = log.delta > 0;
        const deltaLabel = log.delta > 0 ? `+${log.delta}` : log.delta < 0 ? `${log.delta}` : '⚙️ Modif';
        const itemClass = log.delta > 0 ? 'delta-pos' : log.delta < 0 ? 'delta-neg' : '';
        return `
          <div class="bed-log-item ${itemClass}">
            <div>
              <strong>${log.chuName}</strong> — <span style="color: #475569;">${log.typeName} : <em>${log.reason}</em></span>
              <div style="font-size: 0.7rem; color: #64748b;">Par : ${log.user}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${log.delta > 0 ? 'badge-red' : log.delta < 0 ? 'badge-green' : 'badge-blue'}" style="font-weight: 700;">
                ${deltaLabel}
              </span>
              <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">${log.timestamp}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
  }

  renderInteractiveRadarMap() {
    if (window.RadarMapService) {
      window.RadarMapService.render('chu-interactive-map', this.chuStatus);
    }
  }

  // =========================================================================
  // VUE 2 : DOSSIER MÉDICAL PARTAGÉ (DMP-GABON)
  // =========================================================================
  renderDmp() {
    const listContainer = document.getElementById('dmp-patients-table-body');
    if (!listContainer) return;

    if (this.patients.length === 0) {
      listContainer.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">Aucun dossier médical dans la base.</td></tr>`;
      return;
    }

    listContainer.innerHTML = this.patients.map(p => {
      const ins = this.getInsurance(p.insurance);
      const chuObj = this.chuStatus[p.currentLocation] || (window.CHU_DATA && window.CHU_DATA[p.currentLocation]) || { shortName: p.currentLocation, tagClass: 'tag-chul' };
      return `
        <tr data-patient-id="${p.id}" data-insurance="${p.insurance || 'NON_ASSURE'}" data-insurance-group="${ins.group}">
          <td>
            <strong>${p.name}</strong><br>
            <span style="font-size: 0.75rem; color: #64748b;">Né(e) le ${p.birthdate} (${p.gender})</span>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 3px; align-items: flex-start;">
              ${this.renderInsuranceBadge(p.insurance)}
              <div style="font-size: 0.72rem; color: #475569; margin-top: 2px;">
                ${ins.tiers_payant ? '<span style="color: #059669; font-weight: 600;">✓ Tiers-Payant Actif</span>' : '<span style="color: #b91c1c;">⚠️ Ticket 100% Direct</span>'}
                <span style="color: #64748b; margin-left: 4px;">• TM: ${ins.copay.split(' ')[0]}</span>
              </div>
            </div>
          </td>
          <td>
            <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem;">${p.cnamgs}</code><br>
            <span style="font-size: 0.72rem; color: #0284c7;">${p.ins}</span>
          </td>
          <td>
            <span class="badge ${p.bloodType.includes('-') ? 'badge-red' : 'badge-blue'}">${p.bloodType}</span>
          </td>
          <td>
            <span class="chu-tag ${chuObj.tagClass || ''}">${chuObj.shortName}</span>
            <div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">${p.currentService}</div>
          </td>
          <td>
            <div style="max-width: 250px; font-size: 0.75rem; color: #334155;">
              ${p.chronicDiseases.join(', ')}
            </div>
            ${p.allergies.length > 0 && p.allergies[0] !== 'Aucune connue' ? `
              <div style="font-size: 0.72rem; color: #dc2626; font-weight: 600;">⚠️ Allergies: ${p.allergies.join(', ')}</div>
            ` : ''}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; margin-right: 4px; background: #7c3aed; color: white; border-color: #6d28d9;" onclick="saniApp.printPatientDmp('${p.id}')" title="Imprimer le Dossier Médical Partagé complet">
              🖨️ Imprimer
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; margin-right: 4px;" onclick="saniApp.openPatientSummary('${p.id}')" title="Synthèse Médicale Imprimable DMP">
              📄 Synthèse
            </button>
            <button class="btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="saniApp.viewPatientDmp('${p.id}')">
              📂 Consulter
            </button>
            <button class="btn-danger" style="padding: 0.35rem 0.55rem; font-size: 0.75rem; margin-left: 4px;" onclick="saniApp.deletePatient('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Supprimer définitivement ce patient">
              🗑️ Supprimer
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (this.activeInsuranceFilter && this.activeInsuranceFilter !== 'all') {
      const activeBtn = document.querySelector(`#insurance-filter-pills button[data-filter="${this.activeInsuranceFilter}"]`);
      if (activeBtn) this.filterPatientsByInsurance(this.activeInsuranceFilter, activeBtn);
    }
  }

  deletePatient(patientId, patientName) {
    const pName = patientName || 'ce patient';
    const confirmed = confirm(
      `⚠️ SÉCURITÉ SANITAIRE - GAB-SANTE\n\n` +
      `Êtes-vous certain de vouloir supprimer définitivement le Dossier Médical Partagé (DMP) de :\n` +
      `▶ ${pName} (ID: ${patientId})\n\n` +
      `Cette action retirera le dossier du réseau hospitalier national et sera consignée dans le registre d'audit.`
    );
    if (!confirmed) return;

    this.patients = this.patients.filter(p => p.id !== patientId);
    this.saveData('sani_patients', this.patients);

    if (this.selectedPatient && this.selectedPatient.id === patientId) {
      this.selectedPatient = null;
      document.getElementById('modal-dmp')?.classList.add('hidden');
    }

    this.renderDmp();
    this.updateLiveStats();
    this.showToast(`Dossier médical de ${pName} supprimé avec succès.`);
  }

  viewPatientDmp(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;
    this.selectedPatient = patient;

    const modalBody = document.getElementById('modal-dmp-body');
    const modalTitle = document.getElementById('modal-dmp-title');
    if (!modalBody || !modalTitle) return;

    modalTitle.innerHTML = `Dossier Médical Partagé Inter-CHU : <strong>${patient.name}</strong>`;
    const chuCurrent = this.chuStatus[patient.currentLocation] || (window.CHU_DATA && window.CHU_DATA[patient.currentLocation]) || { name: patient.currentLocation, tagClass: 'tag-chul' };
    const ins = this.getInsurance(patient.insurance);

    modalBody.innerHTML = `
      <!-- Bloc Identité & Sécurité -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem;">
          <h4 style="font-size: 0.85rem; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">Identité & Sécurité Sanitaire</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.82rem;">
            <div><strong>N° CNAMGS / Police :</strong> <code>${patient.cnamgs}</code></div>
            <div><strong>INS National :</strong> ${patient.ins}</div>
            <div><strong>Date de Naissance :</strong> ${patient.birthdate}</div>
            <div><strong>Localisation Actuelle :</strong> <span class="chu-tag ${chuCurrent.tagClass}">${chuCurrent.name}</span></div>
            <div><strong>Contact Référent :</strong> ${patient.contacts}</div>
            <div><strong>Service :</strong> ${patient.currentService}</div>
          </div>
        </div>

        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 1rem;">
          <h4 style="font-size: 0.85rem; color: #9f1239; margin-bottom: 8px; text-transform: uppercase;">Alerte Médicale Vitale</h4>
          <div style="font-size: 0.82rem;">
            <div style="margin-bottom: 6px;">
              <strong>Groupe Sanguin :</strong> 
              <span class="badge badge-red" style="font-size: 0.85rem;">${patient.bloodType}</span>
            </div>
            <div style="margin-bottom: 6px;">
              <strong>Allergies :</strong> 
              <span style="color: #b91c1c; font-weight: 600;">${patient.allergies.join(', ')}</span>
            </div>
            <div>
              <strong>Pathologies :</strong><br>
              ${patient.chronicDiseases.map(d => `<span class="badge badge-yellow" style="margin: 2px 2px 2px 0;">${d}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Bloc Régime d'Assurance Maladie & Droits Sociaux -->
      <div class="insurance-box">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 4px;">
              Couverture Santé & Droits Sociaux Gabon
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.35rem;">${ins.logo}</span>
              <div>
                <strong style="font-size: 0.95rem; color: #0f172a;">${ins.label}</strong>
                <div style="font-size: 0.76rem; color: #475569;">${ins.groupName} • Code : <code>${ins.code}</code></div>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span class="badge ${ins.group === 'public' && ins.coverageRate === '100%' ? 'badge-green' : ins.tiers_payant ? 'badge-blue' : 'badge-yellow'}" style="font-size: 0.82rem; padding: 4px 10px;">
              ${ins.coverageRate} Prise en charge
            </span>
            <span style="font-size: 0.74rem; font-weight: 600; color: ${ins.tiers_payant ? '#059669' : '#b91c1c'};">
              ${ins.tiers_payant ? '✓ Convention Tiers-Payant Actif' : '⚠️ Sans tiers-payant (Plein tarif direct)'}
            </span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px dashed #cbd5e1; font-size: 0.78rem;">
          <div><strong>Ticket modérateur :</strong> <span style="color: #0f4c81; font-weight: 600;">${ins.copay}</span></div>
          <div><strong>N° Immatriculation :</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${patient.cnamgs}</code></div>
          <div><strong>Centre de régulation :</strong> ${ins.contact}</div>
          <div><strong>Validité des droits :</strong> ${ins.validity}</div>
        </div>

        <div style="margin-top: 8px; font-size: 0.76rem; color: #475569; background: #ffffff; padding: 8px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
          ℹ️ <strong>Règles de prise en charge :</strong> ${ins.description}
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.7rem;" onclick="saniApp.verifyInsuranceRights('${patient.id}')">
            🔍 Télé-vérifier les Droits CNAMGS / Assureur en Direct
          </button>
          <div id="rights-verification-status-${patient.id}"></div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">Chronologie des Soins Inter-Hospitaliers</h4>
          <button class="btn-primary" style="font-size: 0.76rem; padding: 0.35rem 0.75rem;" onclick="saniApp.openAddPatientRecordModal('${patient.id}')">
            ➕ Ajouter un Acte / Consultation
          </button>
        </div>

        <div style="border-left: 2px solid #0072ce; margin-left: 10px; padding-left: 15px; display: flex; flex-direction: column; gap: 14px;">
          ${patient.history.map(h => {
            const chu = this.chuStatus[h.chu] || (window.CHU_DATA && window.CHU_DATA[h.chu]) || { shortName: h.chu, name: h.chu, tagClass: 'tag-chul' };
            return `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; position: relative;">
                <div style="position: absolute; left: -21px; top: 14px; width: 10px; height: 10px; border-radius: 50%; background: #0072ce;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div>
                    <span class="chu-tag ${chu.tagClass || ''}">${chu.shortName}</span>
                    <strong style="font-size: 0.85rem; margin-left: 6px;">${h.service}</strong> - <span style="font-size: 0.78rem; color: #64748b;">${h.doctor}</span>
                  </div>
                  <span style="font-size: 0.75rem; color: #94a3b8;">📅 ${h.date}</span>
                </div>
                <div style="font-size: 0.8rem; font-weight: 600; color: #0f4c81; margin-bottom: 4px;">Acte: ${h.type}</div>
                <p style="font-size: 0.82rem; color: #334155; line-height: 1.4;">${h.summary}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 0.75rem; color: #64748b;">Interopérabilité HL7/FHIR R4 certifiée - Synchronisation CNAMGS</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn-secondary" style="background: #7c3aed; color: white; border-color: #6d28d9;" onclick="saniApp.printPatientDmp('${patient.id}')" title="Imprimer le Dossier Médical Partagé">🖨️ Imprimer DMP</button>
          <button class="btn-secondary" style="background: #2563eb; color: white; border-color: #1d4ed8;" onclick="saniApp.dischargePatient('${patient.id}')" title="Déclarer la sortie médicale et libérer le lit d'hospitalisation">🛏️ Sortie & Libérer Lit</button>
          <button class="btn-danger" onclick="saniApp.deletePatient('${patient.id}', '${patient.name.replace(/'/g, "\\'")}')">🗑️ Supprimer ce Dossier</button>
          <button class="btn-secondary" onclick="saniApp.openPatientSummary('${patient.id}')">📄 Synthèse DMP Imprimable</button>
          <button class="btn-secondary" style="background: #059669; color: white; border-color: #059669;" onclick="saniApp.closeAllModals(); saniApp.openOrdonnanceModal('${patient.id}')">💊 Nouvelle Ordonnance</button>
          <button class="btn-secondary" style="background: #dc2626; color: white; border-color: #b91c1c;" onclick="saniApp.closeAllModals(); window.saniEpidemio.openNewAlertModal('${patient.id}')" title="Déclarer ce patient à la Direction Générale de la Santé / OMS">🚨 Alerte Épidémio DGS</button>
          <button class="btn-primary" onclick="saniApp.viewFhirForPatient('${patient.id}')">⚙️ Voir JSON FHIR</button>
        </div>
      </div>
    `;

    document.getElementById('modal-dmp').classList.remove('hidden');
  }

  // Sortie d'hospitalisation et libération de lit
  dischargePatient(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;

    const chu = this.chuStatus[patient.currentLocation];
    const chuName = chu ? chu.shortName : patient.currentLocation;

    const confirmed = confirm(
      `🛏️ LIBÉRATION DE LIT & SORTIE D'HOSPITALISATION\n\n` +
      `Patient : ${patient.name} (${patient.id})\n` +
      `Établissement : ${chuName}\n` +
      `Service actuel : ${patient.currentService || 'Hospitalisation'}\n\n` +
      `Confirmez-vous la sortie médicale du patient et la libération immédiate d'un lit d'hospitalisation ?`
    );
    if (!confirmed) return;

    patient.currentService = 'Sorti / Convalescence à domicile';
    patient.history.unshift({
      date: new Date().toISOString().split('T')[0],
      chu: patient.currentLocation,
      service: 'Sortie d\'Hospitalisation',
      doctor: chu?.director || 'Médecin Référent',
      type: 'Sortie & Décharge',
      summary: 'Sortie médicale autorisée. Lit d\'hospitalisation libéré dans le service.'
    });

    if (chu && chu.occupiedBeds > 0) {
      chu.occupiedBeds -= 1;
      this.logBedMovement(patient.currentLocation, chuName, 'occupied', 'Lit Conventionnel', -1, `Sortie autorisée : ${patient.name}`);
      this.saveData('sani_chu_status', this.chuStatus);
      if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
        window.SupabaseSyncService.syncChuStatus(patient.currentLocation, chu);
      }
    }

    this.saveData('sani_patients', this.patients);
    this.closeAllModals();
    this.showToast(`✅ Sortie enregistrée pour ${patient.name} — 1 lit libéré à ${chuName} !`);
    this.renderCurrentView();
    this.updateLiveStats();
  }

  // =========================================================================
  // GESTION DU RACCORDEMENT DES ÉTABLISSEMENTS
  // =========================================================================
  openHospitalModal() {
    const grid = document.getElementById('preset-hospital-grid');
    if (grid && window.PRESET_HOSPITALS) {
      grid.innerHTML = Object.keys(window.PRESET_HOSPITALS).map(k => {
        const p = window.PRESET_HOSPITALS[k];
        const isConnected = !!this.chuStatus[k];
        return `
          <div class="preset-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <strong style="font-size: 0.85rem; color: #0f172a;">${p.shortName}</strong>
                ${isConnected ? `
                  <span class="badge badge-green">Déjà Raccordé</span>
                ` : `
                  <span class="badge badge-blue">Disponible</span>
                `}
              </div>
              <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 4px;">📍 ${p.location}</div>
              <div style="font-size: 0.75rem; color: #334155; margin-bottom: 8px;">${p.pole} • <strong>${p.totalBeds} lits</strong></div>
            </div>
            ${isConnected ? `
              <button disabled class="btn-secondary" style="width: 100%; justify-content: center; font-size: 0.75rem; opacity: 0.6; cursor: default;">
                ✓ Connecté au Réseau
              </button>
            ` : `
              <button onclick="saniApp.quickAddHospital('${k}')" class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.75rem;">
                ⚡ Raccorder en 1 Clic
              </button>
            `}
          </div>
        `;
      }).join('');
    }

    document.getElementById('modal-new-hospital')?.classList.remove('hidden');
  }

  quickAddHospital(presetKey) {
    const preset = window.PRESET_HOSPITALS && window.PRESET_HOSPITALS[presetKey];
    if (!preset) return;

    this.chuStatus[presetKey] = { ...preset };
    this.saveData('sani_chu_status', this.chuStatus);
    if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
      window.SupabaseSyncService.syncChuStatus(presetKey, this.chuStatus[presetKey]);
    }

    if (!this.bloodStocks[presetKey]) {
      this.bloodStocks[presetKey] = {
        'O+': Math.floor(preset.totalBeds * 0.08),
        'O-': Math.floor(preset.totalBeds * 0.02),
        'A+': Math.floor(preset.totalBeds * 0.05),
        'A-': Math.floor(preset.totalBeds * 0.01),
        'B+': Math.floor(preset.totalBeds * 0.04),
        'B-': Math.floor(preset.totalBeds * 0.01),
        'AB+': Math.floor(preset.totalBeds * 0.02),
        'AB-': Math.floor(preset.totalBeds * 0.005)
      };
      this.saveData('sani_blood', this.bloodStocks);
    }

    this.refreshAllChuSelects();
    this.updateLiveStats();
    this.renderOverview();
    this.openHospitalModal();
    this.showToast(`Établissement "${preset.name}" raccordé au réseau GAB-SANTE avec succès !`);
  }

  submitNewHospital(e) {
    e.preventDefault();
    const name = document.getElementById('new-chu-name').value.trim();
    const code = document.getElementById('new-chu-code').value.trim().toUpperCase();
    const location = document.getElementById('new-chu-location').value.trim();
    const pole = document.getElementById('new-chu-pole').value.trim();
    const totalBeds = parseInt(document.getElementById('new-chu-total-beds').value, 10);
    const occupiedBeds = parseInt(document.getElementById('new-chu-occupied-beds').value, 10);
    const reaBeds = parseInt(document.getElementById('new-chu-rea-beds').value, 10);
    const director = document.getElementById('new-chu-director').value.trim();
    const phone = document.getElementById('new-chu-phone').value.trim();
    const specs = document.getElementById('new-chu-specialties').value.trim();

    const id = code.toLowerCase().replace(/[^a-z0-9]/g, '_');

    this.chuStatus[id] = {
      id: id,
      name: name,
      shortName: code,
      location: location,
      pole: pole,
      totalBeds: totalBeds,
      occupiedBeds: occupiedBeds,
      reaBeds: reaBeds,
      reaOccupied: Math.round(reaBeds * 0.65),
      director: director,
      phone: phone,
      emergencyPhone: phone,
      color: '#7c3aed',
      tagClass: 'tag-custom',
      isCustom: true,
      specialties: specs ? specs.split(',').map(s => s.trim()) : ['Médecine Générale'],
      coords: { x: 400, y: 200 }
    };

    if (!this.bloodStocks[id]) {
      this.bloodStocks[id] = {
        'O+': Math.floor(totalBeds * 0.07),
        'O-': Math.floor(totalBeds * 0.02),
        'A+': Math.floor(totalBeds * 0.04),
        'A-': Math.floor(totalBeds * 0.01),
        'B+': Math.floor(totalBeds * 0.03),
        'B-': Math.floor(totalBeds * 0.01),
        'AB+': Math.floor(totalBeds * 0.01),
        'AB-': 0
      };
      this.saveData('sani_blood', this.bloodStocks);
    }

    this.saveData('sani_chu_status', this.chuStatus);
    this.refreshAllChuSelects();
    this.updateLiveStats();
    this.renderOverview();
    this.closeAllModals();
    this.showToast(`Structure "${name}" raccordée au réseau national avec succès !`);
  }

  disconnectHospital(chuId) {
    const chu = this.chuStatus[chuId];
    if (!chu) return;

    if (confirm(`Êtes-vous sûr de vouloir déconnecter l'établissement "${chu.name}" du réseau GAB-SANTE ?`)) {
      delete this.chuStatus[chuId];
      this.saveData('sani_chu_status', this.chuStatus);
      if (this.currentChu === chuId) this.currentChu = 'chul';
      this.refreshAllChuSelects();
      this.updateLiveStats();
      this.renderOverview();
      this.showToast(`Établissement "${chu.name}" déconnecté du réseau.`);
    }
  }

  // =========================================================================
  // VUE 3 : RÉGULATION DES TRANSFERTS & FICHE NAVETTE SAMU 1300
  // =========================================================================
  renderTransfers() {
    const container = document.getElementById('transfers-table-body');
    if (!container) return;

    container.innerHTML = this.transfers.map(t => {
      const fromChu = this.chuStatus[t.fromChu] || (window.CHU_DATA && window.CHU_DATA[t.fromChu]) || { shortName: t.fromChu, tagClass: 'tag-chul' };
      const toChu = this.chuStatus[t.toChu] || (window.CHU_DATA && window.CHU_DATA[t.toChu]) || { shortName: t.toChu, tagClass: 'tag-chuo' };

      return `
        <tr>
          <td>
            <strong>${t.id}</strong><br>
            <span style="font-size: 0.72rem; color: #64748b;">${t.requestedAt}</span>
          </td>
          <td>
            <strong>${t.patientName}</strong><br>
            <span style="font-size: 0.72rem; color: #0284c7;">${t.gravityScore}</span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="chu-tag ${fromChu.tagClass}">${fromChu.shortName}</span>
              <span>➔</span>
              <span class="chu-tag ${toChu.tagClass}">${toChu.shortName}</span>
            </div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${t.transportMode}</div>
          </td>
          <td>
            <div style="max-width: 280px; font-size: 0.78rem; color: #334155; line-height: 1.3;">
              ${t.motif}
            </div>
            <div style="font-size: 0.72rem; color: #475569; margin-top: 2px;">
              De: ${t.doctorRequester} | Vers: ${t.doctorAcceptor}
            </div>
          </td>
          <td>
            <span class="badge ${t.statusClass}">${t.status}</span>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${t.completedAt}</div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${t.status === 'En cours de route' ? `
              <button class="btn-primary" style="padding: 0.35rem 0.7rem; font-size: 0.74rem;" onclick="saniApp.confirmArrival('${t.id}')">
                ✅ Confirmer Réception
              </button>
            ` : `
              <button class="btn-secondary" style="padding: 0.35rem 0.7rem; font-size: 0.74rem;" onclick="saniApp.openFicheNavette('${t.id}')">
                📄 Fiche Navette
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  openTransferModal() {
    const modal = document.getElementById('modal-transfer');
    if (!modal) return;

    const pSelect = document.getElementById('transfer-patient-select');
    if (pSelect) {
      pSelect.innerHTML = this.patients.map(p => `
        <option value="${p.id}">${p.name} (${p.cnamgs}) - Actuellement au ${this.chuStatus[p.currentLocation]?.shortName || p.currentLocation}</option>
      `).join('');
    }

    modal.classList.remove('hidden');
  }

  submitNewTransfer(e) {
    e.preventDefault();
    const patientId = document.getElementById('transfer-patient-select').value;
    const destChu = document.getElementById('transfer-dest-select').value;
    const motif = document.getElementById('transfer-motif').value;
    const gravity = document.getElementById('transfer-gravity').value;
    const transport = document.getElementById('transfer-transport').value;

    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;

    const destObj = this.chuStatus[destChu] || { name: destChu, director: 'Chef de Service' };
    const origObj = this.chuStatus[patient.currentLocation] || { name: patient.currentLocation, director: 'Médecin Urgentiste' };

    const newTransfer = {
      id: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: patient.id,
      patientName: patient.name,
      fromChu: patient.currentLocation,
      toChu: destChu,
      motif: motif,
      gravityScore: gravity,
      status: 'En cours de route',
      statusClass: 'badge-red',
      transportMode: transport,
      requestedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      completedAt: 'En transit (ETA: 18 min)',
      doctorRequester: origObj.director,
      doctorAcceptor: destObj.director
    };

    patient.currentLocation = destChu;
    patient.history.unshift({
      date: new Date().toISOString().split('T')[0],
      chu: destChu,
      service: 'Transfert Inter-Hôpitaux',
      doctor: destObj.director,
      type: 'Transfert Régulé SAMU',
      summary: motif
    });

    this.transfers.unshift(newTransfer);
    this.saveData('sani_transfers', this.transfers);
    this.saveData('sani_patients', this.patients);

    this.closeAllModals();
    this.showToast(`Transfert régulé déclenché pour ${patient.name} vers ${destObj.name} !`);
    this.renderTransfers();
    this.updateLiveStats();
  }

  confirmArrival(transferId) {
    const trf = this.transfers.find(t => t.id === transferId);
    if (trf) {
      trf.status = 'Terminé';
      trf.statusClass = 'badge-green';
      trf.completedAt = 'Admis en lit de soins';

      // Libérer 1 lit dans l'établissement d'origine et allouer 1 lit dans l'établissement de destination
      if (this.chuStatus[trf.fromChu] && this.chuStatus[trf.fromChu].occupiedBeds > 0) {
        this.chuStatus[trf.fromChu].occupiedBeds -= 1;
        this.logBedMovement(trf.fromChu, this.chuStatus[trf.fromChu].shortName, 'occupied', 'Lit Conventionnel', -1, `Transfert sortant SAMU : ${trf.patientName} vers ${this.chuStatus[trf.toChu]?.shortName || trf.toChu}`);
        if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
          window.SupabaseSyncService.syncChuStatus(trf.fromChu, this.chuStatus[trf.fromChu]);
        }
      }
      if (this.chuStatus[trf.toChu] && this.chuStatus[trf.toChu].occupiedBeds < this.chuStatus[trf.toChu].totalBeds) {
        this.chuStatus[trf.toChu].occupiedBeds += 1;
        this.logBedMovement(trf.toChu, this.chuStatus[trf.toChu].shortName, 'occupied', 'Lit Conventionnel', +1, `Réception transfert SAMU : ${trf.patientName} depuis ${this.chuStatus[trf.fromChu]?.shortName || trf.fromChu}`);
        if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
          window.SupabaseSyncService.syncChuStatus(trf.toChu, this.chuStatus[trf.toChu]);
        }
      }

      this.saveData('sani_chu_status', this.chuStatus);
      this.saveData('sani_transfers', this.transfers);
      this.showToast(`Patient ${trf.patientName} bien réceptionné au ${this.chuStatus[trf.toChu]?.shortName || trf.toChu} (Capacités mises à jour) !`);
      this.renderTransfers();
      this.updateLiveStats();
    }
  }

  // Méthodes de la Fiche Navette officielle
  openFicheNavette(transferId) {
    if (window.FicheNavetteService) {
      window.FicheNavetteService.openModal(
        transferId,
        this.patients,
        this.transfers,
        this.chuStatus,
        k => this.getInsurance(k)
      );
    }
  }

  closeFicheNavette() {
    if (window.FicheNavetteService) {
      window.FicheNavetteService.closeModal();
    } else {
      document.getElementById('modal-fiche-navette')?.classList.add('hidden');
    }
  }

  exportFicheNavette() {
    if (window.FicheNavetteService) {
      window.FicheNavetteService.exportHtml();
    }
  }

  // =========================================================================
  // GESTION DES NOUVEAUX PATIENTS
  // =========================================================================
  openPatientModal() {
    this.refreshAllChuSelects();
    this.populateInsuranceSelect();
    document.getElementById('modal-new-patient')?.classList.remove('hidden');
  }

  submitNewPatient(e) {
    e.preventDefault();
    const name = document.getElementById('new-patient-name').value;
    const dob = document.getElementById('new-patient-dob').value;
    const gender = document.getElementById('new-patient-gender').value;
    const cnamgs = document.getElementById('new-patient-cnamgs').value;
    const insurance = document.getElementById('new-patient-insurance')?.value || 'CNAMGS_FONC';
    const blood = document.getElementById('new-patient-blood').value;
    const chu = document.getElementById('new-patient-chu').value;
    const allergies = document.getElementById('new-patient-allergies').value;
    const chronic = document.getElementById('new-patient-chronic').value;

    const ins = this.getInsurance(insurance);

    const newPat = {
      id: `PAT-GAB-${Math.floor(100 + Math.random() * 900)}`,
      ins: `INS-GA-${dob.replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`,
      cnamgs: cnamgs || `${Math.floor(100000 + Math.random() * 900000)}-${chu.toUpperCase()}`,
      insurance: insurance,
      name: name,
      birthdate: dob,
      gender: gender,
      bloodType: blood,
      allergies: allergies ? allergies.split(',').map(s => s.trim()) : ['Aucune connue'],
      chronicDiseases: chronic ? chronic.split(',').map(s => s.trim()) : ['Aucune déclarée'],
      currentLocation: chu,
      currentService: 'Admission / Consultation initiale',
      contacts: '+241 077 00 00 00',
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          chu: chu,
          service: 'Admission Initiale',
          doctor: this.chuStatus[chu]?.director || 'Médecin d\'accueil',
          type: 'Création DMP',
          summary: `Enrôlement dans le système GAB-SANTE sous régime ${ins.shortLabel} (${ins.coverageRate} prise en charge).`
        }
      ]
    };

    this.patients.unshift(newPat);
    this.saveData('sani_patients', this.patients);

    // Allocation automatique d'un lit d'hospitalisation dans l'établissement d'accueil
    if (this.chuStatus[chu]) {
      if (this.chuStatus[chu].occupiedBeds < this.chuStatus[chu].totalBeds) {
        this.chuStatus[chu].occupiedBeds += 1;
        this.logBedMovement(chu, this.chuStatus[chu].shortName, 'occupied', 'Lit Conventionnel', +1, `Admission patient : ${newPat.name}`);
        this.saveData('sani_chu_status', this.chuStatus);
        if (window.SupabaseSyncService && window.SupabaseSyncService.syncChuStatus) {
          window.SupabaseSyncService.syncChuStatus(chu, this.chuStatus[chu]);
        }
        this.updateLiveStats();
      }
    }

    this.closeAllModals();
    this.showToast(`DMP créé avec succès pour ${newPat.name} (1 lit alloué à ${this.chuStatus[chu]?.shortName || chu}) !`);
    this.renderDmp();
  }

  // =========================================================================
  // VUE 4 : TÉLÉ-EXPERTISE & RCP
  // =========================================================================
  renderTeleExpertise() {
    const container = document.getElementById('rcp-cards-container');
    if (!container) return;

    container.innerHTML = this.teleExpertise.map(r => {
      const fromChu = this.chuStatus[r.fromChu] || (window.CHU_DATA && window.CHU_DATA[r.fromChu]) || { shortName: r.fromChu, tagClass: 'tag-chul' };
      const toChu = this.chuStatus[r.toChu] || (window.CHU_DATA && window.CHU_DATA[r.toChu]) || { shortName: r.toChu, tagClass: 'tag-chua' };

      return `
        <div class="stat-card" style="display: block; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
            <div>
              <span class="badge ${r.statusClass}">${r.status}</span>
              <span class="badge badge-purple" style="margin-left: 6px;">${r.urgency}</span>
              <h3 style="font-size: 1rem; font-weight: 700; margin-top: 6px; color: #0f172a;">${r.title}</h3>
              <div style="font-size: 0.78rem; color: #64748b;">
                Patient : <strong>${r.patientName}</strong> | Date : ${r.date} | ID : ${r.id}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="chu-tag ${fromChu.tagClass}">${fromChu.shortName}</span>
              <span>➔</span>
              <span class="chu-tag ${toChu.tagClass}">${toChu.shortName}</span>
            </div>
          </div>

          <p style="font-size: 0.82rem; color: #334155; background: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; line-height: 1.4;">
            ${r.details}
          </p>

          ${r.opinion ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.8rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 6px;">
                <strong style="color: #166534; font-size: 0.85rem;">✅ Avis Médical Collégial Rendu & Validé</strong>
                <span style="font-size: 0.74rem; color: #15803d; font-weight: 600;">📅 Date : ${r.opinion.date}</span>
              </div>
              <div style="font-size: 0.78rem; color: #374151; margin-bottom: 6px;">
                <strong>Praticien :</strong> ${r.opinion.doctor} (${r.opinion.service}) • 
                <strong>Décision :</strong> <span class="badge badge-green" style="font-size: 0.74rem;">${r.opinion.decision}</span>
              </div>
              <div style="color: #166534; font-size: 0.8rem; line-height: 1.45; background: #ffffff; padding: 8px 10px; border-radius: 6px; border: 1px solid #dcfce7;">
                <strong>Recommandations Thérapeutiques :</strong><br>${r.opinion.recommendations}
              </div>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: #475569; flex-wrap: wrap; gap: 8px;">
            <div>
              Demandeur: <strong>${r.requestedBy}</strong> | Expert: <strong>${r.expertAssigned}</strong>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-secondary" style="font-size: 0.75rem;" onclick="saniApp.openPacsViewer('${r.id}')">
                🖼️ Imagerie DICOM
              </button>
              <button class="btn-primary" style="font-size: 0.75rem;" onclick="saniApp.openRcpOpinionModal('${r.id}')">
                ${r.opinion ? '📝 Modifier l\'Avis RCP' : '💬 Rendre Avis RCP'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Visionneuse PACS / DICOM
  openPacsViewer(rcpId) {
    if (window.PacsService) {
      window.PacsService.openViewer(rcpId);
    } else {
      this.showToast('Module PACS en cours de chargement...');
    }
  }

  // Modale Rendre un Avis Télé-Expertise / RCP
  openRcpOpinionModal(rcpId) {
    const rcp = this.teleExpertise.find(r => r.id === rcpId);
    if (!rcp) return;

    const modal = document.getElementById('modal-rcp-opinion');
    if (!modal) return;

    const contextBox = document.getElementById('rcp-opinion-context-box');
    if (contextBox) {
      contextBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <strong style="color: #0f172a; font-size: 0.9rem;">Dossier : ${rcp.title} (${rcp.id})</strong>
          <span class="badge ${rcp.statusClass}">${rcp.status}</span>
        </div>
        <div><strong>Patient :</strong> ${rcp.patientName} | <strong>Urgence :</strong> <span style="color:#b91c1c; font-weight:600;">${rcp.urgency}</span></div>
        <div><strong>Demandeur :</strong> ${rcp.requestedBy}</div>
        <div style="margin-top: 6px; color: #475569; background: #ffffff; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
          <em>"${rcp.details}"</em>
        </div>
      `;
    }

    document.getElementById('rcp-opinion-id').value = rcp.id;
    document.getElementById('rcp-opinion-doctor').value = rcp.opinion?.doctor || rcp.expertAssigned;
    document.getElementById('rcp-opinion-service').value = rcp.opinion?.service || (this.chuStatus[rcp.toChu]?.pole || 'Pôle Spécialisé');
    if (rcp.opinion?.decision) document.getElementById('rcp-opinion-decision').value = rcp.opinion.decision;
    if (rcp.opinion?.recommendations) document.getElementById('rcp-opinion-recommendations').value = rcp.opinion.recommendations;
    else document.getElementById('rcp-opinion-recommendations').value = '';

    modal.classList.remove('hidden');
  }

  submitRcpOpinion(e) {
    e.preventDefault();
    const rcpId = document.getElementById('rcp-opinion-id').value;
    const doctor = document.getElementById('rcp-opinion-doctor').value.trim();
    const service = document.getElementById('rcp-opinion-service').value.trim();
    const decision = document.getElementById('rcp-opinion-decision').value;
    const recommendations = document.getElementById('rcp-opinion-recommendations').value.trim();

    const rcp = this.teleExpertise.find(r => r.id === rcpId);
    if (!rcp) return;

    rcp.status = 'Avis rendu & validé';
    rcp.statusClass = 'badge-green';
    rcp.opinion = {
      doctor,
      service,
      decision,
      recommendations,
      date: new Date().toISOString().split('T')[0]
    };

    this.saveData('sani_rcp', this.teleExpertise);
    this.closeAllModals();
    this.showToast(`Avis médical RCP validé et transmis au demandeur (${rcp.requestedBy}) !`);
    this.renderTeleExpertise();
  }

  // Modale Ajout d'Acte Médical au DMP
  openAddPatientRecordModal(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;

    const modal = document.getElementById('modal-add-patient-record');
    if (!modal) return;

    document.getElementById('add-record-patient-id').value = patient.id;
    
    const infoBox = document.getElementById('add-record-patient-info');
    if (infoBox) {
      infoBox.innerHTML = `
        <strong>Patient :</strong> ${patient.name} | <strong>INS :</strong> <code>${patient.ins}</code> | <strong>CNAMGS :</strong> <code>${patient.cnamgs}</code>
      `;
    }

    document.getElementById('add-record-date').value = new Date().toISOString().split('T')[0];
    
    const chuSelect = document.getElementById('add-record-chu');
    if (chuSelect) {
      chuSelect.innerHTML = Object.values(this.chuStatus).map(c => `
        <option value="${c.id}" ${c.id === patient.currentLocation ? 'selected' : ''}>${c.name}</option>
      `).join('');
    }

    document.getElementById('add-record-service').value = patient.currentService || 'Médecine Interne';
    document.getElementById('add-record-doctor').value = this.chuStatus[patient.currentLocation]?.director || 'Médecin Praticien';
    document.getElementById('add-record-summary').value = '';

    modal.classList.remove('hidden');
  }

  submitPatientRecord(e) {
    e.preventDefault();
    const patientId = document.getElementById('add-record-patient-id').value;
    const date = document.getElementById('add-record-date').value;
    const chu = document.getElementById('add-record-chu').value;
    const service = document.getElementById('add-record-service').value.trim();
    const doctor = document.getElementById('add-record-doctor').value.trim();
    const type = document.getElementById('add-record-type').value;
    const summary = document.getElementById('add-record-summary').value.trim();

    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;

    if (!patient.history) patient.history = [];
    patient.history.unshift({
      date,
      chu,
      service,
      doctor,
      type,
      summary
    });

    this.saveData('sani_patients', this.patients);
    this.closeAllModals();
    this.showToast(`Nouvel acte médical enregistré avec succès dans le DMP de ${patient.name} !`);
    this.viewPatientDmp(patientId);
    this.renderDmp();
  }

  openRcpModal() {
    const modal = document.getElementById('modal-rcp');
    if (!modal) return;
    this.refreshAllChuSelects();

    const pSelect = document.getElementById('rcp-patient-select');
    if (pSelect) {
      pSelect.innerHTML = this.patients.map(p => `<option value="${p.name}">${p.name} (${p.cnamgs})</option>`).join('');
    }
    modal.classList.remove('hidden');
  }

  submitNewRcp(e) {
    e.preventDefault();
    const title = document.getElementById('rcp-title').value;
    const patientName = document.getElementById('rcp-patient-select').value;
    const destChu = document.getElementById('rcp-dest-chu').value;
    const urgency = document.getElementById('rcp-urgency').value;
    const details = document.getElementById('rcp-details').value;

    const newRcp = {
      id: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: title,
      fromChu: this.currentChu,
      toChu: destChu,
      patientName: patientName,
      requestedBy: this.chuStatus[this.currentChu]?.director || 'Médecin Référent',
      expertAssigned: this.chuStatus[destChu]?.director || 'Expert Hospitalier',
      urgency: urgency,
      status: 'En attente d\'avis',
      statusClass: 'badge-yellow',
      date: new Date().toISOString().split('T')[0],
      details: details
    };

    this.teleExpertise.unshift(newRcp);
    this.saveData('sani_rcp', this.teleExpertise);
    this.closeAllModals();
    this.showToast(`Demande de télé-expertise transmise !`);
    this.renderTeleExpertise();
  }

  // =========================================================================
  // VUE 5 : BANQUE DE SANG CNTS
  // =========================================================================
  renderBloodBank() {
    const container = document.getElementById('blood-bank-container');
    if (!container) return;

    const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

    let html = `
      <div style="margin-bottom: 1.5rem; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.5rem;">🏛️</span>
            <div>
              <h3 style="color: #9b2c2c; font-size: 1.05rem; font-weight: 700; margin: 0;">Banque Centrale de Sang - Centre National de Transfusion Sanguine (CNTS)</h3>
              <p style="font-size: 0.8rem; color: #742a2a; margin: 2px 0 0 0;">Libreville (Boulevard Triomphal) • Interconnexion certifiée des dépôts d'urgence des CHU.</p>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-urgency" onclick="saniApp.openBloodModal()" style="background: #b91c1c; border-color: #991b1b;">
            🚨 Bordereau Officiel de Réquisition CNTS
          </button>
        </div>
      </div>

      <!-- TABLEAU 1 : MATRICE DES STOCKS DE SANG (CGR) -->
      <div class="data-table-card" style="margin-bottom: 1.75rem;">
        <div style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 0.85rem; color: #0f172a;">
          📊 Matrice Nationale des Stocks de Produits Sanguins Labiles (Poches CGR Déleucocytées)
        </div>
        <table class="custom-table">
          <thead>
            <tr>
              <th>Établissement Hospitalier</th>
              ${bloodGroups.map(g => `<th style="text-align: center; color: #dc2626; font-size: 0.85rem;">${g}</th>`).join('')}
              <th style="text-align: right;">Total Poches CGR</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Ligne CNTS Central
    const cntsStock = this.bloodStocks.cnts || { 'O+': 85, 'O-': 18, 'A+': 42, 'A-': 8, 'B+': 36, 'B-': 6, 'AB+': 14, 'AB-': 3 };
    const cntsTotal = Object.values(cntsStock).reduce((a, b) => a + b, 0);
    html += `
      <tr style="background: #fffafa; font-weight: 700;">
        <td>🏛️ <strong>CNTS Dépôt National Central</strong> <span style="font-size: 0.72rem; color: #64748b; font-weight: 400;">(Stock Stratégique)</span></td>
        ${bloodGroups.map(g => `<td style="text-align: center; font-size: 0.95rem; color: #b91c1c;">${cntsStock[g] || 0}</td>`).join('')}
        <td style="text-align: right; color: #991b1b; font-size: 1.05rem;">${cntsTotal}</td>
      </tr>
    `;

    // Lignes pour chaque structure raccordée
    Object.keys(this.chuStatus).forEach(k => {
      const chu = this.chuStatus[k];
      const stock = this.bloodStocks[k] || { 'O+': 10, 'O-': 2, 'A+': 6, 'A-': 1, 'B+': 5, 'B-': 1, 'AB+': 2, 'AB-': 0 };
      const total = Object.values(stock).reduce((a, b) => a + b, 0);

      html += `
        <tr>
          <td><span class="chu-tag ${chu.tagClass || 'tag-custom'}">${chu.shortName}</span> <span style="font-size: 0.75rem; color: #64748b;">(${chu.pole})</span></td>
          ${bloodGroups.map(g => {
            const count = stock[g] || 0;
            const isAlert = count <= 2 && (g === 'O-' || g === 'O+');
            return `
              <td style="text-align: center;">
                <span class="${isAlert ? 'badge badge-red' : ''}" style="${isAlert ? 'font-weight: 800;' : ''}">
                  ${count}
                </span>
              </td>
            `;
          }).join('')}
          <td style="text-align: right; font-weight: 700; color: #0284c7;">${total}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>

      <!-- TABLEAU 2 : HISTORIQUE OFFICIEL DES BORDEREAUX DE RÉQUISITION ÉMIS -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0;">📜 Registre National des Bordereaux de Réquisition CNTS</h3>
          <p style="font-size: 0.78rem; color: #64748b; margin: 2px 0 0 0;">Traçabilité médico-légale des délivrances d'urgence et protocoles transfusionnels.</p>
        </div>
      </div>

      <div class="data-table-card">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Réf. Bordereau & Horodatage</th>
              <th>Structure & Service</th>
              <th>Patient Récipiendaire</th>
              <th>PSL & Groupe</th>
              <th>Degré d'Urgence</th>
              <th>Statut Transfusionnel</th>
              <th style="text-align: right;">Document Officiel</th>
            </tr>
          </thead>
          <tbody>
            ${(this.cntsRequisitions || []).map(req => {
              const chu = this.chuStatus[req.chu] || { shortName: req.chu, tagClass: 'tag-chul' };
              const isUvi = req.urgencyLevel === 'UVI';
              const isUvr = req.urgencyLevel === 'UVR';
              const urgencyBadgeClass = isUvi ? 'badge-red' : (isUvr ? 'badge-yellow' : 'badge-blue');

              return `
                <tr>
                  <td>
                    <strong style="color: #991b1b; font-family: monospace;">${req.id}</strong><br>
                    <span style="font-size: 0.72rem; color: #64748b;">${req.date} à ${req.time}</span>
                  </td>
                  <td>
                    <span class="chu-tag ${chu.tagClass || ''}">${chu.shortName}</span><br>
                    <span style="font-size: 0.74rem; color: #475569;">${req.service}</span>
                  </td>
                  <td>
                    <strong>${req.patientName}</strong><br>
                    <span style="font-size: 0.72rem; color: #64748b;">${req.patientMeta || ''} • <code>${req.patientIns || ''}</code></span>
                  </td>
                  <td>
                    <span style="display: inline-block; background: #fee2e2; color: #991b1b; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">
                      ${req.bloodGroup}
                    </span>
                    <strong style="font-size: 0.82rem; margin-left: 4px;">(${req.totalQty} poches)</strong>
                  </td>
                  <td>
                    <span class="badge ${urgencyBadgeClass}">${req.urgencyLevel}</span>
                    <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">${req.deliveryDelay}</div>
                  </td>
                  <td>
                    <span class="badge badge-green">✓ ${req.status || 'Délivré'}</span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="saniApp.openRequisitionDocument('${req.id}')">
                      📄 Voir Bordereau & QR
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  // Ouverture de la modale de réquisition officielle CNTS
  openBloodModal() {
    this.refreshAllChuSelects();

    // Population des patients DMP
    const pSelect = document.getElementById('blood-req-patient');
    if (pSelect) {
      pSelect.innerHTML = `
        <option value="">-- Patient DMP sélectionné --</option>
        ${this.patients.map(p => `
          <option value="${p.id}" ${this.selectedPatient && this.selectedPatient.id === p.id ? 'selected' : ''}>
            ${p.name} (${p.bloodType} - ${p.cnamgs})
          </option>
        `).join('')}
        <option value="URGENCE_INCONNU">🚨 Patient Non Identifié / Déchocage Immédiat</option>
      `;
      if (this.selectedPatient) {
        this.onBloodPatientChange(this.selectedPatient.id);
      }
    }

    // Pré-sélection de l'hôpital actif
    const chuSelect = document.getElementById('blood-req-chu');
    if (chuSelect) {
      chuSelect.value = this.currentChu;
      this.onBloodChuChange(this.currentChu);
    }

    document.getElementById('modal-blood')?.classList.remove('hidden');
  }

  onBloodChuChange(chuId) {
    const chu = this.chuStatus[chuId];
    if (!chu) return;
    const docInput = document.getElementById('blood-req-doctor');
    const srvInput = document.getElementById('blood-req-service');
    if (docInput && !docInput.value) docInput.value = chu.director || 'Médecin d\'Astreinte';
    if (srvInput && !srvInput.value) srvInput.value = chu.pole.split('&')[0].trim();
  }

  onBloodPatientChange(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;
    const typeSelect = document.getElementById('blood-req-type');
    if (typeSelect && patient.bloodType) {
      typeSelect.value = patient.bloodType;
    }
  }

  // Soumission et émission du bordereau officiel CNTS
  submitBloodRequisition(e) {
    e.preventDefault();
    const chuId = document.getElementById('blood-req-chu').value;
    const service = document.getElementById('blood-req-service').value.trim();
    const patientId = document.getElementById('blood-req-patient').value;
    const doctor = document.getElementById('blood-req-doctor').value.trim();
    const urgency = document.getElementById('blood-req-urgency').value;
    const pslType = document.getElementById('blood-req-psl-type').value;
    const bloodGroup = document.getElementById('blood-req-type').value;
    const qty = parseInt(document.getElementById('blood-req-qty').value, 10);
    const hb = document.getElementById('blood-req-hb').value.trim();
    const indication = document.getElementById('blood-req-indication').value.trim();

    const chu = this.chuStatus[chuId] || { name: chuId, shortName: chuId };
    const patient = this.patients.find(p => p.id === patientId);

    // Contrôle de stock central CNTS
    const currentStock = this.bloodStocks.cnts[bloodGroup] || 0;
    if (currentStock < qty) {
      alert(`⚠️ Stock central CNTS insuffisant pour le groupe ${bloodGroup} :\n${currentStock} poche(s) disponible(s), ${qty} demandée(s).`);
      return;
    }

    // Décompte CNTS et crédit dépôt CHU
    this.bloodStocks.cnts[bloodGroup] -= qty;
    if (!this.bloodStocks[chuId]) this.bloodStocks[chuId] = {};
    this.bloodStocks[chuId][bloodGroup] = (this.bloodStocks[chuId][bloodGroup] || 0) + qty;
    this.saveData('sani_blood', this.bloodStocks);

    // Construction de l'objet réquisition officielle
    const isUvi = urgency === 'UVI';
    const isUvr = urgency === 'UVR';
    const pslName = pslType === 'CGR' ? 'Concentré de Globules Rouges' : pslType === 'PFC' ? 'Plasma Frais Congelé' : 'Concentré Plaquettaire d\'Aphérèse';

    const newReq = {
      id: `REQ-CNTS-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      chu: chuId,
      chuName: chu.name,
      service: service,
      doctor: doctor,
      contactPhone: chu.emergencyPhone || '+241 (0)11 79 90 00',
      patientName: patient ? patient.name : 'Patient d\'Urgence Immédiate (Anonyme)',
      patientMeta: patient ? `${patient.age} (${patient.gender})` : 'Urgence Vitale Déchoquage',
      patientIns: patient ? patient.ins : 'INS-GAB-URG-TEMP',
      patientInsurance: patient ? `${patient.cnamgs} (${patient.insurance})` : 'CNAMGS Urgence Vitale (100%)',
      bloodGroup: bloodGroup,
      urgencyLevel: urgency,
      urgencyLabel: isUvi ? 'Urgence Vitale Immédiate' : isUvr ? 'Urgence Vitale Relative' : 'Urgence Standard',
      urgencyDescription: isUvi ? 'Délivrance sans délai (protocole choc hémorragique aigu)' : isUvr ? 'Délivrance sous 2 heures avec contrôle de compatibilité' : 'Délivrance sous 6 à 12 heures programmée',
      deliveryDelay: isUvi ? 'Immédiat (< 15 min)' : isUvr ? 'Sous 2 heures' : 'Sous 6 à 12 heures',
      protocol: isUvi ? 'O- Négatif sans attente de cross-match complet si UVI' : 'Iso-groupe Rhésus avec contrôle de concordance obligatoire',
      indication: indication,
      hemoglobin: hb || '< 7.0 g/dL',
      raiStatus: 'Prélèvement transmis avec la demande',
      transfusionHistory: 'Antécédents vérifiés sur le DMP national',
      pregnancyHistory: patient?.gender === 'Féminin' ? 'Vérification obstétricale effectuée' : 'Sans objet',
      status: 'Délivré & Conforme',
      totalQty: qty,
      items: [
        {
          type: `${pslType} (${pslName})`,
          description: 'Déleucocyté, viro-atténué, certifié CNTS Libreville',
          bloodGroup: bloodGroup,
          quantity: qty,
          batchNumbers: Array.from({ length: qty }, () => `GAB-${pslType}-26-${Math.floor(10000 + Math.random() * 90000)}`),
          expirationDate: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString().split('T')[0]
        }
      ]
    };

    if (!this.cntsRequisitions) this.cntsRequisitions = [];
    this.cntsRequisitions.unshift(newReq);
    this.saveData('sani_cnts_requisitions', this.cntsRequisitions);

    this.closeAllModals();
    this.showToast(`Bordereau CNTS ${newReq.id} validé ! Départ urgent de ${qty} poche(s) vers ${chu.shortName}.`);
    this.renderBloodBank();

    // Affichage immédiat du bordereau certifié avec QR Code
    if (window.CntsRequisitionService) {
      window.CntsRequisitionService.openRequisitionModal(newReq, chu, patient);
    }
  }

  // Consultation et impression d'un bordereau depuis le tableau
  openRequisitionDocument(reqId) {
    const req = (this.cntsRequisitions || []).find(r => r.id === reqId);
    if (!req) return;
    const chu = this.chuStatus[req.chu] || { name: req.chuName, shortName: req.chu };
    const patient = this.patients.find(p => p.name === req.patientName || p.ins === req.patientIns);
    if (window.CntsRequisitionService) {
      window.CntsRequisitionService.openRequisitionModal(req, chu, patient);
    }
  }

  // =========================================================================
  // VUE 6 : STATISTIQUES & ÉPIDÉMIOLOGIE (VIGILANCE DGS / OMS)
  // =========================================================================
  renderStats() {
    if (window.saniEpidemio && typeof window.saniEpidemio.renderDashboard === 'function') {
      window.saniEpidemio.renderDashboard('stats-view-container');
      return;
    }

    const container = document.getElementById('stats-view-container');
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <div class="stat-card" style="display: block;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">Pathologies Prises en Charge (Réseau National)</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.82rem;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Paludisme Grave & Anémies Sévères (CHUL / CHUMEF / Schweitzer)</span>
                <strong>34%</strong>
              </div>
              <div class="progress-bar-container"><div class="progress-fill" style="width: 34%; background: #0072ce;"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Traumatismes Routiers AVP N1 (CHUO Owendo)</span>
                <strong>26%</strong>
              </div>
              <div class="progress-bar-container"><div class="progress-fill" style="width: 26%; background: #d97706;"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Pathologies Mère-Enfant & Néonatologie (CHUMEF)</span>
                <strong>21%</strong>
              </div>
              <div class="progress-bar-container"><div class="progress-fill" style="width: 21%; background: #db2777;"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Cancers Gynécologiques & Digestifs (CHUA Angondjé)</span>
                <strong>14%</strong>
              </div>
              <div class="progress-bar-container"><div class="progress-fill" style="width: 14%; background: #059669;"></div></div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Drépanocytose Majeure HbSS</span>
                <strong>18% (terrain associé)</strong>
              </div>
              <div class="progress-bar-container"><div class="progress-fill" style="width: 18%; background: #dc2626;"></div></div>
            </div>
          </div>
        </div>

        <div class="stat-card" style="display: block;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">Flux de Transferts Régulés (SAMU 1300)</h4>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span>CHUL ➔ CHUO (Traumatologie / Bloc N1)</span>
              <strong style="color: #0072ce; font-size: 1rem;">48 transferts</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span>CHUL ➔ CHUMEF (Périnatologie / Réa Néonat)</span>
              <strong style="color: #db2777; font-size: 1rem;">39 transferts</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span>CHUL ➔ CHUA (Oncologie / Radiothérapie)</span>
              <strong style="color: #059669; font-size: 1rem;">27 transferts</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px;">
              <span>Structures Raccordées ➔ Réanimation CHUL</span>
              <strong style="color: #d97706; font-size: 1rem;">21 transferts</strong>
            </div>
          </div>
        </div>

        <div class="stat-card" style="display: block; grid-column: 1 / -1;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 1rem; color: #0f172a;">
            🏛️ Répartition des Régimes de Couverture Maladie (Admissions Réseau Hospitalier Gabon)
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; font-size: 0.82rem;">
            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>🏛️ CNAMGS Régimes Publics</strong></span>
                <strong style="color: #0072ce;">74% des flux</strong>
              </div>
              <div class="progress-bar-container" style="margin: 4px 0 6px 0;"><div class="progress-fill" style="width: 74%; background: #0072ce;"></div></div>
              <div style="font-size: 0.72rem; color: #64748b;">Fonctionnaires (GE 42%), PVNR (22%), Privé formel (10%)</div>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>🎖️ Mutuelles Professionnelles</strong></span>
                <strong style="color: #0891b2;">13% des flux</strong>
              </div>
              <div class="progress-bar-container" style="margin: 4px 0 6px 0;"><div class="progress-fill" style="width: 13%; background: #0891b2;"></div></div>
              <div style="font-size: 0.72rem; color: #64748b;">Éducation (MEN), Santé, Forces Armées (FAG), Pétrole</div>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>🏢 Assurances Privées / ASCOMA</strong></span>
                <strong style="color: #7c3aed;">9% des flux</strong>
              </div>
              <div class="progress-bar-container" style="margin: 4px 0 6px 0;"><div class="progress-fill" style="width: 9%; background: #7c3aed;"></div></div>
              <div style="font-size: 0.72rem; color: #64748b;">ASCOMA Tiers-Payant, OGAR, AXA, NSIA, Sanlam</div>
            </div>

            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>💰 Sans Couverture (Recouvrement direct)</strong></span>
                <strong style="color: #dc2626;">4% des flux</strong>
              </div>
              <div class="progress-bar-container" style="margin: 4px 0 6px 0;"><div class="progress-fill" style="width: 4%; background: #dc2626;"></div></div>
              <div style="font-size: 0.72rem; color: #64748b;">Plein tarif direct au guichet du CHU</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VUE 7 : INTEROPÉRABILITÉ HL7 / FHIR R4
  // =========================================================================
  renderFhirViewer() {
    const container = document.getElementById('fhir-view-container');
    if (!container) return;

    const samplePatient = this.selectedPatient || this.patients[0];
    const fhirBundle = this.generateFhirBundle(samplePatient);

    container.innerHTML = `
      <div class="stat-card" style="display: block;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a;">Ressource Standard HL7 FHIR R4 (Fast Healthcare Interoperability Resources)</h3>
            <p style="font-size: 0.78rem; color: #64748b;">Génération dynamique certifiée pour intégration avec DHIS2, OpenEMR et les Systèmes d'Information Hospitaliers (SIH).</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <select class="form-control" style="width: auto; font-size: 0.8rem;" onchange="saniApp.switchFhirPatient(this.value)">
              ${this.patients.map(p => `<option value="${p.id}" ${samplePatient && p.id === samplePatient.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <button class="btn-primary" style="font-size: 0.78rem;" onclick="saniApp.copyFhirJson()">
              📋 Copier JSON
            </button>
          </div>
        </div>

        <pre id="fhir-json-code" style="background: #0f172a; color: #38bdf8; padding: 1.25rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem; overflow-x: auto; max-height: 480px;">${JSON.stringify(fhirBundle, null, 2)}</pre>
      </div>
    `;
  }

  generateFhirBundle(patient) {
    if (window.FhirService) {
      return window.FhirService.generateBundle(patient, this.chuStatus, k => this.getInsurance(k));
    }
    return {};
  }

  switchFhirPatient(patientId) {
    this.selectedPatient = this.patients.find(p => p.id === patientId);
    this.renderFhirViewer();
  }

  copyFhirJson() {
    const code = document.getElementById('fhir-json-code')?.textContent;
    if (code) {
      navigator.clipboard.writeText(code);
      this.showToast('Code JSON FHIR copié dans le presse-papier !');
    }
  }

  viewFhirForPatient(patientId) {
    this.switchView('fhir');
    this.switchFhirPatient(patientId);
  }

  // Utilitaires généraux
  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    // Nettoyer les anciens toasts pour éviter l'accumulation à l'écran
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cursor = 'pointer';
    toast.title = 'Cliquez pour fermer ce message';
    toast.innerHTML = `<span>ℹ️</span> <div style="flex: 1;">${message}</div> <span style="margin-left: 8px; opacity: 0.6; font-size: 0.8rem;">✕</span>`;
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 2500);
  }

  clearAllToasts() {
    const container = document.getElementById('toast-container');
    if (container) container.innerHTML = '';
  }

  filterPatients(query) {
    const q = query.toLowerCase().trim();
    const rows = document.querySelectorAll('#dmp-patients-table-body tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  }

  filterPatientsByChu(chuId) {
    this.switchView('dmp');
    const input = document.getElementById('dmp-search-input');
    const chu = this.chuStatus[chuId];
    if (input && chu) {
      input.value = chu.shortName;
      this.filterPatients(input.value);
    }
  }

  initiateTransferTo(chuId) {
    this.switchView('transfers');
    this.openTransferModal();
    const destSelect = document.getElementById('transfer-dest-select');
    if (destSelect) destSelect.value = chuId;
  }

  // =========================================================================
  // GESTION DES SAUVEGARDES, EXPORTS & RESTAURATION (PERSISTANCE)
  // =========================================================================
  openBackupModal() {
    document.getElementById('modal-backup-restore')?.classList.remove('hidden');
  }

  async syncForceCloudPush() {
    if (!window.SupabaseSyncService) return;
    this.showToast('Envoi des données vers le Cloud Santé-Gab...');
    await window.SupabaseSyncService.pushAllLocalDataToCloud();
    this.showToast('✅ Données locales synchronisées avec succès sur Supabase Cloud !');
  }

  async syncForceCloudPull() {
    if (!window.SupabaseSyncService) return;
    this.showToast('Téléchargement des données depuis le Cloud Santé-Gab...');
    await window.SupabaseSyncService.pullAllDataFromCloud();
    this.showToast('✅ Données rechargées en direct depuis Supabase Cloud !');
  }

  exportDatabaseJson() {
    const backupData = {
      app: 'GAB-SANTE',
      country: 'République Gabonaise',
      ministry: 'Ministère de la Santé du Gabon',
      version: '2.5.0-production',
      exportedAt: new Date().toISOString(),
      timestampText: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }) + ' (Gabon UTC+1)',
      data: {
        chuStatus: this.chuStatus,
        patients: this.patients,
        transfers: this.transfers,
        teleExpertise: this.teleExpertise,
        bloodStocks: this.bloodStocks,
        cntsRequisitions: this.cntsRequisitions,
        bedLogs: this.bedLogs,
        prescriptions: this.prescriptions
      }
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `gab-sante-sauvegarde-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Sauvegarde complète JSON téléchargée avec succès !');
  }

  importDatabaseJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.data || parsed.app !== 'GAB-SANTE') {
          alert("Erreur de format : Ce fichier n'est pas une archive de sauvegarde valide GAB-SANTE.");
          return;
        }

        const d = parsed.data;
        if (d.chuStatus) {
          this.chuStatus = d.chuStatus;
          this.saveData('sani_chu_status', this.chuStatus);
        }
        if (d.patients) {
          this.patients = d.patients;
          this.saveData('sani_patients', this.patients);
        }
        if (d.transfers) {
          this.transfers = d.transfers;
          this.saveData('sani_transfers', this.transfers);
        }
        if (d.teleExpertise) {
          this.teleExpertise = d.teleExpertise;
          this.saveData('sani_rcp', this.teleExpertise);
        }
        if (d.bloodStocks) {
          this.bloodStocks = d.bloodStocks;
          this.saveData('sani_blood', this.bloodStocks);
        }
        if (d.cntsRequisitions) {
          this.cntsRequisitions = d.cntsRequisitions;
          this.saveData('sani_cnts_requisitions', this.cntsRequisitions);
        }
        if (d.bedLogs) {
          this.bedLogs = d.bedLogs;
          this.saveData('sani_bed_logs', this.bedLogs);
        }
        if (d.prescriptions) {
          this.prescriptions = d.prescriptions;
          this.saveData('sani_prescriptions', this.prescriptions);
        }

        this.closeAllModals();
        this.refreshAllChuSelects();
        this.updateLiveStats();
        this.renderCurrentView();
        this.showToast(`Restauration terminée : Données rechargées depuis la sauvegarde (${parsed.version || 'GAB-SANTE'}) !`);
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON : " + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  resetToFactoryData() {
    const confirmed = confirm(
      "⚠️ RÉINITIALISATION GAB-SANTE\n\n" +
      "Êtes-vous certain de vouloir restaurer les données maîtresses initiales du Gabon ?\n" +
      "Toutes les modifications locales seront réinitialisées aux valeurs de référence."
    );
    if (!confirmed) return;

    localStorage.removeItem('sani_chu_status');
    localStorage.removeItem('sani_patients');
    localStorage.removeItem('sani_transfers');
    localStorage.removeItem('sani_rcp');
    localStorage.removeItem('sani_blood');
    localStorage.removeItem('sani_cnts_requisitions');
    localStorage.removeItem('sani_bed_logs');
    localStorage.removeItem('sani_prescriptions');

    this.chuStatus = JSON.parse(JSON.stringify(window.CHU_DATA || {}));
    this.patients = JSON.parse(JSON.stringify(window.INITIAL_PATIENTS || []));
    this.transfers = JSON.parse(JSON.stringify(window.INITIAL_TRANSFERS || []));
    this.teleExpertise = JSON.parse(JSON.stringify(window.INITIAL_TELE_EXPERTISE || []));
    this.bloodStocks = JSON.parse(JSON.stringify(window.INITIAL_BLOOD_STOCK || {}));
    this.cntsRequisitions = JSON.parse(JSON.stringify(window.INITIAL_CNTS_REQUISITIONS || []));
    this.bedLogs = JSON.parse(JSON.stringify(window.INITIAL_BED_LOGS || []));
    this.prescriptions = JSON.parse(JSON.stringify(window.INITIAL_PRESCRIPTIONS || []));

    this.closeAllModals();
    this.refreshAllChuSelects();
    this.updateLiveStats();
    this.renderCurrentView();
    this.showToast("Données réinitialisées aux valeurs officielles de référence !");
  }

  // =========================================================================
  // SYNTHÈSE MÉDICALE OFFICIELLE DU PATIENT (DMP GABONAIS)
  // =========================================================================
  openPatientSummary(patientId) {
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;

    const modal = document.getElementById('modal-patient-summary');
    const container = document.getElementById('patient-summary-content');
    if (!modal || !container) return;

    const chu = this.chuStatus[patient.currentLocation] || { name: patient.currentLocation, shortName: patient.currentLocation };
    const ins = this.getInsurance(patient.insurance);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    container.innerHTML = `
      <div class="dmp-summary-document" style="font-family: Arial, -apple-system, sans-serif; color: #1e293b; line-height: 1.45;">
        
        <!-- En-tête officiel -->
        <div style="border-bottom: 3px double #0284c7; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            <div style="font-size: 0.78rem;">
              <strong style="color: #0a2540; font-size: 0.85rem;">RÉPUBLIQUE GABONAISE</strong><br>
              <span style="color: #64748b; font-style: italic;">Union – Travail – Justice</span><br>
              <strong>MINISTÈRE DE LA SANTÉ</strong><br>
              Direction Générale de la Santé Publique • DMP-GABON
            </div>

            <div style="text-align: center;">
              <div style="display: inline-flex; height: 10px; width: 64px; margin-bottom: 4px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1;">
                <div style="background: #009e49; flex: 1;"></div>
                <div style="background: #fcd116; flex: 1;"></div>
                <div style="background: #0072ce; flex: 1;"></div>
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; letter-spacing: 0.5px;">DOSSIER MÉDICAL PARTAGÉ</div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #475569;">FICHE DE SYNTHÈSE CLINIQUE OFFICIELLE</div>
            </div>

            <div style="text-align: right; font-size: 0.78rem;">
              <div style="background: #f0f9ff; padding: 6px 10px; border-radius: 6px; border: 1px solid #bae6fd; display: inline-block;">
                <span style="color: #64748b;">N° Dossier :</span> <strong style="color: #0284c7;">${patient.id}</strong><br>
                <span style="color: #64748b;">Édité le :</span> <strong>${dateFormatted} à ${timeFormatted}</strong><br>
                <span style="color: #64748b;">Établissement :</span> <strong>${chu.shortName}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations Patient & Alerte Médicale -->
        <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 12px; margin-bottom: 12px;">
          
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #ffffff;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
              👤 Identité Sanitaire & Droits Sociaux
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.82rem;">
              <div><strong>Nom & Prénom :</strong> ${patient.name}</div>
              <div><strong>Né(e) le :</strong> ${patient.birthdate} (${patient.gender})</div>
              <div><strong>INS-Gabon :</strong> <code>${patient.ins}</code></div>
              <div><strong>N° CNAMGS :</strong> <code>${patient.cnamgs}</code></div>
              <div><strong>Régime :</strong> ${ins.logo} ${ins.label}</div>
              <div><strong>Taux Couverture :</strong> <span class="badge badge-green">${ins.coverageRate}</span></div>
              <div style="grid-column: 1 / -1;"><strong>Contact Référent :</strong> ${patient.contacts}</div>
            </div>
          </div>

          <div style="border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 14px; background: #fff1f2;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #9f1239; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ffe4e6; padding-bottom: 4px;">
              🚨 Constantes & Alertes Vitales
            </div>
            <div style="font-size: 0.82rem; line-height: 1.5;">
              <div><strong>Groupe Sanguin :</strong> <span class="badge badge-red" style="font-size: 0.85rem;">${patient.bloodType}</span></div>
              <div><strong>Allergies Signalées :</strong> <span style="color: #dc2626; font-weight: 600;">${patient.allergies.join(', ')}</span></div>
              <div><strong>Pathologies / ALD :</strong><br>${patient.chronicDiseases.join(' • ')}</div>
            </div>
          </div>

        </div>

        <!-- Historique Chronologique des Actes & Soins -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
          <div style="background: #0f172a; color: #ffffff; padding: 6px 12px; font-weight: 700; font-size: 0.8rem;">
            📋 Historique Médical & Traçabilité des Soins Inter-Hospitaliers
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 6px 10px;">Date</th>
                <th style="padding: 6px 10px;">Établissement & Service</th>
                <th style="padding: 6px 10px;">Praticien</th>
                <th style="padding: 6px 10px;">Nature de l'Acte</th>
                <th style="padding: 6px 10px;">Résumé & Conclusions</th>
              </tr>
            </thead>
            <tbody>
              ${(patient.history || []).map((h, i) => {
                const hChu = this.chuStatus[h.chu] || { shortName: h.chu };
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="padding: 6px 10px; font-weight: 600; white-space: nowrap;">${h.date}</td>
                    <td style="padding: 6px 10px;"><strong>${hChu.shortName}</strong><br><span style="font-size: 0.72rem; color: #64748b;">${h.service}</span></td>
                    <td style="padding: 6px 10px;">${h.doctor}</td>
                    <td style="padding: 6px 10px;"><strong style="color: #0284c7;">${h.type}</strong></td>
                    <td style="padding: 6px 10px; font-size: 0.78rem; line-height: 1.35;">${h.summary}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Signature et QR Code de certification -->
        <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; display: grid; grid-template-columns: 130px 1fr 1fr; gap: 15px; align-items: start; font-size: 0.76rem;">
          <div style="text-align: center;">
            <div id="qrcode-summary" style="display: inline-block; width: 105px; height: 105px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px;"></div>
            <div style="font-size: 0.68rem; color: #64748b; margin-top: 4px;">
              Scan DMP National<br>
              <code>${patient.ins}</code>
            </div>
          </div>

          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; background: #ffffff; min-height: 100px;">
            <strong style="color: #0f172a;">Certificat Médical de Synthèse</strong><br>
            <span style="color: #64748b;">Généré automatiquement par le serveur DMP GAB-SANTE.</span>
            <div style="color: #059669; font-weight: 700; margin-top: 15px;">
              ✓ Document Conforme aux Normes Ministère de la Santé
            </div>
          </div>

          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; background: #ffffff; min-height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong style="color: #0f172a;">Médecin Référent / Chef de Service</strong><br>
              <span style="color: #64748b;">${chu.director || 'Praticien Hospitalier'}</span>
            </div>
            <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px; color: #64748b; font-size: 0.7rem;">
              Signature & Cachet Hospitalier
            </div>
          </div>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');

    setTimeout(() => {
      const qrEl = document.getElementById('qrcode-summary');
      if (qrEl) {
        qrEl.innerHTML = '';
        if (window.QRCode) {
          new QRCode(qrEl, {
            text: JSON.stringify({
              app: 'GAB-SANTE-DMP',
              ins: patient.ins,
              cnamgs: patient.cnamgs,
              name: patient.name,
              blood: patient.bloodType,
              chu: chu.shortName,
              issued: `${dateFormatted} ${timeFormatted}`
            }),
            width: 95,
            height: 95,
            colorDark: '#0284c7',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      }
    }, 150);
  }

  closePatientSummary() {
    document.getElementById('modal-patient-summary')?.classList.add('hidden');
  }

  // Impression directe du DMP officiel
  printPatientDmp(patientId) {
    this.openPatientSummary(patientId);
    setTimeout(() => {
      window.print();
    }, 400);
  }

  exportPatientSummaryHtml() {
    const content = document.getElementById('patient-summary-content')?.innerHTML;
    if (!content) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>DMP Synthèse Médicale - GAB-SANTE</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; background: #f8fafc; color: #1e293b; }
    .page { max-width: 850px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    @media print { body { margin: 0; background: white; } .page { box-shadow: none; padding: 1rem; } }
  </style>
</head>
<body>
  <div class="page">${content}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DMP-Synthese-Clinique-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // MODULE ORDONNANCE MÉDICALE — Gabon (ONMG / CNAMGS / CNSS)
  // =========================================================================

  /**
   * Ouvre la modale de création d'ordonnance, pré-remplie pour le patient donné.
   */
  openOrdonnanceModal(patientId) {
    const modal = document.getElementById('modal-ordonnance-new');
    if (!modal) return;

    // Peuple le select patient
    const selPatient = document.getElementById('ordo-patient');
    if (selPatient) {
      selPatient.innerHTML = '<option value="">— Sélectionner un patient —</option>' +
        this.patients.map(p => `<option value="${p.id}" ${p.id === patientId ? 'selected' : ''}>${p.name}</option>`).join('');
    }

    // Peuple le select CHU
    const selChu = document.getElementById('ordo-chu');
    if (selChu) {
      selChu.innerHTML = '<option value="">— Sélectionner l\'établissement —</option>' +
        Object.entries(this.chuStatus).map(([k, v]) => `<option value="${k}">${v.name || k}</option>`).join('');
    }

    // Pré-remplit l'assurance depuis le patient
    if (patientId) {
      const patient = this.patients.find(p => p.id === patientId);
      if (patient) {
        const selIns = document.getElementById('ordo-insurance');
        if (selIns && patient.insurance) selIns.value = patient.insurance;
        // Pré-rempli le CHU courant
        if (selChu && patient.currentLocation) selChu.value = patient.currentLocation;
        this.onOrdoInsuranceChange();
      }
    }

    // Réinitialise le builder médicaments avec une ligne vide
    const container = document.getElementById('med-builder-container');
    if (container) container.innerHTML = '';
    this.addMedLine();

    // Réinitialise les autres champs
    const doctorField = document.getElementById('ordo-doctor');
    const onmgField = document.getElementById('ordo-onmg');
    const serviceField = document.getElementById('ordo-service');
    const weightField = document.getElementById('ordo-weight');
    const aldField = document.getElementById('ordo-ald');
    const notesField = document.getElementById('ordo-notes');
    if (doctorField) doctorField.value = '';
    if (onmgField) onmgField.value = '';
    if (serviceField) serviceField.value = '';
    if (weightField) weightField.value = '';
    if (aldField) aldField.checked = false;
    if (notesField) notesField.value = '';

    modal.classList.remove('hidden');
  }

  /**
   * Ajoute une ligne médicament dans le builder.
   */
  addMedLine() {
    const container = document.getElementById('med-builder-container');
    if (!container) return;

    const medicines = window.GABON_ESSENTIAL_MEDICINES || [];
    const index = container.querySelectorAll('.med-builder-row').length;

    const row = document.createElement('div');
    row.className = 'med-builder-row';
    row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:6px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;';
    row.dataset.index = index;

    row.innerHTML = `
      <div>
        <select class="med-name-select" onchange="saniApp.onMedSelect(${index})" style="width:100%;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;">
          <option value="">— Médicament —</option>
          ${medicines.map(m => `<option value="${m.name}" data-dosage="${m.defaultDosage}" data-form="${m.form}" data-posologie="${m.defaultPosologie}">${m.name} (${m.form})</option>`).join('')}
          <option value="__custom__">✏️ Saisie libre...</option>
        </select>
        <input type="text" class="med-custom-name" placeholder="Nom du médicament (saisie libre)" style="width:100%;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;margin-top:4px;display:none;box-sizing:border-box;">
      </div>
      <input type="text" class="med-dosage" placeholder="Dosage (ex: 500mg)" style="width:100%;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;box-sizing:border-box;">
      <input type="text" class="med-posologie" placeholder="Posologie (ex: 3x/j)" style="width:100%;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;box-sizing:border-box;">
      <input type="text" class="med-duree" placeholder="Durée (ex: 7j)" style="width:100%;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.8rem;box-sizing:border-box;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <label style="font-size:0.68rem;color:#475569;white-space:nowrap;display:flex;align-items:center;gap:3px;">
          <input type="checkbox" class="med-non-sub" title="Non Substituable"> NS
        </label>
        <button type="button" onclick="saniApp.removeMedLine(this)" style="background:#fee2e2;color:#dc2626;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.9rem;line-height:1;">✕</button>
      </div>
    `;

    container.appendChild(row);
  }

  /**
   * Supprime une ligne médicament.
   */
  removeMedLine(btn) {
    const row = btn.closest('.med-builder-row');
    if (row) row.remove();
  }

  /**
   * Pré-remplit dosage et posologie quand un médicament est sélectionné.
   */
  onMedSelect(index) {
    const container = document.getElementById('med-builder-container');
    if (!container) return;
    const row = container.querySelector(`.med-builder-row[data-index="${index}"]`);
    if (!row) return;

    const select = row.querySelector('.med-name-select');
    const customInput = row.querySelector('.med-custom-name');
    const dosageInput = row.querySelector('.med-dosage');
    const posologieInput = row.querySelector('.med-posologie');

    const selectedOption = select.options[select.selectedIndex];
    const isCustom = select.value === '__custom__';

    if (customInput) customInput.style.display = isCustom ? 'block' : 'none';

    if (!isCustom && selectedOption) {
      const dosage = selectedOption.dataset.dosage || '';
      const posologie = selectedOption.dataset.posologie || '';
      if (dosageInput && dosage) dosageInput.value = dosage;
      if (posologieInput && posologie) posologieInput.value = posologie;
    }
  }

  /**
   * Pré-remplit l'assurance quand le patient change dans la modale.
   */
  onOrdoPatientChange() {
    const patientId = document.getElementById('ordo-patient')?.value;
    if (!patientId) return;
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) return;
    const selIns = document.getElementById('ordo-insurance');
    if (selIns && patient.insurance) selIns.value = patient.insurance;
    const selChu = document.getElementById('ordo-chu');
    if (selChu && patient.currentLocation) selChu.value = patient.currentLocation;
    this.onOrdoInsuranceChange();
  }

  /**
   * Adapte la couleur du header selon l'assurance sélectionnée.
   */
  onOrdoInsuranceChange() {
    const ins = document.getElementById('ordo-insurance')?.value || 'NONE';
    const header = document.getElementById('ordo-header');
    const subtitle = document.getElementById('ordo-header-subtitle');
    const colorMap = {
      CNAMGS_FONC: '#0072ce', CNAMGS_PVNR: '#059669', CNAMGS_SECT_PRIVE: '#0072ce',
      CNAMGS_TIS: '#0072ce', CNAMGS_ETUD: '#7c3aed', CNSS: '#b45309',
      ASCOMA: '#1d4ed8', OGAR: '#1d4ed8', AXA: '#1d4ed8', SANLAM: '#0e7490', NSIA: '#0e7490',
      MUTUELLE: '#6b7280', NONE: '#475569'
    };
    const labelMap = {
      CNAMGS_FONC: 'CNAMGS — Fonctionnaires • Prise en charge 80%',
      CNAMGS_PVNR: 'CNAMGS — PVNR • Prise en charge 100%',
      CNAMGS_SECT_PRIVE: 'CNAMGS — Secteur Privé • Prise en charge 80%',
      CNAMGS_TIS: 'CNAMGS — TIS • Prise en charge 80%',
      CNAMGS_ETUD: 'CNAMGS — Étudiants • Prise en charge 80%',
      CNSS: 'CNSS — AT/MP • Prise en charge 100%',
      ASCOMA: 'ASCOMA Gabon — Assurance Privée',
      OGAR: 'OGAR Gabon — Assurance Privée',
      AXA: 'AXA Santé Gabon',
      SANLAM: 'Sanlam Gabon',
      NSIA: 'NSIA Gabon',
      MUTUELLE: 'Mutuelle de Santé',
      NONE: 'Ordonnance CHU Standard — Sans Assurance'
    };
    const color = colorMap[ins] || '#0072ce';
    if (header) header.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
    if (subtitle) subtitle.textContent = labelMap[ins] || 'RÉPUBLIQUE GABONAISE — Ministère de la Santé';
  }

  /**
   * Soumet le formulaire de création d'ordonnance.
   */
  submitNewPrescription(event) {
    event.preventDefault();

    const patientId = document.getElementById('ordo-patient')?.value;
    const patient = this.patients.find(p => p.id === patientId);
    if (!patient) { this.showToast('Veuillez sélectionner un patient valide.'); return; }

    // Collecte les médicaments
    const rows = document.querySelectorAll('#med-builder-container .med-builder-row');
    const medications = [];
    rows.forEach(row => {
      const select = row.querySelector('.med-name-select');
      const customInput = row.querySelector('.med-custom-name');
      const isCustom = select.value === '__custom__';
      const medName = isCustom ? (customInput?.value.trim() || '') : select.value;
      if (!medName) return;
      medications.push({
        name: medName,
        dosage: row.querySelector('.med-dosage')?.value.trim() || '',
        posologie: row.querySelector('.med-posologie')?.value.trim() || '',
        duree: row.querySelector('.med-duree')?.value.trim() || '',
        nonSubstituable: row.querySelector('.med-non-sub')?.checked || false
      });
    });

    if (medications.length === 0) {
      this.showToast('⚠️ Ajoutez au moins un médicament avant de valider.');
      return;
    }

    const chuKey = document.getElementById('ordo-chu')?.value || patient.currentLocation;
    const chuInfo = this.chuStatus[chuKey] || { name: chuKey, shortName: chuKey };
    const insKey = document.getElementById('ordo-insurance')?.value || patient.insurance || 'NONE';
    const aldChecked = document.getElementById('ordo-ald')?.checked || false;

    const prescription = {
      id: 'ORD-' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      patientIns: patient.ins,
      patientCnamgs: patient.cnamgs,
      patientBirthdate: patient.birthdate,
      patientBloodType: patient.bloodType,
      patientAllergies: patient.allergies,
      patientWeight: document.getElementById('ordo-weight')?.value || '',
      doctor: document.getElementById('ordo-doctor')?.value.trim() || '',
      onmg: document.getElementById('ordo-onmg')?.value.trim() || '',
      service: document.getElementById('ordo-service')?.value.trim() || '',
      chuKey,
      chuName: chuInfo.name,
      insuranceKey: insKey,
      ald: aldChecked,
      notes: document.getElementById('ordo-notes')?.value.trim() || '',
      medications,
      createdAt: new Date().toISOString(),
      dateText: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      timeText: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    this.prescriptions.unshift(prescription);
    this.saveData('sani_prescriptions', this.prescriptions);
    this.currentPrescriptionId = prescription.id;

    this.closeAllModals();
    this.showToast(`✅ Ordonnance ${prescription.id} générée pour ${patient.name}`);
    this.viewPrescription(prescription.id);
  }

  /**
   * Ouvre la modale de visualisation/impression d'une ordonnance existante.
   */
  viewPrescription(prescriptionId) {
    const prescription = this.prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) { this.showToast('Ordonnance introuvable.'); return; }

    this.currentPrescriptionId = prescriptionId;

    const modal = document.getElementById('modal-ordonnance-view');
    const container = document.getElementById('ordonnance-view-content');
    if (!modal || !container) return;

    // Génère le HTML de l'ordonnance
    if (window.OrdonnanceService && typeof window.OrdonnanceService.generateHtml === 'function') {
      const patient = this.patients.find(p => p.id === prescription.patientId);
      const chu = this.chuStatus[prescription.chuKey];
      const insurance = this.getInsurance(prescription.insuranceKey);
      container.innerHTML = window.OrdonnanceService.generateHtml(prescription, patient, chu, insurance);
      // Génère le QR Code
      setTimeout(() => {
        const qrEl = document.getElementById('qrcode-ordonnance');
        if (qrEl && window.QRCode) {
          qrEl.innerHTML = '';
          new QRCode(qrEl, {
            text: `GAB-SANTE|${prescription.id}|${prescription.patientIns}|${prescription.doctor}|${prescription.dateText}`,
            width: 80, height: 80,
            colorDark: '#1e293b', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        }
      }, 150);
    } else {
      // Rendu de secours si ordonnance.js non chargé
      container.innerHTML = this._renderPrescriptionFallback(prescription);
    }

    // Met à jour la couleur du header de la modale view
    const viewHeader = document.getElementById('ordo-view-header');
    if (viewHeader) {
      const colorMap = { CNAMGS_PVNR: '#059669', CNSS: '#b45309', NONE: '#475569' };
      const ins = prescription.insuranceKey;
      const c = colorMap[ins] || '#0072ce';
      viewHeader.style.background = `linear-gradient(135deg, ${c}, ${c}cc)`;
    }

    modal.classList.remove('hidden');
  }

  /**
   * Rendu de secours si ordonnance.js n'est pas chargé (simplifié).
   */
  _renderPrescriptionFallback(p) {
    return `
      <div style="background:white;padding:1.5rem;border-radius:8px;font-family:Arial,sans-serif;max-width:750px;margin:0 auto;">
        <div style="text-align:center;border-bottom:2px solid #0072ce;padding-bottom:12px;margin-bottom:16px;">
          <strong style="font-size:1.1rem;color:#0072ce;">ORDONNANCE MÉDICALE</strong><br>
          <span style="font-size:0.8rem;color:#64748b;">République Gabonaise — ${p.chuName}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.85rem;margin-bottom:12px;">
          <div><strong>Patient :</strong> ${p.patientName}</div>
          <div><strong>N° :</strong> ${p.id}</div>
          <div><strong>Médecin :</strong> ${p.doctor}${p.onmg ? ' (ONMG: ' + p.onmg + ')' : ''}</div>
          <div><strong>Date :</strong> ${p.dateText}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.83rem;margin-bottom:16px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:6px;text-align:left;border:1px solid #e2e8f0;">Médicament</th>
            <th style="padding:6px;text-align:left;border:1px solid #e2e8f0;">Dosage</th>
            <th style="padding:6px;text-align:left;border:1px solid #e2e8f0;">Posologie</th>
            <th style="padding:6px;text-align:left;border:1px solid #e2e8f0;">Durée</th>
          </tr></thead>
          <tbody>
            ${p.medications.map((m, i) => `
              <tr style="background:${i % 2 ? '#f8fafc' : 'white'};">
                <td style="padding:6px;border:1px solid #e2e8f0;font-weight:600;">${m.name}${m.nonSubstituable ? ' <span style="color:#dc2626;font-size:0.7rem;">[NS]</span>' : ''}</td>
                <td style="padding:6px;border:1px solid #e2e8f0;">${m.dosage}</td>
                <td style="padding:6px;border:1px solid #e2e8f0;">${m.posologie}</td>
                <td style="padding:6px;border:1px solid #e2e8f0;">${m.duree}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        ${p.notes ? `<div style="font-size:0.82rem;color:#374151;padding:8px 12px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;margin-bottom:16px;"><strong>Conseils :</strong> ${p.notes}</div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:16px;border-top:1px dashed #cbd5e1;">
          <div style="text-align:center;width:200px;">
            <div style="border-top:2px solid #1e293b;padding-top:6px;font-size:0.78rem;color:#374151;">
              <strong>${p.doctor}</strong><br>
              <span style="font-size:0.72rem;color:#64748b;">${p.service || 'Service médical'}</span><br>
              <span style="font-size:0.7rem;color:#94a3b8;">Signature &amp; Cachet ONMG</span>
            </div>
          </div>
          <div style="text-align:center;width:180px;">
            <div style="border:1px dashed #94a3b8;border-radius:6px;padding:10px;font-size:0.72rem;color:#94a3b8;">
              📍 Cachet Officine Pharmaceutique<br>
              (Réservé à la délivrance)
            </div>
          </div>
          <div id="qrcode-ordonnance" style="width:80px;height:80px;"></div>
        </div>
      </div>`;
  }

  /**
   * Imprime l'ordonnance courante via window.print().
   */
  printCurrentPrescription() {
    window.print();
  }

  /**
   * Exporte l'ordonnance courante en fichier HTML autonome.
   */
  exportCurrentPrescriptionHtml() {
    const content = document.getElementById('ordonnance-view-content')?.innerHTML;
    if (!content) return;
    const prescription = this.prescriptions.find(p => p.id === this.currentPrescriptionId);
    const title = prescription ? `Ordonnance-${prescription.patientName.replace(/\s+/g, '-')}-${prescription.id}` : 'Ordonnance-GAB-SANTE';

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; }
    @media print { body { margin: 0; background: white; } .page { box-shadow: none; padding: 1cm; } }
  </style>
</head>
<body>
  <div class="page">${content}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Ordonnance exportée en HTML avec succès !');
  }

  /**
   * Affiche la liste des ordonnances d'un patient dans son DMP.
   */
  renderPrescriptionsForPatient(patientId) {
    const patientPrescriptions = this.prescriptions.filter(p => p.patientId === patientId);
    if (patientPrescriptions.length === 0) return '<p style="color:#94a3b8;font-size:0.82rem;">Aucune ordonnance enregistrée pour ce patient.</p>';
    return `<div style="display:flex;flex-direction:column;gap:8px;">
      ${patientPrescriptions.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;">
          <div>
            <div style="font-size:0.82rem;font-weight:700;color:#0f172a;">💊 ${p.id}</div>
            <div style="font-size:0.76rem;color:#64748b;">${p.dateText} — ${p.doctor} — ${p.medications.length} médicament(s)</div>
          </div>
          <button class="btn-secondary" style="font-size:0.75rem;padding:0.3rem 0.7rem;" onclick="saniApp.viewPrescription('${p.id}')">👁️ Voir / Imprimer</button>
        </div>
      `).join('')}
    </div>`;
  }

  // =========================================================================
  // MODULE ASSISTANT IA CLINIQUE & AIDE AU DIAGNOSTIC (GAB-SANTE)
  // =========================================================================

  renderAiAssistantView() {
    this.refreshAiPatientSelect();
    this.renderAiChatMessages();
    this.updateAiStatusDisplay();

    // Gestion de la touche Entrée pour l'envoi rapide
    const promptInput = document.getElementById('ai-user-prompt');
    if (promptInput && !promptInput.dataset.enterBound) {
      promptInput.dataset.enterBound = 'true';
      promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const form = document.getElementById('form-ai-chat');
          if (form) form.requestSubmit();
        }
      });
    }
  }

  refreshAiPatientSelect() {
    const sel = document.getElementById('ai-patient-context-select');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">— Aucun patient sélectionné —</option>' +
      this.patients.map(p => `
        <option value="${p.id}" ${p.id === currentVal ? 'selected' : ''}>
          ${p.name} (${p.bloodType} • ${p.currentLocation.toUpperCase()})
        </option>
      `).join('');
  }

  renderAiChatMessages() {
    const container = document.getElementById('ai-chat-messages');
    if (!container || !window.AiAssistantService) return;

    const history = window.AiAssistantService.chatHistory || [];
    container.innerHTML = history.map((msg, idx) => {
      const isUser = msg.role === 'user';
      const formattedContent = window.AiAssistantService.markdownToHtml(msg.content);
      const isDischarge = !isUser && (
        (msg.content || '').toLowerCase().includes('compte-rendu') ||
        (msg.content || '').toLowerCase().includes('sortie') ||
        (msg.content || '').toLowerCase().includes('crh') ||
        (msg.content || '').toLowerCase().includes('hospitalisation')
      );

      return `
        <div style="display: flex; gap: 10px; max-width: 90%; ${isUser ? 'align-self: flex-end; flex-direction: row-reverse;' : 'align-self: flex-start;'}">
          <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; background: ${isUser ? '#0072ce' : '#0284c7'}; color: white;">
            ${isUser ? '👨‍⚕️' : '🤖'}
          </div>
          <div style="background: ${isUser ? '#0072ce' : '#ffffff'}; color: ${isUser ? '#ffffff' : '#1e293b'}; border: 1px solid ${isUser ? '#005bb5' : '#e2e8f0'}; border-radius: 12px; padding: 0.75rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); font-size: 0.84rem; line-height: 1.5; word-break: break-word; min-width: 260px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 0.7rem; opacity: ${isUser ? '0.85' : '0.6'}; gap: 12px;">
              <strong>${isUser ? 'Praticien' : 'Assistant IA GAB-SANTE'}</strong>
              <span>${msg.timestamp || ''}</span>
            </div>
            <div>${formattedContent}</div>
            ${!isUser ? `
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; align-items: center;">
                <button type="button" class="btn-secondary" style="font-size: 0.73rem; padding: 0.3rem 0.65rem; display: inline-flex; align-items: center; gap: 4px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; color: #334155;" onclick="saniApp.copyAiMessage(${idx})" title="Copier le texte dans le presse-papier">
                  📋 Copier
                </button>
                <button type="button" class="btn-primary" style="font-size: 0.73rem; padding: 0.35rem 0.8rem; display: inline-flex; align-items: center; gap: 5px; background: ${isDischarge ? 'linear-gradient(135deg, #059669, #10b981)' : '#0072ce'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" onclick="saniApp.openAiDocumentModal(${idx})" title="Imprimer le compte-rendu ou courrier médical officiel">
                  🖨️ ${isDischarge ? 'Imprimer le Courrier de Sortie' : 'Imprimer ce document'}
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Auto-scroll vers le bas
    container.scrollTop = container.scrollHeight;
  }

  toggleAiConfigPanel() {
    const panel = document.getElementById('ai-config-panel');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';

    if (isHidden && window.AiAssistantService) {
      const cfg = window.AiAssistantService.config;
      const provEl = document.getElementById('ai-cfg-provider');
      const modEl = document.getElementById('ai-cfg-model');
      const keyEl = document.getElementById('ai-cfg-key');
      const promptEl = document.getElementById('ai-cfg-system-prompt');

      if (provEl) provEl.value = cfg.provider || 'openrouter';
      const currentModel = cfg.model || 'nvidia/nemotron-3.5-lightning:free';
      if (modEl) modEl.value = currentModel;
      
      const modSelect = document.getElementById('ai-cfg-model-select');
      if (modSelect) {
        const optionExists = Array.from(modSelect.options).some(o => o.value === currentModel);
        if (optionExists) {
          modSelect.value = currentModel;
          if (modEl) modEl.style.display = 'none';
        } else {
          modSelect.value = '__custom__';
          if (modEl) modEl.style.display = 'block';
        }
      }

      if (keyEl) keyEl.value = cfg.apiKey || '';
      if (promptEl) promptEl.value = cfg.systemPrompt || '';

      this.updateAiKeyStatusBadge();
    }
  }

  toggleApiKeyVisibility() {
    const keyEl = document.getElementById('ai-cfg-key');
    if (!keyEl) return;
    keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
  }

  onAiModelSelectChange() {
    const sel = document.getElementById('ai-cfg-model-select');
    const input = document.getElementById('ai-cfg-model');
    if (!sel || !input) return;

    if (sel.value === '__custom__') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = sel.value;
    }
  }

  onAiProviderChange() {
    const prov = document.getElementById('ai-cfg-provider')?.value || 'openrouter';
    const modEl = document.getElementById('ai-cfg-model');
    const keyEl = document.getElementById('ai-cfg-key');
    const modSelect = document.getElementById('ai-cfg-model-select');

    if (prov === 'openrouter') {
      if (modSelect) {
        modSelect.parentElement.style.display = 'block';
        modSelect.value = 'nvidia/nemotron-3.5-lightning:free';
      }
      if (modEl) {
        modEl.value = 'nvidia/nemotron-3.5-lightning:free';
        modEl.style.display = 'none';
      }
      if (keyEl) keyEl.placeholder = 'Collez votre clé OpenRouter (sk-or-v1-...)';
    } else {
      if (modSelect) modSelect.parentElement.style.display = 'block';
      if (prov === 'gemini') {
        if (modEl) { modEl.value = 'gemini-1.5-flash'; modEl.style.display = 'block'; }
        if (keyEl) keyEl.placeholder = 'Collez votre clé Google AI Studio (AIzaSy...)';
      } else if (prov === 'openai') {
        if (modEl) { modEl.value = 'gpt-4o-mini'; modEl.style.display = 'block'; }
        if (keyEl) keyEl.placeholder = 'Collez votre clé OpenAI (sk-...)';
      } else if (prov === 'deepseek') {
        if (modEl) { modEl.value = 'deepseek-chat'; modEl.style.display = 'block'; }
        if (keyEl) keyEl.placeholder = 'Collez votre clé DeepSeek (sk-...)';
      }
    }
  }

  saveAiConfig(event) {
    if (event) event.preventDefault();
    if (!window.AiAssistantService) return;

    const provider = document.getElementById('ai-cfg-provider')?.value || 'openrouter';
    const modelSelect = document.getElementById('ai-cfg-model-select');
    let model = 'nvidia/nemotron-3.5-lightning:free';

    if (modelSelect && modelSelect.value !== '__custom__') {
      model = modelSelect.value;
    } else {
      model = document.getElementById('ai-cfg-model')?.value.trim() || 'nvidia/nemotron-3.5-lightning:free';
    }

    const apiKey = document.getElementById('ai-cfg-key')?.value.trim() || '';
    const systemPrompt = document.getElementById('ai-cfg-system-prompt')?.value.trim() || '';

    window.AiAssistantService.saveConfig({ provider, model, apiKey, systemPrompt });

    this.updateAiStatusDisplay();
    this.updateAiKeyStatusBadge();
    this.showToast('✅ Configuration et clé IA enregistrées avec succès !');
    
    // Fermer le panneau après sauvegarde
    const panel = document.getElementById('ai-config-panel');
    if (panel) panel.style.display = 'none';
  }

  updateAiKeyStatusBadge() {
    const statusEl = document.getElementById('ai-key-status');
    if (!statusEl || !window.AiAssistantService) return;
    const hasKey = Boolean(window.AiAssistantService.config.apiKey);
    if (hasKey) {
      statusEl.textContent = '● Clé configurée';
      statusEl.style.color = '#059669';
    } else {
      statusEl.textContent = '○ Aucune clé saisie';
      statusEl.style.color = '#dc2626';
    }
  }

  updateAiStatusDisplay() {
    if (!window.AiAssistantService) return;
    const cfg = window.AiAssistantService.config;
    const provEl = document.getElementById('ai-status-provider');
    const modEl = document.getElementById('ai-status-model');
    if (provEl) provEl.textContent = cfg.provider ? cfg.provider.toUpperCase() : 'GEMINI';
    if (modEl) modEl.textContent = cfg.model || 'gemini-1.5-flash';
  }

  clearAiChat() {
    if (!window.AiAssistantService) return;
    if (confirm("Voulez-vous effacer l'historique de cette session d'assistance ?")) {
      window.AiAssistantService.clearHistory();
      this.renderAiChatMessages();
      this.showToast('Historique du chat IA réinitialisé.');
    }
  }

  async submitAiPrompt(event) {
    if (event) event.preventDefault();
    if (!window.AiAssistantService) return;

    const input = document.getElementById('ai-user-prompt');
    const sendBtn = document.getElementById('ai-btn-send');
    const indicator = document.getElementById('ai-typing-indicator');
    if (!input) return;

    const promptText = input.value.trim();
    if (!promptText) return;

    if (!window.AiAssistantService.config.apiKey) {
      this.toggleAiConfigPanel();
      alert("⚠️ Clé API requise !\n\nVeuillez coller votre clé API dans le panneau 'Configuration IA & Prompts' ci-dessus pour activer les réponses.");
      return;
    }

    // Récupération éventuelle du contexte d'un patient sélectionné
    let patientContext = '';
    const selPatientId = document.getElementById('ai-patient-context-select')?.value;
    if (selPatientId) {
      const patient = this.patients.find(p => p.id === selPatientId);
      if (patient) {
        patientContext = JSON.stringify({
          nom: patient.name,
          dateNaissance: patient.birthdate,
          groupeSanguin: patient.bloodType,
          allergies: patient.allergies,
          pathologies: patient.chronicDiseases,
          etablissement: patient.currentLocation,
          service: patient.currentService,
          assurance: patient.insurance,
          historiqueSoins: patient.history?.slice(-3)
        }, null, 2);
      }
    }

    input.value = '';
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span>Analyse…</span> <span class="loading-spinner" style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>';
    }
    if (indicator) indicator.style.display = 'flex';

    this.renderAiChatMessages();

    // Scroll automatique pour voir l'indicateur de génération
    const chatContainer = document.getElementById('ai-chat-messages');
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      await window.AiAssistantService.sendMessage(promptText, patientContext);
    } catch (err) {
      console.error('[GAB-SANTE AI Error]', err);
      window.AiAssistantService.chatHistory.push({
        role: 'assistant',
        content: `❌ **Erreur lors de la génération :**\n${err.message}\n\n*Vérifiez votre clé API et vos crédits dans la configuration.*`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      window.AiAssistantService.saveHistory();
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>Envoyer</span> <span>🚀</span>';
      }
      if (indicator) indicator.style.display = 'none';
      this.renderAiChatMessages();

      // Notification si un courrier de sortie ou document a été généré
      const isDischarge = promptText.toLowerCase().includes('sortie') || promptText.toLowerCase().includes('crh') || promptText.toLowerCase().includes('compte-rendu');
      if (isDischarge) {
        this.showToast('✅ Courrier de sortie généré ! Cliquez sur "🖨️ Imprimer" pour imprimer le document officiel.');
      }
    }
  }

  aiQuickAction(actionType) {
    const input = document.getElementById('ai-user-prompt');
    if (!input) return;

    const prompts = {
      palu: "Rappelle-moi le protocole officiel de prise en charge du paludisme grave chez l'adulte et l'enfant au Gabon (posologie Artésunate IV selon le poids, relais oral par ACT, critères de surveillance).",
      drepanocytose: "Quelle est la conduite à tenir pour une crise vaso-occlusive hyperalgique chez un patient drépanocytaire SS (hyperhydratation, analgésie selon paliers OMS, indications de transfusion/échange érythrocytaire) ?",
      interaction: "Quelles sont les interactions médicamenteuses majeures et contre-indications à surveiller en cas de bithérapie cardiologique et antipaludique ?",
      samu: "Quels sont les critères cliniques d'engagement immédiat du SAMU 1300 et d'indication de transfert vers le service de réanimation du CHU de Libreville (CHUL) ?"
    };

    input.value = prompts[actionType] || '';
    input.focus();
  }

  aiAnalyzeSelectedPatient() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    if (!sel || !sel.value) {
      alert("Veuillez d'abord sélectionner un patient dans le menu déroulant.");
      return;
    }
    const patient = this.patients.find(p => p.id === sel.value);
    if (!patient || !input) return;

    input.value = `Analyse le dossier clinique complet de ${patient.name} (${patient.bloodType}). Identifie les alertes médicales majeures, vérifie la compatibilité de ses traitements avec ses antécédents et suggère les points de vigilance prioritaires.`;
    input.focus();
  }

  // 1. Rédaction automatique de compte-rendu d'hospitalisation / courrier de sortie
  aiGenerateDischargeSummary() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId) || this.patients[0];

    if (!sel.value && patient) {
      sel.value = patient.id;
    }

    if (input && patient) {
      input.value = `Rédige un compte-rendu d'hospitalisation (CRH) officiel et complet pour la sortie de ${patient.name} hospitalisé au ${patient.currentLocation.toUpperCase()} (${patient.currentService}).
Structure le courrier avec :
1. Motif d'admission et histoire de la maladie
2. Antécédents, terrain drépanocytaire/cardiovasculaire et allergies (${patient.allergies?.join(', ') || 'Aucune'})
3. Évolution clinique sous traitement et examens complémentaires
4. Traitement de sortie recommandé (DCI et posologie)
5. Modalités de suivi en consultation externe et consignes d'alerte pour réadmission d'urgence.`;
      input.focus();
    }
  }

  // 2. Score de triage SAMU 1300 et régulation des lits de réanimation
  aiTriageSamuScore() {
    const input = document.getElementById('ai-user-prompt');
    if (!input) return;
    const chul = this.chuStatus['chul'] || { occupiedBeds: 450, totalBeds: 500 };
    const chuo = this.chuStatus['chuo'] || { occupiedBeds: 180, totalBeds: 200 };

    input.value = `Effectue une évaluation de régulation médicale d'urgence SAMU 1300 pour un patient polytraumatisé instable :
- Paramètres : TA 85/50 mmHg, FC 128 bpm, SpO2 89% sous air ambiant, Score de Glasgow 11/15.
- Contexte réseau : CHU de Libreville (${chul.occupiedBeds}/${chul.totalBeds} lits) et CHU d'Owendo (${chuo.occupiedBeds}/${chuo.totalBeds} lits).
Donne :
1. Le calcul des scores de gravité (Score de Glasgow, qSOFA, RTS)
2. La priorisation du transfert médicalisé (SMUR terrestre vs héliporté)
3. Les gestes de réanimation immédiate pendant le transport
4. L'orientation hospitalière optimale selon la disponibilité des plateaux techniques et lits de réanimation.`;
    input.focus();
  }

  // 3. Rapport d'analyse épidémiologique et veille sanitaire nationale
  aiEpidemioAnalysis() {
    const input = document.getElementById('ai-user-prompt');
    if (!input) return;
    const totalPatients = this.patients.length;
    const totalTransfers = this.transfers.length;

    input.value = `Génère le bulletin d'alerte épidémiologique et sanitaire hebdomadaire pour le Ministère de la Santé du Gabon :
Données réseau : ${totalPatients} dossiers actifs, ${totalTransfers} transferts d'urgence enregistrés entre les CHU de Libreville, Owendo, Angondjé et Melen.
Rédige une analyse synthétique couvrant :
1. La veille paludisme saisonnier et formes pédiatriques compliquées en zone périurbaine
2. Les syndromes fébriles et vigilance Dengue / Chikungunya
3. La pression d'occupation des lits de réanimation et de médecine d'urgence
4. 3 recommandations concrètes de santé publique pour les directeurs de CHU.`;
    input.focus();
  }

  // 4. Préparation de dossier pour staff de Télé-Expertise et Réunion Pluridisciplinaire (RCP)
  aiPrepareRcpSynthesis() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId) || this.patients[0];

    if (!sel.value && patient) {
      sel.value = patient.id;
    }

    if (input && patient) {
      input.value = `Prépare la fiche de synthèse pour la Réunion de Concertation Pluridisciplinaire (RCP / Télé-Expertise) inter-CHU pour le cas de ${patient.name} :
- Pathologie suspectée : Néoplasie digestive / Complication drépanocytaire
- Données actuelles : ${patient.age || 42} ans, groupe sanguin ${patient.bloodType}, suivi à ${patient.currentLocation.toUpperCase()}
Détaille :
1. Résumé chronologique du dossier clinique
2. Question précise posée au collège d'experts (Indication chirurgicale vs chimiothérapie vs traitement conservateur)
3. Examens d'imagerie PACS/DICOM et bilan biologique requis avant délibération
4. Proposition de protocole thérapeutique concerté à soumettre au staff.`;
      input.focus();
    }
  }

  // 5. Aide au diagnostic différentiel basé sur les symptômes
  aiDifferentialDiagnosis() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId);

    if (input) {
      const context = patient
        ? `Patient : ${patient.name}, ${patient.age || '?'} ans, ${patient.bloodType}, antécédents : ${patient.medicalHistory || 'non renseignés'}, allergies : ${patient.allergies?.join(', ') || 'aucune'}.\n`
        : '';
      input.value = `${context}Établis un diagnostic différentiel complet pour les symptômes suivants observés en milieu hospitalier gabonais :
Symptômes : [Fièvre élevée > 39°C depuis 3 jours, frissons, céphalées intenses, douleurs abdominales, splénomégalie à la palpation]
Contexte épidémiologique : zone tropicale sub-saharienne, saison des pluies, pas de chimioprophylaxie antipaludique.
Donne :
1. Les 5 diagnostics les plus probables classés par ordre de probabilité avec pourcentage estimé
2. Les critères cliniques et paracliniques permettant de différencier chaque hypothèse
3. Les examens complémentaires prioritaires (TDR, NFS, Frottis épais, CRP, hémocultures)
4. La conduite à tenir en urgence avant confirmation diagnostique
5. Les signes de gravité imposant un transfert immédiat en réanimation.`;
      input.focus();
    }
  }

  // 6. Calcul de posologie pédiatrique par poids et âge
  aiPediatricDosage() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId);

    if (input) {
      const context = patient
        ? `Patient sélectionné : ${patient.name}, ${patient.age || '?'} ans.\n`
        : '';
      input.value = `${context}Calcule les posologies pédiatriques adaptées pour un enfant de [Âge : 4 ans / Poids : 16 kg] pris en charge au CHU pour paludisme grave avec signes neurologiques :
Médicaments à calculer :
1. Artésunate IV (Malacef®) — première ligne paludisme grave OMS 2023
2. Paracétamol IV (Perfalgan®) — antipyrèse
3. Diazépam IR (Valium®) — si convulsions
4. Vitamine C IV — en cas d'anémie hémolytique associée
Pour chaque médicament, fournis :
- Dose mg/kg et dose totale pour ce patient
- Voie d'administration, fréquence et durée du traitement
- Posologie maximale journalière et critères de surveillance
- Adaptations si insuffisance rénale ou hépatique sous-jacente
- Durée de conservation après ouverture et conditions de stockage en milieu tropical.`;
      input.focus();
    }
  }

  // 7. Résumé synthétique du Dossier Médical Partagé (DMP) complet
  aiSummarizeDmp() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId) || this.patients[0];

    if (!sel.value && patient) {
      sel.value = patient.id;
    }

    if (input && patient) {
      const allergies = patient.allergies?.join(', ') || 'Aucune allergie connue';
      const history = patient.medicalHistory || 'Non renseigné';
      const location = (patient.currentLocation || '').toUpperCase();
      const service = patient.currentService || 'service non précisé';
      input.value = `Génère un résumé structuré et synthétique du Dossier Médical Partagé (DMP) pour ${patient.name} :
Données disponibles :
- Âge : ${patient.age || '?'} ans | Groupe sanguin : ${patient.bloodType}
- Localisation actuelle : ${location} — ${service}
- Antécédents : ${history}
- Allergies documentées : ${allergies}
Fournis un résumé DMP normalisé couvrant :
1. Synthèse médicale active (problèmes en cours, traitements en cours)
2. Historique des hospitalisations et interventions chirurgicales
3. Bilan immuno-hématologique (groupe, RAI, transfusions antérieures)
4. Vaccinations et prophylaxies en cours
5. Points de vigilance prioritaires pour les équipes soignantes inter-CHU
6. Recommandations pour la continuité des soins lors d'un transfert.`;
      input.focus();
    } else if (input) {
      alert("Veuillez d'abord sélectionner un patient dans le menu déroulant.");
    }
  }

  // 8. Interprétation des résultats biologiques et alertes paracliniques
  aiInterpretLabResults() {
    const sel = document.getElementById('ai-patient-context-select');
    const input = document.getElementById('ai-user-prompt');
    const patientId = sel?.value;
    const patient = this.patients.find(p => p.id === patientId);

    if (input) {
      const context = patient
        ? `Patient : ${patient.name}, ${patient.age || '?'} ans, ${patient.bloodType}.\n`
        : '';
      input.value = `${context}Interprète les résultats biologiques suivants pour un patient hospitalisé au CHU de Libreville et identifie toutes les anomalies critiques :
Résultats NFS :
- Hémoglobine : 6,8 g/dL (N : 12-16 g/dL)
- Hématocrite : 21% (N : 37-47%)
- Leucocytes : 14 200 /mm³ (N : 4 000-10 000)
- Plaquettes : 48 000 /mm³ (N : 150 000-400 000)
Bilan hépatique :
- ASAT : 87 UI/L (N < 40) | ALAT : 62 UI/L (N < 45)
- Bilirubine totale : 52 µmol/L (N < 17) | Bilirubine directe : 18 µmol/L
Bilan rénal :
- Créatinine : 145 µmol/L (N : 50-110) | Urée : 12,8 mmol/L
- Ionogramme : Na+ 132 mEq/L | K+ 5,2 mEq/L
Marqueurs infectieux :
- CRP : 148 mg/L (N < 10) | Procalcitonine : 3,2 ng/mL
- TDR Paludisme : POSITIF (Ag HRP2 Plasmodium falciparum)
Pour chaque anomalie identifiée :
1. Degré de gravité (critique / élevé / modéré / normal)
2. Signification clinique probable dans le contexte gabonais
3. Action médicale recommandée en urgence
4. Surveillance à mettre en place (fréquence des contrôles)
5. Seuils d'alarme imposant une escalade thérapeutique immédiate.`;
      input.focus();
    }
  }

  // =========================================================================
  // IMPRESSION & ÉDITION OFFICIELLE DES DOCUMENTS & COURRIERS IA
  // =========================================================================

  // Ouvre la modale d'impression officielle du courrier de sortie ou document IA
  openAiDocumentModal(msgIndex) {
    if (!window.AiAssistantService) return;
    const history = window.AiAssistantService.chatHistory || [];

    // Si aucun index fourni, chercher le dernier message assistant
    if (typeof msgIndex !== 'number') {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
          msgIndex = i;
          break;
        }
      }
    }

    const msg = history[msgIndex];
    if (!msg || !msg.content) {
      this.showToast("⚠️ Aucun document médical à imprimer pour le moment.");
      return;
    }

    this.currentAiDocumentText = msg.content;

    // Détection du patient ciblé
    const selPatientId = document.getElementById('ai-patient-context-select')?.value;
    let patient = this.patients.find(p => p.id === selPatientId);

    // Si aucun patient sélectionné dans le menu, chercher dans le contenu
    if (!patient) {
      patient = this.patients.find(p => msg.content.includes(p.name));
    }
    // Si toujours pas, chercher dans le message précédent (la question du médecin)
    if (!patient && msgIndex > 0 && history[msgIndex - 1]) {
      const prev = history[msgIndex - 1].content || '';
      patient = this.patients.find(p => prev.includes(p.name));
    }
    if (!patient && this.patients.length > 0) {
      patient = this.patients[0];
    }

    const patientName = patient ? patient.name : 'Patient non spécifié';
    const patientDob = patient ? (patient.birthdate || (patient.age ? `${patient.age} ans` : 'Non précisé')) : 'Non précisé';
    const patientBlood = patient ? patient.bloodType : 'Non renseigné';
    const patientIns = patient ? (patient.insurance || 'CNAMGS') : 'CNAMGS';
    const patientAllergies = (patient && patient.allergies && patient.allergies.length > 0) ? patient.allergies.join(', ') : 'Aucune allergie documentée';
    const chuKey = patient?.currentLocation || this.currentChu || 'chul';
    const chuObj = this.chuStatus[chuKey] || { name: 'CHU de Libreville (CHUL)', director: 'Direction Médicale' };
    const chuName = chuObj.name || 'Centre Hospitalier Universitaire de Libreville';
    const serviceName = patient?.currentService || 'Médecine Générale / Urgences';
    const todayDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Titre selon la nature du document
    const isDischarge = (msg.content || '').toLowerCase().includes('compte-rendu') || 
                        (msg.content || '').toLowerCase().includes('sortie') || 
                        (msg.content || '').toLowerCase().includes('crh');
    const docTitle = isDischarge ? "COMPTE-RENDU D'HOSPITALISATION & COURRIER DE SORTIE" : "DOCUMENT MÉDICAL & SYNTHÈSE CLINIQUE GAB-SANTE";

    const titleEl = document.getElementById('ai-document-modal-title');
    if (titleEl) {
      titleEl.textContent = `${docTitle} — ${patientName}`;
    }

    const formattedBody = window.AiAssistantService.markdownToHtml(msg.content);

    const container = document.getElementById('ai-document-view-content');
    if (container) {
      container.innerHTML = `
        <div class="official-medical-doc" style="max-width: 780px; margin: 0 auto; color: #1e293b; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6;">
          
          <!-- En-tête officiel République Gabonaise -->
          <div style="border-bottom: 2.5px solid #0072ce; padding-bottom: 14px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
              <div>
                <div style="font-weight: 800; font-size: 0.9rem; color: #1e3a8a; letter-spacing: 0.6px; text-transform: uppercase;">RÉPUBLIQUE GABONAISE</div>
                <div style="font-size: 0.74rem; font-style: italic; color: #64748b; margin-top: 1px;">Union — Travail — Justice</div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #334155; margin-top: 6px;">MINISTÈRE DE LA SANTÉ ET DES AFFAIRES SOCIALES</div>
                <div style="font-size: 0.86rem; font-weight: 800; color: #0072ce; margin-top: 3px;">${chuName}</div>
                <div style="font-size: 0.78rem; color: #64748b;">Service : <strong>${serviceName}</strong> • Plateforme GAB-SANTE</div>
              </div>
              <div style="text-align: right; min-width: 220px;">
                <div style="font-size: 0.76rem; color: #64748b;">Libreville, le <strong>${todayDate}</strong></div>
                <div style="font-size: 0.76rem; color: #64748b; margin-top: 3px;">Réf. Dossier : <strong>${patient?.id || 'REF-GAB-IA'}</strong></div>
                <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">N° INS : <code>${patient?.ins || 'INS-GA-XXXX'}</code></div>
                <div style="margin-top: 8px; display: inline-block; padding: 4px 10px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 4px; font-size: 0.72rem; color: #166534; font-weight: 800;">
                  DOCUMENT MÉDICAL CERTIFIÉ
                </div>
              </div>
            </div>
          </div>

          <!-- Titre du document -->
          <div style="background: #f0f7ff; border-left: 5px solid #0072ce; padding: 12px 18px; margin-bottom: 20px; text-align: center; border-radius: 0 8px 8px 0;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #0072ce; text-transform: uppercase; letter-spacing: 0.6px;">
              ${docTitle}
            </div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">
              Document médical opposable émis par le réseau hospitalier national GAB-SANTE
            </div>
          </div>

          <!-- Fiche Signalétique du Patient -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; font-size: 0.85rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px;">
              <div><strong>Nom & Prénom :</strong> <span style="font-size: 0.95rem; color: #0f172a; font-weight: 700;">${patientName}</span></div>
              <div><strong>Date de Naissance / Âge :</strong> ${patientDob}</div>
              <div><strong>Groupe Sanguin :</strong> <span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 1px 7px; border-radius: 4px; font-weight: 700;">${patientBlood}</span></div>
              <div><strong>Couverture Médicale :</strong> ${patientIns}</div>
              <div><strong>Établissement de soins :</strong> ${chuName}</div>
              <div><strong>Service traitant :</strong> ${serviceName}</div>
              <div style="grid-column: span 2; margin-top: 4px; padding-top: 6px; border-top: 1px dashed #e2e8f0; color: #991b1b;">
                <strong>Allergies connues :</strong> ${patientAllergies}
              </div>
            </div>
          </div>

          <!-- Corps clinique rédigé -->
          <div class="medical-text-body" style="font-size: 0.9rem; line-height: 1.7; color: #1e293b; margin-bottom: 35px; background: #ffffff;">
            ${formattedBody}
          </div>

          <!-- Cadre officiel pour visas, signatures et cachets -->
          <div style="border-top: 1.5px solid #cbd5e1; padding-top: 20px; margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; page-break-inside: avoid;">
            <div style="border: 1px dashed #94a3b8; border-radius: 8px; padding: 14px; font-size: 0.8rem; color: #475569; min-height: 120px; background: #fafafa;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">Le Médecin Traitant / Praticien Hospitalier :</div>
              <div style="font-size: 0.75rem;">Fait à Libreville, le ${todayDate}</div>
              <div style="margin-top: 45px; font-style: italic; color: #94a3b8; font-size: 0.74rem; text-align: center;">(Signature & Cachet nominatif)</div>
            </div>
            <div style="border: 1px dashed #94a3b8; border-radius: 8px; padding: 14px; font-size: 0.8rem; color: #475569; min-height: 120px; background: #fafafa;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">Visa de la Direction Médicale / Chef de Service :</div>
              <div style="font-size: 0.75rem;">${chuName}</div>
              <div style="margin-top: 45px; font-style: italic; color: #94a3b8; font-size: 0.74rem; text-align: center;">(Cachet officiel de l'établissement)</div>
            </div>
          </div>

          <!-- Pied de page officiel réglementaire -->
          <div style="text-align: center; margin-top: 30px; font-size: 0.7rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            GAB-SANTE • Plateforme Numérique Nationale Inter-CHU • République Gabonaise • Document soumis au secret professionnel médical
          </div>

        </div>
      `;
    }

    const modal = document.getElementById('modal-ai-document-view');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Déclenche l'impression système (ou export PDF)
  printAiDocumentDirect() {
    window.print();
  }

  // Exporte le document affiché sous format fichier HTML complet
  exportAiDocumentHtml() {
    const content = document.getElementById('ai-document-view-content')?.innerHTML;
    if (!content) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Courrier-de-Sortie-GAB-SANTE</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 2rem; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    @media print { body { margin: 0; background: white; } .page { box-shadow: none; padding: 0.5cm; } }
  </style>
</head>
<body>
  <div class="page">${content}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Courrier-Sortie-GAB-SANTE-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Courrier de sortie exporté en HTML avec succès !');
  }

  // Copie le texte brut du document affiché
  copyCurrentAiDocumentText() {
    if (!this.currentAiDocumentText) return;
    this.copyToClipboard(this.currentAiDocumentText, '📋 Texte du document copié dans le presse-papier !');
  }

  // Copie le message d'un index particulier
  copyAiMessage(idx) {
    if (!window.AiAssistantService) return;
    const history = window.AiAssistantService.chatHistory || [];
    const msg = history[idx];
    if (!msg || !msg.content) return;
    this.copyToClipboard(msg.content, '📋 Réponse IA copiée dans le presse-papier !');
  }

  // Fonction utilitaire de copie universelle
  copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMsg);
      }).catch(() => {
        this._fallbackCopyText(text, successMsg);
      });
    } else {
      this._fallbackCopyText(text, successMsg);
    }
  }

  _fallbackCopyText(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg);
    } catch (e) {
      alert("Impossible de copier automatiquement.");
    }
    document.body.removeChild(ta);
  }

  // Imprime le dernier message IA ou courrier de sortie
  printLastAiMessage() {
    if (!window.AiAssistantService) return;
    const history = window.AiAssistantService.chatHistory || [];
    let lastIdx = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant') {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx === -1) {
      this.showToast("⚠️ Aucune réponse IA à imprimer pour le moment.");
      return;
    }
    this.openAiDocumentModal(lastIdx);
  }

  // Raccourci spécifique pour le courrier de sortie
  printLastAiDischargeSummary() {
    if (!window.AiAssistantService) return;
    const history = window.AiAssistantService.chatHistory || [];
    let dischargeIdx = -1;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant') {
        const text = (history[i].content || '').toLowerCase();
        if (text.includes('sortie') || text.includes('compte-rendu') || text.includes('crh')) {
          dischargeIdx = i;
          break;
        }
      }
    }

    if (dischargeIdx !== -1) {
      this.openAiDocumentModal(dischargeIdx);
    } else {
      // Si aucun courrier spécifique détecté, prendre la dernière réponse de l'assistant
      this.printLastAiMessage();
    }
  }
}

// Initialisation globale sur le cycle de vie du DOM
let saniApp;
window.addEventListener('DOMContentLoaded', () => {
  saniApp = new SaniGabonApp();
  window.saniApp = saniApp;
});
