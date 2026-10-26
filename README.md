# ⚡ Interdevappscript — Universal Google Apps Script Studio & Multi-Workbench

> **Atelier de développement web universel pour Google Apps Script (V8) connecté directement à l'IA Google Gemini (Google AI Studio) avec synchronisation bidirectionnelle automatique en temps réel.**

---

## 🌟 4 Espaces de Développement Intégrés

1. ⚡ **Apps Script Hub (Catalogue & Presets Éprouvés)** :
   * Modèles complets prêts à l'emploi et testés en conditions réelles :
     * 📧 **Gmail CleanUp Pro** (Archivage automatique & purge sélective avec respect des quotas d'exécution).
     * 📊 **Export Titres & Métadonnées Gmail vers Google Sheets** (Batching 2D `setValues()` anti-timeout).
     * ⚙️ **Gmail Rules Manager** (Audit, extraction et sauvegarde des filtres de messagerie en JSON).
     * 🌲 **Drive Scanner Enterprise** (Audit GreenIT de l'arborescence Google Drive, détection des fichiers volumineux > 50 Mo).
     * 📅 **Google Calendar & Tasks Automator** (Création d'événements en masse et alertes).
   * Prévisualisation en direct, copie en 1 clic et bouton **"Ouvrir dans l'Atelier Dev"** pour injection directe.

2. 💻 **Atelier Dev (Éditeur Monaco & Synchronisation Google Apps Script)** :
   * Éditeur Monaco (moteur de VS Code) avec coloration syntaxique V8, gestion multi-fichiers (`.gs`, `appsscript.json`, `.html`), raccourci `Ctrl+S`.
   * Synchronisation bidirectionnelle directe avec l'API Google Apps Script REST v1.
   * Sélecteur universel de projets Google Drive avec recherche instantanée.
   * Copilote IA Google Gemini (3.8 Flash, 2.5 Flash, 2.5 Pro) avec chips d'actions rapides : Optimisation V8, Audit Quotas, JSDoc, Triggers.

3. 🧪 **Tests & Diagnostic (Validation, Quotas & Simulateur)** :
   * **Bilan de Santé & Conformité V8** : Détection statique des anti-patterns (appels unitaires `getValue()` dans des boucles, dépassement de quota 6 minutes, syntaxe obsolète Rhino `var`, gestion d'erreur `try/catch`).
   * **Simulateur d'Exécution & Console de Logs** : Exécution virtuelle des fonctions du script avec sorties console horodatées et métriques de temps de réponse.
   * **Générateur Interactif de Déclencheurs (Installable Triggers)** : Génération visuelle de déclencheurs temporels (quotidiens, horaires, hebdomadaires) ou événementiels (`onEdit`, `onOpen`) avec injection automatique dans le script.

4. 🚀 **Ateliers Multi-Écosystèmes (Polyglotte)** :
   * Génération de scripts compagnons pour l'automatisation globale :
     * 🐍 **Python & Automatisation Locale**
     * 🗄️ **SQL & Base Cloudflare D1 / SQLite**
     * 📱 **Mobile & Compose Multiplatform (KMP)**
     * ✨ **Bac à sable Google AI Studio**

---

## 🔒 Confidentialité & 100% Client-Side

* **Zéro fuite de données** : Tous vos identifiants, tokens OAuth2 et clés API sont stockés exclusivement dans votre navigateur (`localStorage` / `sessionStorage`). Aucun serveur tiers n'intercepte vos échanges.
* **Zéro Dépendance npm & Zéro Build** : Construit en pur Vanilla JS ES Modules et CSS moderne. Déployé instantanément sur **GitHub Pages**.

---

## 🚀 Accès en Ligne

Le studio est accessible directement sans installation :
👉 **[https://geoff1805.github.io/Interdevappscript/](https://geoff1805.github.io/Interdevappscript/)**
