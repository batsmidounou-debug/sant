# 🇬🇦 GAB-SANTE
### Plateforme Numérique d'Interconnexion et de Régulation des Centres Hospitaliers Universitaires du Gabon

**GAB-SANTE** est une solution conçue pour fédérer et interconnecter en temps réel l'ensemble des structures hospitalières universitaires de la République Gabonaise, assurant la continuité des soins, la régulation des urgences médicales et le partage instantané des dossiers médicaux.

---

## 🏥 Structures Hospitalières Interconnectées

| Sigle | Établissement | Pôle d'Excellence Universitaire | Capacité |
| :--- | :--- | :--- | :--- |
| **CHUL** | **Centre Hospitalier Universitaire de Libreville** | Hôpital de référence polyvalent, Urgences médico-chirurgicales, Réanimation, Cardiologie, Médecine interne | 650 lits |
| **CHUO** | **Centre Hospitalier Universitaire d'Owendo** | Traumatologie lourde (AVP Route Nationale 1), Chirurgie Orthopédique & Réparatrice, Rééducation fonctionnelle | 160 lits |
| **CHUMEF** | **CHU Mère-Enfant Fondation Jeanne Ebori** | Pôle National de Périnatologie, Maternité haut risque, Réanimation néonatale, Pédiatrie spécialisée, PMA | 220 lits |
| **CHUA** | **CHU d'Angondjé (Akanda)** | Institut National d'Oncologie & Cancérologie, Radiothérapie (accélérateurs linéaires), Chimiothérapie, Sénologie | 180 lits |
| **CNTS** | **Centre National de Transfusion Sanguine** | Banque nationale de sang, traçabilité des concentrés de globules rouges (CGR) et plasma | Dépôt Central |
| **SAMU 1300** | **Service d'Aide Médicale Urgente** | Régulation territoriale des flux et coordination des ambulances SMUR | National |
| **CNAMGS** | **Caisse Nationale d'Assurance Maladie** | Vérification d'éligibilité, prise en charge et tiers-payant | National |

---

## ⚡ Fonctionnalités Clés

1. **Tableau de Bord National & Matrice des Lits en Temps Réel** :
   - Surveillance de l'occupation des lits ordinaires et des lits de réanimation/soins intensifs.
   - Carte radar interactive de l'Estuaire (Libreville, Owendo, Akanda) avec couloirs sanitaires et suivi des ambulances.
2. **DMP-Gabon : Dossier Médical Partagé Inter-CHU** :
   - Identifiant National de Santé (INS-Gabon) et numéro CNAMGS.
   - Alertes vitales : Groupe sanguin & Rhésus, terrain drépanocytaire (HbSS / HbAS), allergies médicamenteuses, comorbidités (HTA, diabète).
   - Historique clinique consolidé inter-hôpitaux (ex: accouchement à Jeanne Ebori, chirurgie au CHUO, consultation au CHUL).
3. **Module de Régulation des Transferts d'Urgence (SAMU 1300)** :
   - Fiche navette numérique de transfert avec score de gravité (P1, P2, P3).
   - Validation en direct par le chef de service du CHU receveur.
   - Suivi en temps réel de l'acheminement par ambulance médicalisée ou SMUR.
4. **Télé-Expertise & RCP (Réunions de Concertation Pluridisciplinaire)** :
   - Demande d'avis spécialisé entre praticiens des différents CHU (ex: CHUL sollicitant l'oncologue d'Angondjé ou l'orthopédiste d'Owendo).
   - Connexion au système PACS pour transmission d'imagerie médicale (radiographie, scanner, IRM).
5. **Gestion Stratégique du Sang Interconnectée (CNTS)** :
   - Vue unifiée des réserves de sang par groupe (O-, O+, A+, etc.) sur les 4 CHU et le dépôt central CNTS.
   - Déclenchement de réquisitions d'urgence en un clic.
6. **Interopérabilité Internationale HL7 / FHIR R4** :
   - Export et génération automatique de `Bundle`, `Patient`, `Coverage`, `Encounter`, `Observation` au format JSON FHIR standard.
   - Compatibilité avec DHIS2, OpenEMR et les progiciels hospitaliers existants.
