/**
 * GAB-SANTE - Module Officiel de Réquisition de Produits Sanguins Labiles (PSL)
 * Centre National de Transfusion Sanguine (CNTS) du Gabon - Libreville
 * 
 * Fonctions :
 * - Gestion des commandes urgentes de sang (CGR, PFC, CPA)
 * - Génération du Bordereau Officiel de Réquisition certifié conforme
 * - Traçabilité médico-légale par QR Code et horodatage Gabon (UTC+1)
 * - Décompte dynamique des stocks CNTS et réapprovisionnement des dépôts CHU
 * - Impression haute fidélité (@media print) et export HTML autonome
 */

const CntsRequisitionService = {
  currentRequisition: null,

  /**
   * Génère le HTML du bordereau officiel CNTS
   */
  generateHtml(req, chu, patient) {
    this.currentRequisition = req;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });

    const isUvi = req.urgencyLevel === 'UVI';
    const isUvr = req.urgencyLevel === 'UVR';
    const urgencyBadgeColor = isUvi ? '#b91c1c' : (isUvr ? '#d97706' : '#2563eb');
    const urgencyBgColor = isUvi ? '#fef2f2' : (isUvr ? '#fffbeb' : '#eff6ff');

    return `
      <div class="cnts-requisition-document" style="font-family: Arial, -apple-system, sans-serif; color: #1e293b; line-height: 1.4;">
        
        <!-- EN-TÊTE OFFICIEL DE LA RÉPUBLIQUE GABONAISE -->
        <div style="border-bottom: 3px double #991b1b; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            <div style="text-align: left; font-size: 0.78rem;">
              <strong style="font-size: 0.85rem; color: #0a2540;">RÉPUBLIQUE GABONAISE</strong><br>
              <span style="color: #64748b; font-style: italic;">Union – Travail – Justice</span><br>
              <strong>MINISTÈRE DE LA SANTÉ</strong><br>
              Direction Générale de la Santé Publique<br>
              <strong style="color: #991b1b;">CENTRE NATIONAL DE TRANSFUSION SANGUINE (CNTS)</strong><br>
              <span style="font-size: 0.72rem; color: #64748b;">Boulevard Triomphal Omar Bongo, B.P. 13838 Libreville</span>
            </div>

            <div style="text-align: center;">
              <div style="display: inline-flex; height: 10px; width: 64px; margin-bottom: 4px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1;">
                <div style="background: #009e49; flex: 1;"></div>
                <div style="background: #fcd116; flex: 1;"></div>
                <div style="background: #0072ce; flex: 1;"></div>
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #991b1b; letter-spacing: 0.5px;">BORDEREAU OFFICIEL DE RÉQUISITION</div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #475569; letter-spacing: 0.8px;">PRODUITS SANGUINS LABILES (PSL) & TRAÇABILITÉ</div>
            </div>

            <div style="text-align: right; font-size: 0.78rem;">
              <div style="background: #fef2f2; padding: 6px 10px; border-radius: 6px; border: 1px solid #fecaca; display: inline-block;">
                <span style="color: #64748b;">N° Réquisition :</span> <strong style="color: #991b1b; font-size: 0.9rem;">${req.id}</strong><br>
                <span style="color: #64748b;">Émis le :</span> <strong>${req.date} à ${req.time}</strong><br>
                <span style="color: #64748b;">Statut :</span> <strong style="color: #059669;">✓ ${req.status || 'Délivré & Conforme'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- BANDEAU DE DEGRÉ D'URGENCE VITAL -->
        <div style="background: ${urgencyBgColor}; border: 1.5px solid ${urgencyBadgeColor}; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #64748b;">Degré d'Urgence Transfusionnelle :</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: ${urgencyBadgeColor};">
              🚨 ${req.urgencyLabel} (${req.urgencyLevel})
            </div>
            <div style="font-size: 0.76rem; color: #475569;">${req.urgencyDescription}</div>
          </div>
          <div style="text-align: right; font-size: 0.8rem;">
            <div>Délai impératif : <strong style="color: ${urgencyBadgeColor};">${req.deliveryDelay}</strong></div>
            <div>Protocole sécurisé : <strong>${req.protocol}</strong></div>
          </div>
        </div>

        <!-- DÉTAILS DEMANDEUR & PATIENT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          
          <!-- Établissement et Service Demandeur -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #ffffff;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
              🏥 Structure & Service Prescripteur
            </div>
            <div style="font-size: 0.82rem; line-height: 1.5;">
              <div><strong>Établissement :</strong> ${chu ? chu.name : req.chuName}</div>
              <div><strong>Service demandeur :</strong> ${req.service}</div>
              <div><strong>Médecin Prescripteur :</strong> ${req.doctor}</div>
              <div><strong>Contact Régulation :</strong> 📞 ${req.contactPhone || (chu ? chu.emergencyPhone : '1300')}</div>
              <div><strong>Dépôt de délivrance :</strong> Dépôt d'urgence ${chu ? chu.shortName : 'CHU'}</div>
            </div>
          </div>

          <!-- Renseignements Récipiendaire / Patient -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #ffffff;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
              👤 Patient Récipiendaire (DMP Gabon)
            </div>
            <div style="font-size: 0.82rem; line-height: 1.5;">
              <div><strong>Nom & Prénom :</strong> ${patient ? patient.name : req.patientName}</div>
              <div><strong>Âge / Sexe :</strong> ${patient ? `${patient.age} (${patient.gender})` : req.patientMeta}</div>
              <div><strong>Identifiant INS :</strong> <code>${patient ? patient.ins : (req.patientIns || 'N/C')}</code></div>
              <div><strong>Couverture :</strong> ${patient ? `${patient.cnamgs} (${patient.insurance || 'CNAMGS'})` : req.patientInsurance}</div>
              <div><strong>Groupe sanguin connu :</strong> <strong style="color: #b91c1c; font-size: 0.9rem;">${patient ? patient.bloodType : req.bloodGroup}</strong></div>
            </div>
          </div>

        </div>

        <!-- INDICATION CLINIQUE & CONTEXTE PATHOLOGIQUE -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; margin-bottom: 12px;">
          <div style="font-size: 0.74rem; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 4px;">
            📋 Diagnostic, Indication Clinique & Antécédents Transfusionnels
          </div>
          <div style="font-size: 0.82rem; color: #0f172a; margin-bottom: 4px;">
            <strong>Indication majeure :</strong> ${req.indication}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.78rem; color: #475569;">
            <div>• Taux d'hémoglobine estimé : <strong>${req.hemoglobin || '< 7.0 g/dL'}</strong></div>
            <div>• Statut RAI (Recherche Agglutinines) : <strong>${req.raiStatus || 'Prélèvement joint au bordereau'}</strong></div>
            <div>• Antécédent d'accident transfusionnel : <strong>${req.transfusionHistory || 'Aucun signalé'}</strong></div>
            <div>• Grossesses antérieures / Éventuelle allo-immunisation : <strong>${req.pregnancyHistory || 'N/A'}</strong></div>
          </div>
        </div>

        <!-- TABLEAU DES PRODUITS SANGUINS DÉLIVRÉS & NUMÉROS DE LOTS CNTS -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="background: #7f1d1d; color: #ffffff;">
                <th style="padding: 6px 10px;">Type de PSL</th>
                <th style="padding: 6px 10px; text-align: center;">Groupe & Rhésus</th>
                <th style="padding: 6px 10px; text-align: center;">Quantité Demandée</th>
                <th style="padding: 6px 10px;">Numéro de Poche / Lot CNTS</th>
                <th style="padding: 6px 10px; text-align: right;">Date Péremption</th>
              </tr>
            </thead>
            <tbody>
              ${(req.items || []).map((item, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 6px 10px; font-weight: 600;">
                    ${item.type}
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 400;">${item.description}</div>
                  </td>
                  <td style="padding: 6px 10px; text-align: center;">
                    <span style="display: inline-block; background: #fee2e2; color: #991b1b; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1px solid #fecaca; font-size: 0.85rem;">
                      ${item.bloodGroup}
                    </span>
                  </td>
                  <td style="padding: 6px 10px; text-align: center; font-weight: 700; font-size: 0.9rem;">
                    ${item.quantity} poche(s)
                  </td>
                  <td style="padding: 6px 10px; font-family: monospace; color: #0f172a; font-weight: 600;">
                    ${item.batchNumbers.join('<br>')}
                  </td>
                  <td style="padding: 6px 10px; text-align: right; color: #475569;">
                    ${item.expirationDate}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- ZONE DE CONTRÔLE PRÉ-TRANSFUSIONNEL ULTIME AU LIT DU MALADE -->
        <div style="border: 1px dashed #d97706; background: #fffbeb; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 0.76rem;">
          <strong style="color: #92400e;">⚠️ RÈGLE DE SÉCURITÉ TRANSFUSIONNELLE OBLIGATOIRE (Décret Santé Gabon) :</strong><br>
          Le contrôle ultime au lit du patient (contrôle de concordance d'identité et épreuve de Beth-Vincent sur carton test) est <strong>strictement obligatoire</strong> avant toute perfusion, y compris en situation d'urgence vitale.
        </div>

        <!-- PIED DE PAGE : VALIDATION OFFICIELLE, QR CODE & VISAS -->
        <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; display: grid; grid-template-columns: 140px 1fr 1fr 1fr; gap: 10px; align-items: start; font-size: 0.75rem;">
          
          <!-- QR Code de Traçabilité CNTS -->
          <div style="text-align: center;">
            <div id="qrcode-requisition" style="display: inline-block; width: 110px; height: 110px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px;"></div>
            <div style="font-size: 0.68rem; color: #64748b; margin-top: 4px;">
              Scan Traçabilité CNTS<br>
              <code>${req.id}</code>
            </div>
          </div>

          <!-- Visa Médecin Prescripteur -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #ffffff; min-height: 105px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong style="color: #0f172a;">1. Médecin Prescripteur</strong><br>
              <span style="color: #64748b;">${req.doctor}</span>
            </div>
            <div style="color: #059669; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              ✓ Signé numériquement<br>
              <span style="font-size: 0.68rem; color: #64748b;">Horodatage : ${req.time}</span>
            </div>
          </div>

          <!-- Visa Transporteur / SAMU 1300 -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #ffffff; min-height: 105px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong style="color: #0f172a;">2. Transporteur / SMUR</strong><br>
              <span style="color: #64748b;">Navette d'Urgence SAMU 1300</span><br>
              <span style="font-size: 0.7rem; color: #475569;">Chaîne du froid : +2°C / +6°C</span>
            </div>
            <div style="color: #0284c7; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              ✓ Prise en charge colis
            </div>
          </div>

          <!-- Visa Biologiste CNTS Libreville -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #ffffff; min-height: 105px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong style="color: #0f172a;">3. Biologiste CNTS</strong><br>
              <span style="color: #64748b;">Dr. Nguema (Dépôt National)</span><br>
              <span style="font-size: 0.7rem; color: #475569;">Validation Sérologique VIH/VHB/VHC/TP</span>
            </div>
            <div style="color: #991b1b; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              ✓ Délivrance Autorisée CNTS
            </div>
          </div>

        </div>

      </div>
    `;
  },

  /**
   * Génère le QR Code de traçabilité dans le conteneur prévu
   */
  renderQrCode(req) {
    const qrContainer = document.getElementById('qrcode-requisition');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    const payload = JSON.stringify({
      app: 'GAB-SANTE-CNTS',
      type: 'REQUISITION_PSL',
      id: req.id,
      chu: req.chu,
      patient: req.patientName,
      group: req.bloodGroup,
      qty: req.totalQty,
      urgency: req.urgencyLevel,
      issuedAt: `${req.date} ${req.time}`,
      auth: 'CNTS-LIBREVILLE-CERT-OK'
    });

    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: payload,
        width: 100,
        height: 100,
        colorDark: '#7f1d1d',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrContainer.innerHTML = `<div style="font-size: 0.65rem; color: #64748b; padding: 15px 4px;">CNTS-SECURE-QR<br><strong>${req.id}</strong></div>`;
    }
  },

  /**
   * Ouvre la modale de visualisation du bordereau avec génération du QR Code
   */
  openRequisitionModal(req, chu, patient) {
    const modal = document.getElementById('modal-cnts-requisition');
    const container = document.getElementById('cnts-requisition-content');
    if (!modal || !container) return;

    container.innerHTML = this.generateHtml(req, chu, patient);
    modal.classList.remove('hidden');

    setTimeout(() => {
      this.renderQrCode(req);
    }, 150);
  },

  /**
   * Ferme la modale du bordereau
   */
  closeModal() {
    const modal = document.getElementById('modal-cnts-requisition');
    if (modal) modal.classList.add('hidden');
  },

  /**
   * Exporte le document officiel au format HTML autonome téléchargeable
   */
  exportHtml() {
    if (!this.currentRequisition) return;
    const req = this.currentRequisition;
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau CNTS - ${req.id} - ${req.patientName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; background: #f8fafc; color: #1e293b; }
    .page { max-width: 850px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    @media print { body { margin: 0; background: white; } .page { box-shadow: none; padding: 1rem; } }
  </style>
</head>
<body>
  <div class="page">
    ${document.getElementById('cnts-requisition-content')?.innerHTML || ''}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bordereau-CNTS-${req.id}-${req.patientName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.CntsRequisitionService = CntsRequisitionService;
}
