# 🇬🇦 Directives Projet GAB-SANTE pour Antigravity

Ce projet est une application web d'interconnexion hospitalière universitaire gabonaise (CHUL, CHUO, CHUMEF, CHUA, CNTS, SAMU 1300).

## Architecture Modulaire (Dossier Unique)
- Tous les modules du projet doivent demeurer directement dans le dossier racine `sani-gabon-chu`.
- Les fichiers principaux sont :
  - `index.html` : Interface principale (7 vues, modales interactives).
  - `styles.css` : Feuille de style globale et styles d'impression (`@media print`).
  - `data.js` : Référentiel des structures hospitalières, patients DMP et stocks de sang.
  - `insurances.js` : Nomenclature des régimes d'assurance maladie du Gabon (CNAMGS, CNSS, mutuelles, privées).
  - `fhir.js` : Moteur d'interopérabilité HL7 / FHIR R4.
  - `radar-map.js` : Carte radar géosanitaire SVG de l'Estuaire.
  - `pacs.js` : Console d'imagerie médicale diagnostique PACS / DICOM.
  - `cnts-requisition.js` : Bordereau officiel de réquisition de PSL du CNTS Libreville avec QR Code et traçabilité.
  - `fiche-navette.js` : Moteur de génération et d'export de la fiche navette SAMU 1300.
  - `app.js` : Contrôleur applicatif central (`SaniGabonApp`).

## Règles de Développement
- Conserver la rétrocompatibilité d'exécution directe double-clic (`file:///...`) et serveur PowerShell local.
- Préserver la nomenclature médicale gabonaise et les standards FHIR R4.