7. **Couverture Maladie & Régimes d'Assurance du Gabon** :
   - **Régimes Publics Obligatoires** : CNAMGS (Fonctionnaires GE 80%, PVNR Économiquement Faibles 100%, Secteur Privé Formel SPF 80%, Indépendants TIS 80%, Étudiants) et CNSS (Accidents du Travail et Maladies Professionnelles 100%).
   - **Mutuelles Professionnelles & Ministérielles** : Éducation Nationale (MEN), Agents de Santé (MAMS), Forces Armées Gabonaises (FAG 95%), Magistrature, Gabon Telecom, Hydrocarbures & Sociétés Pétrolières (TotalEnergies, Perenco, Assala 95%).
   - **Compagnies Privées & Gestion Tiers-Payant** : ASCOMA Santé Gabon, OGAR, AXA Assurances, NSIA, Sanlam, ASSINCO, SUNU, WTW Gras Savoye, Colina, UAG.
   - **Tiers-Payant & Vérification Télématique** : Prise en charge en temps réel, calcul du ticket modérateur patient et module de télé-vérification instantanée des droits.
   - **Ressource FHIR `Coverage`** : Standardisée et intégrée à chaque export de dossier patient.

---

## 🚀 Démarrage Rapide

L'application ne nécessite aucune installation préalable et fonctionne directement sous Windows :

### Option 1 : Double-clic direct
Double-cliquez sur `lancer-application.bat` ou ouvrez directement `index.html` dans votre navigateur (Microsoft Edge, Google Chrome, etc.).

### Option 2 : Serveur local PowerShell
Ouvrez PowerShell dans le dossier et exécutez :
```powershell
.\start-server.ps1
```
L'application s'ouvrira automatiquement à l'adresse : `http://localhost:8080/`.

---

## 📁 Structure des Fichiers (Architecture Modulaire en Dossier Unique)

Tous les fichiers sont organisés et regroupés dans le dossier unique `sani-gabon-chu` pour un fonctionnement immédiat sans configuration complexe :

- `index.html` : Interface utilisateur principale (7 vues, modales interactives, responsive).
- `styles.css` : Feuille de styles intégrant la charte visuelle du Gabon, le design médical et les règles d'impression haute fidélité (`@media print`).
- `data.js` : Référentiel de données maîtresses (CHUL, CHUO, CHUMEF, CHUA, hôpitaux nationaux raccordables, patients DMP initiaux, transferts, RCP, stocks de sang CNTS).
- `insurances.js` : Nomenclature officielle complète des régimes d'assurance du Gabon (CNAMGS, CNSS, mutuelles ministérielles, compagnies privées, tiers-payant).
- `fhir.js` : Moteur d'interopérabilité internationale HL7 / FHIR R4 (génération conforme de `Bundle`, `Patient`, `Coverage`, `Encounter`, `Observation`).
- `radar-map.js` : Carte géosanitaire radar interactive SVG de l'Estuaire (Libreville, Owendo, Akanda) avec corridors d'urgence et suivi d'ambulance SMUR.
- `pacs.js` : Console d'imagerie diagnostique PACS / DICOM (visualisation des coupes scanner CT et radios du thorax/bassin, fenêtres poumon/os/tissus mous, zoom, règles de mesure).
- `cnts-requisition.js` : Moteur de génération et d'export du Bordereau Officiel de Réquisition de Produits Sanguins Labiles (PSL) du CNTS Libreville avec QR Code de traçabilité médico-légale et horodatage certifié.
- `fiche-navette.js` : Moteur d'émission de la Fiche Navette Médicale SAMU 1300 avec QR code cryptographique, impression dédiée et export HTML autonome.
- `app.js` : Contrôleur d'orchestration (`SaniGabonApp`), gestion d'état réactive, persistance `localStorage`, gestion dynamique des lits, journal d'audit, import/export de sauvegarde JSON et écouteurs d'événements.
- `start-server.ps1` : Serveur web autonome en PowerShell natif Windows (.NET HttpListener).
- `lancer-application.bat` : Lanceur rapide Windows (double-clic direct).
