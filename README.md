# ⚡ Interdevappscript — Universal Google Apps Script & AI Studio

> **Atelier de développement web universel pour Google Apps Script (V8) connecté directement à l'IA Google Gemini (Google AI Studio) avec synchronisation bidirectionnelle automatique en temps réel.**

---

## 🌟 Points Forts

* 🔒 **100% Client-Side & Confidentialité Totale** : Aucune donnée, aucun code et aucune clé secrète ne transitent par un serveur tiers. Tout est exécuté localement dans le navigateur de l'utilisateur.
* ⚡ **Éditeur Monaco (Moteur de VS Code)** : Coloration syntaxique complète pour JavaScript V8 (`.gs`), HTML et JSON, pliable, recherche (`Ctrl+F`), multi-curseurs et raccourcis clavier (`Ctrl+S`).
* 🤖 **Copilote IA Gemini 2.5 Flash** : Intégration directe avec l'API Google AI Studio (Free Tier). Préréglages spécialisés pour Google Apps Script :
  * ⚡ **Optimisation V8 & Quotas** (batching `getValues()` / `setValues()`, CacheService, PropertiesService).
  * 🛡️ **Audit Timeouts & Quotas** (détection des limites de 6 minutes et quotas Workspace).
  * 📖 **Génération JSDoc** normalisée.
  * 🔄 **Génération de déclencheurs installables** (*Triggers* horaires / journaliers).
* 🔄 **Synchronisation Google Apps Script Directe** :
  * Récupération automatique de l'arborescence complète du projet via [Google Apps Script REST API v1](https://developers.google.com/apps-script/api/reference/rest/v1/projects).
  * Sauvegarde et mise à jour instantanée du projet distant en 1 clic ou via `Ctrl+S`.
  * Support de Google Identity Services (OAuth2 popup 1-clic) ou Bearer Token manuel.
* 🪶 **Zéro Dépendance npm & Zéro Build** : Construit en pur Vanilla JS (ES Modules). Déployable instantanément sur **GitHub Pages** sans compilation.

---

## 🚀 Prise en Main Rapide

### 1. Accès en ligne
Le studio est accessible directement sans installation :
👉 **[https://geoff1805.github.io/Interdevappscript/](https://geoff1805.github.io/Interdevappscript/)**

### 2. Configuration en 3 étapes (Boîte Paramètres ⚙️)

1. **ID de votre projet Apps Script (`Script ID`)** :
   * Ouvrez votre script sur Google Apps Script (`script.google.com`).
   * Récupérez l'identifiant dans l'URL : `https://script.google.com/home/projects/<ScriptID>/edit`
2. **Connexion Google (OAuth2)** :
   * Renseignez votre **Google Cloud OAuth Client ID** (Type *Application Web*) avec l'origine autorisée `https://geoff1805.github.io` et l'API *Google Apps Script API* activée.
   * Cliquez sur **"Se connecter avec Google"**.
   * *(Alternative rapide : vous pouvez aussi coller directement un token d'accès temporaire généré via OAuth Playground ou `gcloud auth print-access-token`)*.
3. **Clé Google AI Studio (Gemini)** :
   * Obtenez votre clé API gratuite en 1 clic sur [Google AI Studio](https://aistudio.google.com/app/apikey).
   * Collez-la dans le champ Gemini API Key.

---

## 🛠️ Lancement en Local

Aucun `npm install` n'est requis. Lancez simplement un serveur HTTP statique :

```bash
# Avec Python 3
python -m http.server 3000

# Ou avec npx serve
npx serve .
```

Ouvrez ensuite `http://localhost:3000` dans votre navigateur.

---

## 📂 Structure du Projet

```text
Interdevappscript/
├── index.html            # Layout principal (Header, Sidebar, Monaco host, Tiroir IA)
├── favicon.svg           # Logo officiel vectoriel
├── css/
│   └── style.css         # Thème sombre moderne VS Code / JetBrains
├── js/
│   ├── app.js            # Orchestrateur de l'application & gestion Monaco
│   ├── auth.js           # Gestionnaire OAuth2 Google Identity Services (GIS)
│   ├── gasClient.js      # Client REST API Google Apps Script v1
│   └── aiClient.js       # Client REST Google AI Studio (Gemini)
├── .github/
│   └── dependabot.yml    # Surveillance Dependabot des GitHub Actions
├── LICENSE               # Licence MIT
└── README.md             # Documentation
```

---

## 📄 Licence

Projet distribué sous licence **MIT**. Libre de réutilisation, modification et redistribution.
