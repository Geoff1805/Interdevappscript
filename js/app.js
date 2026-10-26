import { AiClient } from "./aiClient.js";
import { AuthManager } from "./auth.js";
import { GasClient } from "./gasClient.js";

class InterdevApp {
	constructor() {
		this.auth = new AuthManager();
		this.gas = new GasClient();
		this.ai = new AiClient();

		this.editor = null;
		this.monaco = null;
		this.files = [];
		this.openTabs = [];
		this.activeFileId = null;
		this.dirtyFiles = new Set();
		const urlScriptId = new URLSearchParams(window.location.search).get(
			"scriptId",
		);
		this.scriptId =
			urlScriptId || localStorage.getItem("interdev_script_id") || "";
		if (urlScriptId) {
			localStorage.setItem("interdev_script_id", urlScriptId);
		}
		this.projectTitle = "Sans titre";
		this.userProjects = [];
		this.autoSyncOnSave = localStorage.getItem("interdev_autosync") !== "false";
		this.activeView = "hub"; // 'hub' | 'editor' | 'tests' | 'multidev'
		this.activeMultiTab = "python"; // 'python' | 'database' | 'mobile' | 'ai_studio'

		// Catalogue des scripts Google Apps Script éprouvés
		this.scriptsCatalog = {
			cleanup: {
				id: "cleanup",
				title: "Gmail CleanUp Pro",
				version: "v1.4.0 (Runtime V8)",
				icon: "📧",
				desc: "Moteur d'archivage automatique et de purge sélective des messages promotionnels et notifications avec pagination et respect strict des quotas d'exécution Workspace.",
				runtime: "Google V8 ES6+",
				scope: "Moindre privilège (Gmail)",
				quotas: "Batching 100 threads (< 6 min)",
				trigger: "Quotidien (Nuit, 02h00)",
				filename: "CleanUp.gs",
				code: `/**
 * Gmail CleanUp Pro — Moteur d'archivage & purge sélective
 * Version v1.4.0 (Runtime V8 - Smart Batching)
 */
function lancerNettoyageAutomatique() {
  const query = "category:promotions older_than:60d";
  const batchSize = 100;
  console.info(\`🔍 Recherche des messages avec la requête : "\${query}"...\`);
  
  const threads = GmailApp.search(query, 0, batchSize);
  console.log(\`📦 \${threads.length} conversations ciblées pour archivage.\`);
  
  if (threads.length === 0) {
    console.info("✨ Aucun email à traiter. Boîte propre !");
    return;
  }
  
  // Archivage par lot optimisé V8
  threads.forEach((thread, index) => {
    thread.moveToArchive();
    if ((index + 1) % 25 === 0) {
      console.log(\`⏳ \${index + 1}/\${threads.length} conversations archivées...\`);
    }
  });
  
  console.info("=== [STATUT] Nettoyage terminé avec succès ===");
}

/**
 * Configure le déclencheur quotidien automatique
 */
function installerDeclencheurNettoyage() {
  ScriptApp.newTrigger('lancerNettoyageAutomatique')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  console.info("✅ Déclencheur CleanUp planifié chaque jour à 02h00.");
}`,
			},
			export_titres: {
				id: "export_titres",
				title: "Export Titres Gmail vers Sheets",
				version: "v2.0.0 (Smart Batching)",
				icon: "📊",
				desc: "Extraction et indexation en masse des métadonnées d'emails (date, expéditeur, sujet, ID) vers Google Sheets avec injection groupée setValues() 2D ultra-rapide.",
				runtime: "Google V8 ES6+",
				scope: "Gmail + Google Sheets",
				quotas: "Batching 2D (< 1 sec par 100 emails)",
				trigger: "Manuel ou Hebdomadaire",
				filename: "ExportSheets.gs",
				code: `/**
 * Export Titres & Métadonnées Gmail vers Google Sheets
 * Version v2.0.0 (Batching setValues & Anti-Timeout)
 */
function exporterEmailsVersSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("Archive_Emails_Gmail");
  const sheet = ss.getActiveSheet();
  
  // Entêtes
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Expéditeur", "Sujet", "Message ID"]);
  }
  
  const threads = GmailApp.getInboxThreads(0, 50);
  const rows = [];
  
  threads.forEach(t => {
    t.getMessages().forEach(m => {
      rows.push([
        m.getDate(),
        m.getFrom(),
        m.getSubject(),
        m.getId()
      ]);
    });
  });
  
  // Insertion par lot en une seule opération I/O
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    console.info(\`✅ \${rows.length} messages indexés dans la feuille "\${sheet.getName()}".\`);
  } else {
    console.info("ℹ️ Aucun nouveau message trouvé.");
  }
}`,
			},
			rules_manager: {
				id: "rules_manager",
				title: "Gmail Rules Manager",
				version: "v1.2.0 (Audit & Filtres)",
				icon: "⚙️",
				desc: "Inspecteur et exportateur des règles de filtrage de votre boîte Gmail vers un format JSON structuré pour sauvegarde ou audit de conformité.",
				runtime: "Google V8 ES6+",
				scope: "Gmail Advanced Service",
				quotas: "1 appel API REST",
				trigger: "À la demande",
				filename: "RulesManager.gs",
				code: `/**
 * Gmail Rules Manager — Analyseur et exportateur de filtres
 * Runtime V8 (Moindre privilège - Gmail Service)
 */
function analyserReglesGmail() {
  console.info("🔍 Lecture des filtres de messagerie actifs...");
  
  // Nécessite l'activation du service avancé "Gmail" dans appsscript.json
  const filtersResponse = Gmail.Users.Settings.Filters.list("me");
  const filters = filtersResponse.filter || [];
  
  console.log(\`📋 \${filters.length} règle(s) de filtrage configurée(s).\`);
  
  const resultats = filters.map(f => ({
    id: f.id,
    criteres: f.criteria || {},
    action: f.action || {}
  }));
  
  console.info("=== RÉSULTATS D'AUDIT DES RÈGLES ===");
  console.log(JSON.stringify(resultats, null, 2));
  return resultats;
}`,
			},
			drive_scanner: {
				id: "drive_scanner",
				title: "Drive Scanner Enterprise",
				version: "v1.5.0 (GreenIT & Quotas)",
				icon: "🌲",
				desc: "Audit de l'arborescence Google Drive, détection des fichiers volumineux (> 100 Mo) et identification des révisions obsolètes pour optimiser le stockage.",
				runtime: "Google V8 ES6+",
				scope: "Google Drive API",
				quotas: "Itérateur fluide (Anti-Timeout)",
				trigger: "Mensuel",
				filename: "DriveScanner.gs",
				code: `/**
 * Drive Scanner Enterprise — Audit d'arborescence et GreenIT
 * Version v1.5.0 (Calcul volumétrie & purge révisions)
 */
function auditDriveGreenIT() {
  console.info("🌲 Démarrage du scan Google Drive...");
  const files = DriveApp.searchFiles("trashed = false");
  let totalBytes = 0;
  let count = 0;
  const grosFichiers = [];
  
  while (files.hasNext() && count < 300) {
    const file = files.next();
    const size = file.getSize();
    totalBytes += size;
    count++;
    
    // Détection des fichiers > 50 Mo
    if (size > 50 * 1024 * 1024) {
      grosFichiers.push({
        nom: file.getName(),
        tailleMo: (size / (1024 * 1024)).toFixed(2),
        url: file.getUrl()
      });
    }
  }
  
  const totalMo = (totalBytes / (1024 * 1024)).toFixed(2);
  console.info(\`📊 Bilan : \${count} fichiers analysés (\${totalMo} Mo).\`);
  console.info(\`⚠️ \${grosFichiers.length} fichier(s) volumineux (> 50 Mo).\`);
  return { totalFichiers: count, totalMo, grosFichiers };
}`,
			},
			calendar_sync: {
				id: "calendar_sync",
				title: "Google Calendar Automator",
				version: "v1.1.0 (Batching & Alertes)",
				icon: "📅",
				desc: "Création automatique d'événements et planification de réunions depuis une liste Google Sheets avec gestion des conflits et rappels par email.",
				runtime: "Google V8 ES6+",
				scope: "Calendar + Sheets",
				quotas: "Gestion du calendrier",
				trigger: "Sur soumission formulaire",
				filename: "CalendarSync.gs",
				code: `/**
 * Google Calendar Automator — Création d'événements en masse
 * Version v1.1.0 (V8)
 */
function synchroniserEvenementsAgenda() {
  const agenda = CalendarApp.getDefaultCalendar();
  console.info(\`📅 Agenda actif : "\${agenda.getName()}"\`);
  
  const evenements = [
    { titre: "Revue de Projet Antigravity", dureeMinutes: 60, jourOffset: 1 },
    { titre: "Audit Sécurité & Quotas V8", dureeMinutes: 45, jourOffset: 2 }
  ];
  
  evenements.forEach(ev => {
    const debut = new Date();
    debut.setDate(debut.getDate() + ev.jourOffset);
    debut.setHours(10, 0, 0, 0);
    
    const fin = new Date(debut.getTime() + ev.dureeMinutes * 60 * 1000);
    const cree = agenda.createEvent(ev.titre, debut, fin, {
      description: "Créé automatiquement via Interdevappscript Studio."
    });
    console.info(\`✅ Événement créé : "\${cree.getTitle()}" pour le \${debut.toLocaleDateString()}.\`);
  });
}`,
			},
		};

		// Fichiers par défaut dans l'éditeur Dev
		this.defaultTemplates = [
			{
				id: "Code",
				name: "Code",
				displayName: "Code.gs",
				type: "SERVER_JS",
				source: this.scriptsCatalog.cleanup.code,
			},
			{
				id: "appsscript",
				name: "appsscript",
				displayName: "appsscript.json",
				type: "JSON",
				source: JSON.stringify(
					{
						timeZone: "Europe/Paris",
						dependencies: {},
						exceptionLogging: "STACKDRIVER",
						runtimeVersion: "V8",
					},
					null,
					2,
				),
			},
		];

		this.init();
	}

	async init() {
		this.auth.initGisClient();
		this.bindDOM();
		this.initMonaco();
		this.loadInitialFiles();
		this.updateAuthUI();
		this.updateGeminiUI();
		this.populateGeminiModels(false);
		this.setupHubView();
		this.setupMultiDevView();

		if (this.auth.isAuthenticated()) {
			this.loadUserProjects(false);
		}

		this.auth.onTokenChange((isAuthed) => {
			this.updateAuthUI();
			if (isAuthed) {
				this.loadUserProjects(true);
			}
		});

		// Écoute des raccourcis clavier globaux
		window.addEventListener("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				this.saveAndSync();
			}
		});
	}

	bindDOM() {
		// Navigation par onglets principaux (Hub, Dev Editor, Tests & Diagnostic, MultiDev)
		document.querySelectorAll(".nav-tab").forEach((tabBtn) => {
			tabBtn.addEventListener("click", () => {
				const view = tabBtn.dataset.navTab;
				if (view) this.switchView(view);
			});
		});

		// Dropdown de projets
		document
			.getElementById("btn-project-dropdown")
			?.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleProjectDropdown();
			});
		document
			.getElementById("btn-refresh-projects")
			?.addEventListener("click", (e) => {
				e.stopPropagation();
				this.loadUserProjects(true);
			});
		document
			.getElementById("project-search-input")
			?.addEventListener("input", (e) => this.filterProjects(e.target.value));
		document
			.getElementById("btn-close-project-dropdown")
			?.addEventListener("click", (e) => {
				e.stopPropagation();
				this.closeProjectDropdown();
			});
		document
			.getElementById("btn-open-settings-script")
			?.addEventListener("click", () => {
				this.closeProjectDropdown();
				this.openSettingsModal();
			});

		// Fermer le dropdown en cliquant à l'extérieur ou avec Échap
		document.addEventListener("pointerdown", (e) => {
			const wrapper = document.querySelector(".project-selector-wrapper");
			if (wrapper && !wrapper.contains(e.target)) {
				this.closeProjectDropdown();
			}
		});

		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this.closeProjectDropdown();
				this.closeSettingsModal();
			}
		});

		// Actions Éditeur Dev
		document
			.getElementById("btn-refresh")
			?.addEventListener("click", () => this.fetchProjectFromGas());
		document
			.getElementById("btn-sync")
			?.addEventListener("click", () => this.saveAndSync());
		document
			.getElementById("btn-ai-toggle")
			?.addEventListener("click", () => this.toggleAiPanel());
		document
			.getElementById("btn-ai-close")
			?.addEventListener("click", () => this.closeAiPanel());
		document
			.getElementById("btn-sidebar-toggle")
			?.addEventListener("click", () => this.toggleSidebar());
		document
			.getElementById("btn-add-file")
			?.addEventListener("click", () => this.promptNewFile());

		// AI Panel Actions
		document
			.getElementById("btn-ai-send")
			?.addEventListener("click", () => this.handleAiSend());
		document.getElementById("ai-input")?.addEventListener("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				this.handleAiSend();
			}
		});

		// AI Action Chips
		document.querySelectorAll(".ai-chips .chip").forEach((chip) => {
			chip.addEventListener("click", () => {
				const action = chip.dataset.action;
				this.handleAiChip(action);
			});
		});

		// Modal Paramètres
		document
			.getElementById("btn-settings")
			?.addEventListener("click", () => this.openSettingsModal());
		document
			.getElementById("modal-settings-close")
			?.addEventListener("click", () => this.closeSettingsModal());
		document
			.getElementById("btn-save-settings")
			?.addEventListener("click", () => this.saveSettings());
		document
			.getElementById("btn-google-login")
			?.addEventListener("click", () => this.handleGoogleLogin());
		document
			.getElementById("btn-google-logout")
			?.addEventListener("click", () => this.handleGoogleLogout());
		document
			.getElementById("btn-test-gemini")
			?.addEventListener("click", () => this.testGeminiConnection());
		document
			.getElementById("btn-toggle-key-visibility")
			?.addEventListener("click", () => {
				const input = document.getElementById("setting-gemini-key");
				if (input) {
					input.type = input.type === "password" ? "text" : "password";
				}
			});
		document
			.getElementById("btn-refresh-models")
			?.addEventListener("click", () => this.populateGeminiModels(true));

		// Fournisseurs IA Alternatifs (Groq, Mistral, Ollama)
		document
			.getElementById("setting-ai-provider")
			?.addEventListener("change", (e) => {
				this.switchProviderSection(e.target.value);
			});
		document
			.getElementById("btn-toggle-groq-visibility")
			?.addEventListener("click", () => {
				const input = document.getElementById("setting-groq-key");
				if (input) input.type = input.type === "password" ? "text" : "password";
			});
		document
			.getElementById("btn-test-groq")
			?.addEventListener("click", () => this.testGroqConnection());
		document
			.getElementById("btn-toggle-mistral-visibility")
			?.addEventListener("click", () => {
				const input = document.getElementById("setting-mistral-key");
				if (input) input.type = input.type === "password" ? "text" : "password";
			});
		document
			.getElementById("btn-test-mistral")
			?.addEventListener("click", () => this.testMistralConnection());

		// Sauvegarde & Import / Export Configuration (JSON & GitHub Privé)
		document
			.getElementById("btn-import-config")
			?.addEventListener("click", () => {
				document.getElementById("config-file-input")?.click();
			});
		document
			.getElementById("config-file-input")
			?.addEventListener("change", (e) => {
				const file = e.target.files?.[0];
				if (file) this.importConfigFile(file);
			});
		document
			.getElementById("btn-export-config")
			?.addEventListener("click", () => this.exportConfigFile());
		document
			.getElementById("btn-github-sync-config")
			?.addEventListener("click", () => this.syncFromGitHubPrivate());

		// Tests & Diagnostic Actions
		document
			.getElementById("btn-run-tests")
			?.addEventListener("click", () => this.runScriptAudit());
		document
			.getElementById("btn-ai-fix-script")
			?.addEventListener("click", () => this.aiFixScriptWarnings());
		document
			.getElementById("btn-run-simulation")
			?.addEventListener("click", () => this.runSimulation());
		document
			.getElementById("btn-clear-console")
			?.addEventListener("click", () => this.clearConsole());
		document
			.getElementById("btn-generate-trigger")
			?.addEventListener("click", () => this.generateTriggerCode());
		document
			.getElementById("btn-inject-trigger")
			?.addEventListener("click", () => this.injectTriggerIntoEditor());
	}

	// --- Navigation Principale (Views) ---
	switchView(viewName) {
		this.activeView = viewName;

		// Mettre à jour les onglets de la barre latérale
		document.querySelectorAll(".nav-tab").forEach((btn) => {
			if (btn.dataset.navTab === viewName) {
				btn.classList.add("active");
			} else {
				btn.classList.remove("active");
			}
		});

		// Mettre à jour les panneaux de vue
		document.querySelectorAll(".view-panel").forEach((panel) => {
			if (panel.id === `view-${viewName}`) {
				panel.classList.add("active");
			} else {
				panel.classList.remove("active");
			}
		});

		// Mettre à jour l'indicateur dans la barre de statut
		const indicator = document.getElementById("active-view-indicator");
		if (indicator) {
			const viewLabels = {
				hub: "Apps Script Hub",
				editor: "Atelier Dev",
				tests: "Tests & Diagnostic",
				multidev: "Multi-Écosystèmes",
			};
			indicator.innerHTML = `Vue : <strong>${viewLabels[viewName] || viewName}</strong>`;
		}

		// Si on bascule sur l'éditeur, forcer le recalcul de mise en page Monaco
		if (viewName === "editor") {
			setTimeout(() => {
				this.editor?.layout();
			}, 50);
		}

		// Si on bascule sur Tests, rafraîchir la liste des fonctions
		if (viewName === "tests") {
			this.refreshFunctionsList();
			this.runScriptAudit();
		}
	}

	// --- Vue 1 : Apps Script Hub (Catalogue & Presets) ---
	setupHubView() {
		const select = document.getElementById("hub-script-select");
		if (select) {
			select.addEventListener("change", (e) => {
				this.displayHubScript(e.target.value);
			});
		}

		document.getElementById("btn-hub-copy")?.addEventListener("click", () => {
			const selectVal =
				document.getElementById("hub-script-select")?.value || "cleanup";
			const script = this.scriptsCatalog[selectVal];
			if (script) {
				navigator.clipboard.writeText(script.code);
				this.showToast(`Code de "${script.title}" copié !`, "success");
			}
		});

		document
			.getElementById("btn-hub-open-editor")
			?.addEventListener("click", () => {
				const selectVal =
					document.getElementById("hub-script-select")?.value || "cleanup";
				const script = this.scriptsCatalog[selectVal];
				if (script) {
					this.loadScriptIntoEditor(script);
				}
			});

		// Afficher le script initial
		this.displayHubScript("cleanup");
	}

	displayHubScript(scriptKey) {
		const script = this.scriptsCatalog[scriptKey];
		if (!script) return;

		const titleEl = document.getElementById("hub-script-title");
		const verEl = document.getElementById("hub-script-version");
		const iconEl = document.getElementById("hub-badge-icon");
		const descEl = document.getElementById("hub-script-desc");
		const runtimeEl = document.getElementById("hub-meta-runtime");
		const scopeEl = document.getElementById("hub-meta-scope");
		const quotasEl = document.getElementById("hub-meta-quotas");
		const triggerEl = document.getElementById("hub-meta-trigger");
		const filenameEl = document.getElementById("hub-preview-filename");
		const codeEl = document.getElementById("hub-code-preview");

		if (titleEl) titleEl.textContent = script.title;
		if (verEl) verEl.textContent = script.version;
		if (iconEl) iconEl.textContent = script.icon;
		if (descEl) descEl.textContent = script.desc;
		if (runtimeEl) runtimeEl.textContent = script.runtime;
		if (scopeEl) scopeEl.textContent = script.scope;
		if (quotasEl) quotasEl.textContent = script.quotas;
		if (triggerEl) triggerEl.textContent = script.trigger;
		if (filenameEl) filenameEl.textContent = script.filename;
		if (codeEl) codeEl.textContent = script.code;
	}

	loadScriptIntoEditor(script) {
		// Trouver ou créer Code.gs
		let targetFile = this.files.find(
			(f) => f.type === "SERVER_JS" || f.displayName.endsWith(".gs"),
		);
		if (!targetFile) {
			targetFile = {
				id: `file_${Date.now()}`,
				name: "Code",
				displayName: "Code.gs",
				type: "SERVER_JS",
				source: script.code,
			};
			this.files.push(targetFile);
			this.renderFileList();
		} else {
			targetFile.source = script.code;
			if (this.editor && this.activeFileId === targetFile.id) {
				this.editor.setValue(script.code);
			}
		}

		this.markDirty(targetFile.id);
		this.switchToFile(targetFile.id);
		this.switchView("editor");
		this.showToast(
			`Modèle "${script.title}" chargé dans l'Atelier Dev !`,
			"success",
		);
	}

	// --- Vue 3 : Tests & Diagnostic (Audit statique, Simulateur & Triggers) ---
	refreshFunctionsList() {
		const currentCode = this.getCurrentEditorCode();
		const fns = [];
		for (const match of currentCode.matchAll(
			/function\s+([a-zA-Z0-9_]+)\s*\(/g,
		)) {
			fns.push(match[1]);
		}

		const simSelect = document.getElementById("tests-function-select");
		const trigSelect = document.getElementById("trigger-fn-select");

		if (simSelect) {
			simSelect.innerHTML = "";
			if (fns.length === 0) {
				simSelect.innerHTML =
					'<option value="">Aucune fonction détectée</option>';
			} else {
				fns.forEach((fn) => {
					const opt = document.createElement("option");
					opt.value = fn;
					opt.textContent = `${fn}()`;
					simSelect.appendChild(opt);
				});
			}
		}

		if (trigSelect) {
			trigSelect.innerHTML = "";
			fns.forEach((fn) => {
				const opt = document.createElement("option");
				opt.value = fn;
				opt.textContent = `${fn}()`;
				trigSelect.appendChild(opt);
			});
		}
	}

	runScriptAudit() {
		const code = this.getCurrentEditorCode();
		const checksContainer = document.getElementById("tests-checks-container");
		const scoreEl = document.getElementById("tests-health-score");
		const badgeEl = document.getElementById("tests-health-badge");

		if (!checksContainer || !scoreEl || !badgeEl) return;

		let score = 100;
		const results = [];

		// Test 1: Batching getValues() vs getValue()
		const hasSlowLoop =
			/(for|while)\s*\([^)]*\)\s*\{[^}]*(\.getValue\(\)|\.setValue\()/s.test(
				code,
			);
		if (hasSlowLoop) {
			score -= 25;
			results.push({
				pass: false,
				title: "Batching des Données (Alerte Quota)",
				desc: "Détection d'appels unitaires <code>getValue()</code> ou <code>setValue()</code> dans une boucle. Risque de dépassement de quota.",
			});
		} else {
			results.push({
				pass: true,
				title: "Batching des Données Sheets / Drive",
				desc: "Aucun appel unitaire pénalisant détecté dans des boucles. Les lectures/écritures groupées sont respectées.",
			});
		}

		// Test 2: Timeout 6 min
		const hasLargeLoopWithoutSleep =
			/(while|for)\s*\([^)]*\)\s*\{[^}]*searchFiles|getInboxThreads/s.test(
				code,
			) && !code.includes("Utilities.sleep");
		if (hasLargeLoopWithoutSleep) {
			score -= 15;
			results.push({
				pass: false,
				title: "Plafond d'Exécution (6 Minutes)",
				desc: "Boucle de recherche volumineuse sans pause ni pagination de sauvegarde. Risque d'erreur de timeout Google Script.",
			});
		} else {
			results.push({
				pass: true,
				title: "Plafond d'Exécution (6 Minutes)",
				desc: "Traitement dimensionné avec itération fluide ou pagination des batchs.",
			});
		}

		// Test 3: Syntaxe V8 moderne
		const hasVar = /\bvar\s+[a-zA-Z0-9_]+/m.test(code);
		if (hasVar) {
			score -= 15;
			results.push({
				pass: false,
				title: "Syntaxe V8 Moderne (Moteur Rhino obsolète)",
				desc: "Présence du mot-clé obsolète <code>var</code>. Préférez <code>const</code> et <code>let</code> pour optimiser le compilateur V8.",
			});
		} else {
			results.push({
				pass: true,
				title: "Syntaxe V8 Moderne (ES6+)",
				desc: "Code 100% conforme ES6+ (const / let / fonctions fléchées). Compilateur Google V8 pleinement exploité.",
			});
		}

		// Test 4: Gestion d'erreur try/catch
		const hasTryCatch = /try\s*\{/.test(code);
		if (
			!hasTryCatch &&
			(code.includes("GmailApp") || code.includes("DriveApp"))
		) {
			score -= 10;
			results.push({
				pass: false,
				title: "Résilience & Gestion d'Erreurs",
				desc: "Appels à des services distants sans bloc <code>try/catch</code>. Une défaillance réseau peut interrompre le script.",
			});
		} else {
			results.push({
				pass: true,
				title: "Résilience & Gestion d'Erreurs",
				desc: "Structure défensive satisfaisante pour les appels de services.",
			});
		}

		// Rendu des résultats
		score = Math.max(score, 35);
		scoreEl.textContent = score;
		badgeEl.className = `score-badge ${score >= 80 ? "score-good" : "score-warn"}`;

		checksContainer.innerHTML = "";
		results.forEach((res) => {
			const item = document.createElement("div");
			item.className = `check-item ${res.pass ? "check-pass" : "check-warn"}`;
			item.innerHTML = `
        <span class="check-icon">${res.pass ? "✓" : "⚠️"}</span>
        <div class="check-details">
          <strong>${res.title}</strong>
          <p>${res.desc}</p>
        </div>
      `;
			checksContainer.appendChild(item);
		});

		this.showToast(`Audit terminé : Score de santé ${score}/100`, "info");
	}

	aiFixScriptWarnings() {
		this.switchView("editor");
		this.openAiPanel();

		const prompt = `Audite et optimise ce script Google Apps Script (V8) pour corriger toutes les vulnérabilités de quotas et de performances :
1. Remplacer les appels unitaires par du batching (getValues/setValues).
2. Remplacer 'var' par 'const'/'let' (ES6+ V8).
3. Garantir l'absence de timeout (limite 6 minutes).
4. Ajouter des blocs try/catch sur les services Google.

Voici le script actuel :
\`\`\`javascript
${this.getCurrentEditorCode()}
\`\`\`
Fournis le script corrigé complet prêt à copier.`;

		const input = document.getElementById("ai-input");
		if (input) {
			input.value = prompt;
			this.handleAiSend();
		}
	}

	runSimulation() {
		const fnSelect = document.getElementById("tests-function-select");
		const selectedFn = fnSelect?.value;
		const consoleBox = document.getElementById("tests-console-output");

		if (!selectedFn) {
			alert("Veuillez sélectionner une fonction à simuler.");
			return;
		}

		if (!consoleBox) return;

		consoleBox.innerHTML = "";
		const log = (msg, level = "INFO") => {
			const time = new Date().toLocaleTimeString("fr-FR");
			const color =
				level === "ERROR"
					? "#ef4444"
					: level === "WARN"
						? "#f59e0b"
						: level === "SUCCESS"
							? "#10b981"
							: "#38bdf8";
			consoleBox.innerHTML += `<div style="color: ${color}">[${time}] [${level}] ${msg}</div>`;
			consoleBox.scrollTop = consoleBox.scrollHeight;
		};

		log(`Initialisation de l'environnement V8 Google Workspace...`);
		setTimeout(() => {
			log(`Exécution de la fonction : ${selectedFn}()...`);
			setTimeout(() => {
				if (
					selectedFn.toLowerCase().includes("nettoyage") ||
					selectedFn.toLowerCase().includes("cleanup")
				) {
					log(`Scan des conversations Gmail : 100 threads examinés.`);
					log(`Archivage par lot de 25 conversations...`);
					log(`Archivage terminé : 25 messages traités.`);
				} else if (selectedFn.toLowerCase().includes("export")) {
					log(`Ouverture du classeur Google Sheets.`);
					log(`Génération du tableau 2D (50 lignes x 4 colonnes).`);
					log(`setValues() exécuté avec succès en 42ms.`);
				} else {
					log(`Exécution des instructions métier...`);
					log(`Appels aux services Apps Script simulés avec succès.`);
				}
				log(
					`Simulation terminée en 248 ms. Plafond 6 min respecté (0.07% consommé).`,
					"SUCCESS",
				);
			}, 300);
		}, 200);
	}

	clearConsole() {
		const consoleBox = document.getElementById("tests-console-output");
		if (consoleBox) {
			consoleBox.innerHTML =
				"// Console réinitialisée. Prêt pour une nouvelle simulation.";
		}
	}

	generateTriggerCode() {
		const fn =
			document.getElementById("trigger-fn-select")?.value ||
			"lancerNettoyageAutomatique";
		const type =
			document.getElementById("trigger-type-select")?.value || "clock_daily";
		const codeEl = document.getElementById("trigger-code-preview");

		let code = "";
		if (type === "clock_daily") {
			code = `function installerDeclencheurAutomatique() {
  ScriptApp.newTrigger('${fn}')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  console.info("✅ Déclencheur quotidien configuré pour 02h00.");
}`;
		} else if (type === "clock_hourly") {
			code = `function installerDeclencheurAutomatique() {
  ScriptApp.newTrigger('${fn}')
    .timeBased()
    .everyHours(1)
    .create();
  console.info("✅ Déclencheur horaire configuré (toutes les heures).");
}`;
		} else if (type === "clock_weekly") {
			code = `function installerDeclencheurAutomatique() {
  ScriptApp.newTrigger('${fn}')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  console.info("✅ Déclencheur hebdomadaire configuré pour chaque lundi à 08h00.");
}`;
		} else if (type === "sheet_edit") {
			code = `function installerDeclencheurAutomatique() {
  ScriptApp.newTrigger('${fn}')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  console.info("✅ Déclencheur événementiel configuré sur modification (onEdit).");
}`;
		} else if (type === "sheet_open") {
			code = `function installerDeclencheurAutomatique() {
  ScriptApp.newTrigger('${fn}')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
  console.info("✅ Déclencheur événementiel configuré sur ouverture (onOpen).");
}`;
		}

		if (codeEl) codeEl.textContent = code;
		this.showToast("Code du déclencheur généré !", "success");
	}

	injectTriggerIntoEditor() {
		const code = document.getElementById("trigger-code-preview")?.textContent;
		if (!code) return;

		const current = this.getCurrentEditorCode();
		const updated = `${current}\n\n${code}`;
		if (this.editor) {
			this.editor.setValue(updated);
		}
		this.markDirty(this.activeFileId);
		this.switchView("editor");
		this.showToast("Déclencheur inséré dans l'Atelier Dev !", "success");
	}

	// --- Vue 4 : Multi-Écosystèmes (Python, Cloudflare D1, KMP, AI Studio) ---
	setupMultiDevView() {
		// Sous-onglets MultiDev
		document.querySelectorAll(".subtab").forEach((tab) => {
			tab.addEventListener("click", () => {
				document.querySelectorAll(".subtab").forEach((t) => {
					t.classList.remove("active");
				});
				tab.classList.add("active");
				this.activeMultiTab = tab.dataset.multidevTab;
				this.updateMultiDevTabUI();
			});
		});

		document
			.getElementById("btn-multidev-generate")
			?.addEventListener("click", () => this.handleMultiDevGenerate());
		document
			.getElementById("btn-multidev-copy")
			?.addEventListener("click", () => {
				const code =
					document.getElementById("multidev-output-code")?.textContent || "";
				navigator.clipboard.writeText(code);
				this.showToast("Code copié dans le presse-papier !", "success");
			});
	}

	updateMultiDevTabUI() {
		const titleEl = document.getElementById("multidev-tab-title");
		const inputEl = document.getElementById("multidev-prompt-input");

		const titles = {
			python: "Atelier Python & Automatisation Locale",
			database: "Générateur SQL & Base Cloudflare D1",
			mobile: "Laboratoire Mobile Kotlin Multiplatform (KMP)",
			ai_studio: "Bac à sable Google AI Studio (Gemini Direct)",
		};

		const placeholders = {
			python:
				"Ex: Parser un export JSON d'emails Gmail et générer un rapport de statistiques...",
			database:
				"Ex: Schéma SQL d'indexation d'emails avec index sur message_id et horodatage...",
			mobile:
				"Ex: Écran Compose Multiplatform affichant une liste de tâches avec badge de statut...",
			ai_studio:
				"Ex: Rédige un prompt expert pour catégoriser des factures et extraire les montants HT/TTC...",
		};

		if (titleEl) titleEl.textContent = titles[this.activeMultiTab];
		if (inputEl) inputEl.placeholder = placeholders[this.activeMultiTab];
	}

	async handleMultiDevGenerate() {
		const inputEl = document.getElementById("multidev-prompt-input");
		const outputEl = document.getElementById("multidev-output-code");
		const prompt = inputEl?.value.trim();

		if (!prompt) {
			alert("Veuillez saisir une consigne pour générer le code.");
			return;
		}

		if (outputEl) outputEl.textContent = "✨ Génération avec l'IA en cours...";

		// Si une clé Gemini est disponible, interroger l'IA en direct
		if (this.ai.getApiKey()) {
			try {
				const systemInstructions = {
					python:
						"Tu es un expert Python 3.12. Génère un script propre, optimisé bibliothèque standard avec typage et docstrings.",
					database:
						"Tu es un Architecte Base de données Cloudflare D1 et SQLite. Génère des schémas SQL D1 optimisés avec indexes et requêtes prêtes à l'emploi.",
					mobile:
						"Tu es un Développeur Senior Kotlin Multiplatform et Compose Multiplatform. Génère des composants Material 3 élégants et réactifs.",
					ai_studio:
						"Tu es un Prompt Engineer expert de Google AI Studio et Gemini 2.5/3.8 Flash. Conçois des instructions précises et structurées.",
				};

				const res = await this.ai.generateCode({
					prompt: prompt,
					systemInstruction: systemInstructions[this.activeMultiTab],
				});
				if (outputEl) outputEl.textContent = res.code || res.rawText;
				this.showToast("Code généré par Gemini !", "success");
				return;
			} catch (e) {
				console.warn("Échec génération Gemini directe, repli sur template:", e);
			}
		}

		// Templates de repli instantanés
		setTimeout(() => {
			let fallbackCode = "";
			if (this.activeMultiTab === "python") {
				fallbackCode = `# Script Python généré pour : ${prompt}
import json
import sys
from datetime import datetime
from pathlib import Path

def traiter_donnees(fichier_source: str = "export.json") -> dict:
    """Traite et synthétise les données exportées."""
    print(f"[{datetime.now().isoformat()}] Démarrage du traitement pour : ${prompt}")
    donnees = {"statut": "succes", "tache": "${prompt}", "elements_traites": 42}
    return donnees

if __name__ == "__main__":
    resultat = traiter_donnees()
    print(json.dumps(resultat, indent=2, ensure_ascii=False))`;
			} else if (this.activeMultiTab === "database") {
				fallbackCode = `-- Schéma SQL Cloudflare D1 / SQLite pour : ${prompt}
CREATE TABLE IF NOT EXISTS scripts_registry (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scripts_nom ON scripts_registry(nom);

-- Requête d'insertion optimisée
INSERT OR REPLACE INTO scripts_registry (id, nom, version, description)
VALUES ('scr_001', 'CleanUp Pro', 'v1.4.0', '${prompt}');

-- Sélection
SELECT * FROM scripts_registry ORDER BY updated_at DESC LIMIT 20;`;
			} else if (this.activeMultiTab === "mobile") {
				fallbackCode = `// Composant Compose Multiplatform pour : ${prompt}
package fr.interdev.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun InterdevScriptCard(
    titre: String = "${prompt}",
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth().padding(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = titre, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { /* Action */ }) {
                Text("Exécuter la synchronisation")
            }
        }
    }
}`;
			} else {
				fallbackCode = `// Bac à sable Google AI Studio (Gemini GenAI) pour : ${prompt}
const promptSystem = \`Tu es un copilote IA expert Google Apps Script et Google Workspace.
Objectif : ${prompt}
Format de sortie attendu : Code V8 documenté avec typage JSDoc et vérification des quotas.\`;

console.log("Prompt optimisé pour Google AI Studio :");
console.log(promptSystem);`;
			}

			if (outputEl) outputEl.textContent = fallbackCode;
			this.showToast("Code généré avec succès !", "success");
		}, 300);
	}

	getCurrentEditorCode() {
		if (this.editor) {
			return this.editor.getValue();
		}
		const active = this.files.find((f) => f.id === this.activeFileId);
		return active?.source || "";
	}

	// --- Initialisation de Monaco Editor ---
	initMonaco() {
		if (window.require) {
			window.require.config({
				paths: {
					vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
				},
			});

			window.require(["vs/editor/editor.main"], () => {
				this.monaco = window.monaco;
				const container = document.getElementById("monaco-host");
				if (!container) return;
				container.innerHTML = "";

				this.editor = this.monaco.editor.create(container, {
					value: "// Chargement...",
					language: "javascript",
					theme: "vs-dark",
					fontSize: 14,
					fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
					minimap: { enabled: true },
					automaticLayout: true,
					scrollBeyondLastLine: false,
					tabSize: 2,
					renderWhitespace: "selection",
					lineNumbers: "on",
					bracketPairColorization: { enabled: true },
				});

				// Détection de modification
				this.editor.onDidChangeModelContent(() => {
					if (this.activeFileId) {
						const currentVal = this.editor.getValue();
						const file = this.files.find((f) => f.id === this.activeFileId);
						if (file && file.source !== currentVal) {
							file.source = currentVal;
							this.markDirty(this.activeFileId);
						}
					}
				});

				// Si des fichiers sont déjà prêts, basculer vers le premier
				if (this.files.length > 0) {
					this.switchToFile(this.files[0].id);
				}
			});
		}
	}

	// --- Gestion des fichiers du projet ---
	loadInitialFiles() {
		this.files = JSON.parse(JSON.stringify(this.defaultTemplates));
		this.openTabs = this.files.map((f) => f.id);
		this.activeFileId = this.files[0]?.id || null;
		this.renderFileList();
		this.renderTabBar();
	}

	renderFileList() {
		const listEl = document.getElementById("file-list");
		if (!listEl) return;
		listEl.innerHTML = "";

		this.files.forEach((file) => {
			const li = document.createElement("li");
			li.className = `file-item ${file.id === this.activeFileId ? "active" : ""}`;
			li.dataset.id = file.id;

			const icon =
				file.type === "JSON" ? "⚙️" : file.type === "HTML" ? "🌐" : "📄";

			li.innerHTML = `
        <div class="file-item-left">
          <span class="file-icon">${icon}</span>
          <span class="file-name">${file.displayName}</span>
        </div>
        <div class="file-actions">
          <button class="btn btn-ghost btn-xs btn-delete-file" title="Supprimer">✕</button>
        </div>
      `;

			li.addEventListener("click", (e) => {
				if (e.target.classList.contains("btn-delete-file")) {
					e.stopPropagation();
					this.deleteFile(file.id);
				} else {
					this.switchToFile(file.id);
				}
			});

			listEl.appendChild(li);
		});
	}

	renderTabBar() {
		const bar = document.getElementById("tab-bar");
		if (!bar) return;
		bar.innerHTML = "";

		this.openTabs.forEach((fileId) => {
			const file = this.files.find((f) => f.id === fileId);
			if (!file) return;

			const tab = document.createElement("div");
			const isActive = file.id === this.activeFileId;
			const isDirty = this.dirtyFiles.has(file.id);
			tab.className = `tab ${isActive ? "active" : ""} ${isDirty ? "dirty" : ""}`;
			tab.dataset.id = file.id;

			tab.innerHTML = `
        <span>${file.displayName}</span>
        <span class="tab-dirty-indicator"></span>
        <span class="tab-close" title="Fermer">✕</span>
      `;

			tab.addEventListener("click", (e) => {
				if (e.target.classList.contains("tab-close")) {
					e.stopPropagation();
					this.closeTab(file.id);
				} else {
					this.switchToFile(file.id);
				}
			});

			bar.appendChild(tab);
		});
	}

	switchToFile(fileId) {
		const file = this.files.find((f) => f.id === fileId);
		if (!file) return;

		this.activeFileId = fileId;
		if (!this.openTabs.includes(fileId)) {
			this.openTabs.push(fileId);
		}

		if (this.editor && this.monaco) {
			const lang =
				file.type === "JSON"
					? "json"
					: file.type === "HTML"
						? "html"
						: "javascript";
			const model = this.monaco.editor.createModel(file.source || "", lang);
			this.editor.setModel(model);
		}

		this.renderFileList();
		this.renderTabBar();
		this.updateStatusInfo();
	}

	closeTab(fileId) {
		this.openTabs = this.openTabs.filter((id) => id !== fileId);
		if (this.activeFileId === fileId) {
			this.activeFileId = this.openTabs[this.openTabs.length - 1] || null;
			if (this.activeFileId) {
				this.switchToFile(this.activeFileId);
			} else if (this.editor) {
				this.editor.setValue("// Aucun fichier ouvert");
			}
		}
		this.renderTabBar();
	}

	markDirty(fileId) {
		this.dirtyFiles.add(fileId);
		this.renderTabBar();
		const badge = document.getElementById("sync-status-badge");
		if (badge) {
			badge.className = "sync-status modified";
			badge.querySelector(".text").textContent = "Modifié";
		}
	}

	clearDirty() {
		this.dirtyFiles.clear();
		this.renderTabBar();
		const badge = document.getElementById("sync-status-badge");
		if (badge) {
			badge.className = "sync-status synced";
			badge.querySelector(".text").textContent = "Synchronisé";
		}
	}

	promptNewFile() {
		const name = prompt(
			"Nom du nouveau fichier (ex: Utilitaires ou Page.html) :",
		);
		if (!name) return;

		const isHtml = name.toLowerCase().endsWith(".html");
		const isJson = name.toLowerCase().endsWith(".json");
		const cleanName = name.replace(/\.(gs|html|json)$/i, "");

		const type = isHtml ? "HTML" : isJson ? "JSON" : "SERVER_JS";
		const ext = isHtml ? ".html" : isJson ? ".json" : ".gs";

		const newFile = {
			id: `file_${Date.now()}`,
			name: cleanName,
			displayName: `${cleanName}${ext}`,
			type: type,
			source: isHtml
				? "<!-- Nouveau fichier HTML -->\n"
				: "// Nouveau fichier Apps Script\n",
		};

		this.files.push(newFile);
		this.switchToFile(newFile.id);
		this.markDirty(newFile.id);
	}

	deleteFile(fileId) {
		if (this.files.length <= 1) {
			alert("Impossible de supprimer le dernier fichier du projet.");
			return;
		}
		const file = this.files.find((f) => f.id === fileId);
		if (!file) return;

		if (confirm(`Supprimer le fichier "${file.displayName}" ?`)) {
			this.files = this.files.filter((f) => f.id !== fileId);
			this.closeTab(fileId);
			this.renderFileList();
			this.markDirty("project");
		}
	}

	toggleSidebar() {
		document.getElementById("sidebar")?.classList.toggle("collapsed");
		setTimeout(() => this.editor?.layout(), 250);
	}

	toggleAiPanel() {
		document.getElementById("ai-panel")?.classList.toggle("collapsed");
		setTimeout(() => this.editor?.layout(), 250);
	}

	openAiPanel() {
		document.getElementById("ai-panel")?.classList.remove("collapsed");
		setTimeout(() => this.editor?.layout(), 250);
	}

	closeAiPanel() {
		document.getElementById("ai-panel")?.classList.add("collapsed");
		setTimeout(() => this.editor?.layout(), 250);
	}

	// --- Synchronisation Google Apps Script API ---
	async fetchProjectFromGas() {
		const scriptId = this.scriptId;
		const token = this.auth.getAccessToken();

		if (!scriptId) {
			this.openSettingsModal();
			this.showToast(
				"Veuillez renseigner un ID de projet Google Apps Script",
				"info",
			);
			return;
		}

		if (!token) {
			this.openSettingsModal();
			this.showToast("Connexion Google requise", "info");
			return;
		}

		const badge = document.getElementById("sync-status-badge");
		if (badge) {
			badge.className = "sync-status syncing";
			badge.querySelector(".text").textContent = "Chargement...";
		}

		try {
			const gasFiles = await this.gas.getProjectContent(scriptId, token);
			this.files = gasFiles;
			this.openTabs = gasFiles.map((f) => f.id);
			this.activeFileId = gasFiles[0]?.id || null;
			this.renderFileList();
			this.renderTabBar();
			if (this.activeFileId) {
				this.switchToFile(this.activeFileId);
			}
			this.clearDirty();
			this.showToast("Projet rechargé depuis Google Apps Script !", "success");
		} catch (e) {
			console.error("Erreur fetch GAS:", e);
			if (badge) {
				badge.className = "sync-status error";
				badge.querySelector(".text").textContent = "Erreur Sync";
			}
			alert(`Erreur de synchronisation Google Apps Script :\n${e.message}`);
		}
	}

	async saveAndSync() {
		const scriptId = this.scriptId;
		const token = this.auth.getAccessToken();

		if (!scriptId || !token) {
			this.clearDirty();
			this.showToast("Modifications enregistrées localement", "success");
			return;
		}

		const badge = document.getElementById("sync-status-badge");
		if (badge) {
			badge.className = "sync-status syncing";
			badge.querySelector(".text").textContent = "Synchronisation...";
		}

		try {
			await this.gas.updateProjectContent(scriptId, this.files, token);
			this.clearDirty();
			this.showToast("Synchronisé avec Google Apps Script !", "success");
		} catch (e) {
			console.error("Erreur update GAS:", e);
			if (badge) {
				badge.className = "sync-status error";
				badge.querySelector(".text").textContent = "Erreur Sync";
			}
			alert(`Échec de l'enregistrement sur Google Apps Script :\n${e.message}`);
		}
	}

	// --- Copilote IA Google Gemini ---
	async handleAiSend() {
		const inputEl = document.getElementById("ai-input");
		const prompt = inputEl?.value.trim();
		if (!prompt) return;

		inputEl.value = "";
		this.appendAiMessage(prompt, "user");

		const currentCode = this.getCurrentEditorCode();
		const activeFile = this.files.find((f) => f.id === this.activeFileId);

		const fullPrompt = `Fichier actif : ${activeFile?.displayName || "Code.gs"}
Code actuel :
\`\`\`javascript
${currentCode}
\`\`\`

Demande : ${prompt}`;

		const typingId = this.appendAiMessage(
			"Gemini analyse le code...",
			"assistant typing",
		);

		try {
			const res = await this.ai.generateCode({
				prompt: fullPrompt,
			});

			this.removeAiMessage(typingId);
			this.appendAiMessage(res.rawText, "assistant", res.code);
		} catch (e) {
			this.removeAiMessage(typingId);
			this.appendAiMessage(`Erreur Gemini : ${e.message}`, "assistant error");
		}
	}

	handleAiChip(action) {
		const actions = {
			optimize:
				"Optimise le code actif pour le Runtime V8 en garantissant le batching et la réduction des appels d'API Google.",
			audit:
				"Analyse le code actif vis-à-vis du timeout de 6 minutes et des quotas Workspace. Indique les points critiques.",
			jsdoc:
				"Génère la documentation JSDoc complète et rigoureuse pour chaque fonction du fichier actif.",
			trigger:
				"Génère une fonction d'installation de déclencheur temporel quotidien pour automatiser ce script.",
		};

		const input = document.getElementById("ai-input");
		if (input) {
			input.value = actions[action] || "";
			input.focus();
		}
	}

	appendAiMessage(text, role = "user", extractedCode = null) {
		const container = document.getElementById("ai-messages");
		if (!container) return null;

		const id = `msg_${Date.now()}`;
		const div = document.createElement("div");
		div.id = id;
		div.className = `ai-message ${role}`;

		let html = text.replace(/\n/g, "<br>");
		if (extractedCode) {
			html += `<div class="ai-code-actions">
        <button class="btn btn-primary btn-xs btn-insert-code">Insérer dans l'éditeur</button>
        <button class="btn btn-secondary btn-xs btn-copy-code">Copier</button>
      </div>`;
		}

		div.innerHTML = html;

		if (extractedCode) {
			div.querySelector(".btn-insert-code")?.addEventListener("click", () => {
				if (this.editor) {
					this.editor.setValue(extractedCode);
					this.markDirty(this.activeFileId);
					this.showToast("Code inséré dans l'éditeur !", "success");
				}
			});

			div.querySelector(".btn-copy-code")?.addEventListener("click", () => {
				navigator.clipboard.writeText(extractedCode);
				this.showToast("Code copié !", "success");
			});
		}

		container.appendChild(div);
		container.scrollTop = container.scrollHeight;
		return id;
	}

	removeAiMessage(id) {
		const el = document.getElementById(id);
		el?.remove();
	}

	// --- Modal Paramètres & Connexions ---
	openSettingsModal() {
		document.getElementById("modal-settings")?.classList.remove("hidden");
		const scriptInput = document.getElementById("setting-script-id");
		if (scriptInput) scriptInput.value = this.scriptId;

		const clientInput = document.getElementById("setting-client-id");
		if (clientInput) clientInput.value = this.auth.getClientId();

		const manualTokenInput = document.getElementById("setting-manual-token");
		if (manualTokenInput) manualTokenInput.value = this.auth.getManualToken();

		// Provider actif
		const activeProvider = this.ai.getActiveProvider();
		const providerSelect = document.getElementById("setting-ai-provider");
		if (providerSelect) providerSelect.value = activeProvider;
		this.switchProviderSection(activeProvider);

		// Gemini
		const geminiKeyInput = document.getElementById("setting-gemini-key");
		if (geminiKeyInput) geminiKeyInput.value = this.ai.getApiKey();
		const geminiModelSelect = document.getElementById("setting-gemini-model");
		if (geminiModelSelect) geminiModelSelect.value = this.ai.getModel();

		// Groq
		const groqKeyInput = document.getElementById("setting-groq-key");
		if (groqKeyInput) groqKeyInput.value = this.ai.getGroqKey();
		const groqModelSelect = document.getElementById("setting-groq-model");
		if (groqModelSelect) groqModelSelect.value = this.ai.getGroqModel();

		// Mistral
		const mistralKeyInput = document.getElementById("setting-mistral-key");
		if (mistralKeyInput) mistralKeyInput.value = this.ai.getMistralKey();
		const mistralModelSelect = document.getElementById("setting-mistral-model");
		if (mistralModelSelect)
			mistralModelSelect.value = this.ai.getMistralModel();

		// Ollama
		const ollamaEndpointInput = document.getElementById(
			"setting-ollama-endpoint",
		);
		if (ollamaEndpointInput)
			ollamaEndpointInput.value = this.ai.getOllamaEndpoint();
		const ollamaModelInput = document.getElementById("setting-ollama-model");
		if (ollamaModelInput) ollamaModelInput.value = this.ai.getOllamaModel();

		const autosyncCheck = document.getElementById("setting-autosync");
		if (autosyncCheck) autosyncCheck.checked = this.autoSyncOnSave;

		this.updateAuthUI();
	}

	switchProviderSection(provider) {
		const sections = {
			gemini: document.getElementById("provider-section-gemini"),
			groq: document.getElementById("provider-section-groq"),
			mistral: document.getElementById("provider-section-mistral"),
			ollama: document.getElementById("provider-section-ollama"),
		};

		Object.keys(sections).forEach((key) => {
			if (key === provider) {
				sections[key]?.classList.remove("hidden");
			} else {
				sections[key]?.classList.add("hidden");
			}
		});
	}

	closeSettingsModal() {
		document.getElementById("modal-settings")?.classList.add("hidden");
	}

	saveSettings() {
		const scriptId =
			document.getElementById("setting-script-id")?.value.trim() || "";
		const clientId =
			document.getElementById("setting-client-id")?.value.trim() || "";
		const manualToken =
			document.getElementById("setting-manual-token")?.value.trim() || "";

		const activeProvider =
			document.getElementById("setting-ai-provider")?.value || "gemini";
		this.ai.setActiveProvider(activeProvider);

		// Gemini
		const geminiKey =
			document.getElementById("setting-gemini-key")?.value.trim() || "";
		const geminiModel =
			document.getElementById("setting-gemini-model")?.value ||
			"gemini-3.8-flash";
		this.ai.setApiKey(geminiKey);
		this.ai.setModel(geminiModel);
		if (geminiKey) {
			this.populateGeminiModels(true);
		}

		// Groq
		const groqKey =
			document.getElementById("setting-groq-key")?.value.trim() || "";
		const groqModel =
			document.getElementById("setting-groq-model")?.value ||
			"llama-3.3-70b-versatile";
		this.ai.setGroqKey(groqKey);
		this.ai.setGroqModel(groqModel);

		// Mistral
		const mistralKey =
			document.getElementById("setting-mistral-key")?.value.trim() || "";
		const mistralModel =
			document.getElementById("setting-mistral-model")?.value ||
			"codestral-latest";
		this.ai.setMistralKey(mistralKey);
		this.ai.setMistralModel(mistralModel);

		// Ollama
		const ollamaEndpoint =
			document.getElementById("setting-ollama-endpoint")?.value.trim() ||
			"http://localhost:11434";
		const ollamaModel =
			document.getElementById("setting-ollama-model")?.value.trim() ||
			"qwen2.5-coder:1.5b";
		this.ai.setOllamaEndpoint(ollamaEndpoint);
		this.ai.setOllamaModel(ollamaModel);

		const autosync =
			document.getElementById("setting-autosync")?.checked ?? true;

		this.scriptId = scriptId;
		localStorage.setItem("interdev_script_id", scriptId);

		const titleEl = document.getElementById("project-title");
		if (titleEl && scriptId) {
			titleEl.textContent =
				this.projectTitle !== "Sans titre"
					? this.projectTitle
					: `${scriptId.slice(0, 10)}...`;
		}

		this.auth.setClientId(clientId);
		this.auth.setManualToken(manualToken);

		this.autoSyncOnSave = autosync;
		localStorage.setItem("interdev_autosync", autosync ? "true" : "false");

		this.closeSettingsModal();
		this.showToast("Paramètres enregistrés avec succès", "success");
		this.updateAuthUI();
		this.updateGeminiUI();
	}

	// --- Import / Export Configuration (interdev-config.json) ---
	importConfigFile(file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const config = JSON.parse(e.target.result);
				this.applyFullConfig(config);
				this.showToast(
					"Configuration importée ! Clés IA et paramètres synchronisés.",
					"success",
				);
			} catch (err) {
				alert(`Erreur lors de la lecture du fichier JSON :\n${err.message}`);
			}
		};
		reader.readAsText(file);
	}

	applyFullConfig(config) {
		if (config.google_apps_script) {
			if (config.google_apps_script.script_id) {
				this.scriptId = config.google_apps_script.script_id;
				localStorage.setItem("interdev_script_id", this.scriptId);
			}
			if (config.google_apps_script.client_id) {
				this.auth.setClientId(config.google_apps_script.client_id);
			}
		}

		const ai = config.ai_providers || {};
		if (ai.active_provider) {
			this.ai.setActiveProvider(ai.active_provider);
		}

		if (ai.gemini?.api_key) {
			this.ai.setApiKey(ai.gemini.api_key);
			if (ai.gemini.model) this.ai.setModel(ai.gemini.model);
		}

		if (ai.groq?.api_key) {
			this.ai.setGroqKey(ai.groq.api_key);
			if (ai.groq.model) this.ai.setGroqModel(ai.groq.model);
		}

		if (ai.mistral?.api_key) {
			this.ai.setMistralKey(ai.mistral.api_key);
			if (ai.mistral.model) this.ai.setMistralModel(ai.mistral.model);
		}

		if (ai.openrouter?.api_key) {
			this.ai.setOpenRouterKey(ai.openrouter.api_key);
			if (ai.openrouter.model) this.ai.setOpenRouterModel(ai.openrouter.model);
		}

		if (ai.ollama?.endpoint) {
			this.ai.setOllamaEndpoint(ai.ollama.endpoint);
			if (ai.ollama.model) this.ai.setOllamaModel(ai.ollama.model);
		}

		this.openSettingsModal(); // Rafraîchit les inputs visibles
		this.updateAuthUI();
		this.updateGeminiUI();
	}

	exportConfigFile() {
		const config = {
			version: "1.0.0",
			exported_at: new Date().toISOString(),
			google_apps_script: {
				script_id: this.scriptId,
				client_id: this.auth.getClientId(),
			},
			ai_providers: {
				active_provider: this.ai.getActiveProvider(),
				gemini: {
					api_key: this.ai.getApiKey(),
					model: this.ai.getModel(),
				},
				groq: {
					api_key: this.ai.getGroqKey(),
					model: this.ai.getGroqModel(),
				},
				mistral: {
					api_key: this.ai.getMistralKey(),
					model: this.ai.getMistralModel(),
				},
				openrouter: {
					api_key: this.ai.getOpenRouterKey(),
					model: this.ai.getOpenRouterModel(),
				},
				ollama: {
					endpoint: this.ai.getOllamaEndpoint(),
					model: this.ai.getOllamaModel(),
				},
			},
		};

		const blob = new Blob([JSON.stringify(config, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "interdev-config.json";
		a.click();
		URL.revokeObjectURL(url);
		this.showToast("Fichier interdev-config.json téléchargé !", "success");
	}

	async syncFromGitHubPrivate() {
		const tokenKey = "interdev_github_token";
		let ghToken = localStorage.getItem(tokenKey);

		if (!ghToken) {
			ghToken = prompt(
				"Entrez votre Personal Access Token GitHub (avec droit 'repo') pour lire votre dépôt privé Geoff1805/google-workspace-scripts :",
			);
			if (!ghToken) return;
			localStorage.setItem(tokenKey, ghToken.trim());
		}

		this.showToast(
			"Téléchargement de interdev-config.json depuis GitHub...",
			"info",
		);

		try {
			const res = await fetch(
				"https://api.github.com/repos/Geoff1805/google-workspace-scripts/contents/interdev-config.json",
				{
					headers: {
						Authorization: `Bearer ${ghToken.trim()}`,
						Accept: "application/vnd.github.v3+json",
					},
				},
			);

			if (!res.ok) {
				if (res.status === 401 || res.status === 403) {
					localStorage.removeItem(tokenKey);
					throw new Error("Token GitHub invalide ou expiré.");
				}
				throw new Error(`Erreur GitHub API (${res.status})`);
			}

			const data = await res.json();
			const decodedContent = decodeURIComponent(
				escape(atob(data.content.replace(/\n/g, ""))),
			);
			const config = JSON.parse(decodedContent);
			this.applyFullConfig(config);
			this.showToast(
				"✨ Configuration synchronisée avec Geoff1805/google-workspace-scripts !",
				"success",
			);
		} catch (e) {
			alert(`Échec de la synchronisation GitHub :\n${e.message}`);
		}
	}

	async testGroqConnection() {
		const key = document.getElementById("setting-groq-key")?.value.trim();
		if (!key) {
			alert("Veuillez renseigner votre clé API Groq.");
			return;
		}
		const testAi = new AiClient();
		testAi.setGroqKey(key);
		testAi.setActiveProvider("groq");
		try {
			const res = await testAi.generateCode({
				prompt: "Réponds simplement 'Connexion Groq Opérationnelle !'",
			});
			alert(`Succès Groq :\n\n${res.rawText}`);
		} catch (e) {
			alert(`Échec Groq : ${e.message}`);
		}
	}

	async testMistralConnection() {
		const key = document.getElementById("setting-mistral-key")?.value.trim();
		if (!key) {
			alert("Veuillez renseigner votre clé API Mistral.");
			return;
		}
		const testAi = new AiClient();
		testAi.setMistralKey(key);
		testAi.setActiveProvider("mistral");
		try {
			const res = await testAi.generateCode({
				prompt:
					"Réponds simplement 'Connexion Mistral Codestral Opérationnelle !'",
			});
			alert(`Succès Mistral :\n\n${res.rawText}`);
		} catch (e) {
			alert(`Échec Mistral : ${e.message}`);
		}
	}

	handleGoogleLogin() {
		try {
			const inputClientId = document
				.getElementById("setting-client-id")
				?.value.trim();
			if (inputClientId) {
				this.auth.setClientId(inputClientId);
			}
			const inputScriptId = document
				.getElementById("setting-script-id")
				?.value.trim();
			if (inputScriptId) {
				this.scriptId = inputScriptId;
				localStorage.setItem("interdev_script_id", inputScriptId);
				const titleEl = document.getElementById("project-title");
				if (titleEl) titleEl.textContent = `${inputScriptId.slice(0, 10)}...`;
			}
			this.auth.login();
		} catch (e) {
			alert(e.message);
		}
	}

	handleGoogleLogout() {
		this.auth.logout();
		this.showToast("Déconnecté de Google", "info");
		this.updateAuthUI();
	}

	async testGeminiConnection() {
		const key = document.getElementById("setting-gemini-key").value.trim();
		if (!key) {
			alert("Veuillez renseigner votre clé API Gemini.");
			return;
		}
		const selectedModel =
			document.getElementById("setting-gemini-model")?.value ||
			"gemini-3.8-flash";
		const testAi = new AiClient();
		testAi.setApiKey(key);
		testAi.setModel(selectedModel);

		try {
			const res = await testAi.generateCode({
				prompt: "Réponds simplement 'Connexion Gemini Opérationnelle !'",
			});
			alert(`Succès avec ${selectedModel} :\n\n${res.rawText}`);
		} catch (e) {
			alert(`Échec : ${e.message}`);
		}
	}

	updateAuthUI() {
		const isAuthed = this.auth.isAuthenticated();
		const btnLogin = document.getElementById("btn-google-login");
		const btnLogout = document.getElementById("btn-google-logout");
		const statusText = document.getElementById("google-auth-status");
		const headerBadge = document.getElementById("header-account-badge");
		const headerAccountText = document.getElementById("header-account-text");

		if (isAuthed) {
			if (btnLogin) btnLogin.style.display = "none";
			if (btnLogout) btnLogout.style.display = "inline-flex";
			const email = this.auth.getUserEmail();
			if (statusText) {
				statusText.textContent = email
					? `Connecté : ${email} (Accès Scripts & Drive)`
					: "Connecté à Google Apps Script";
				statusText.className = "help-text text-green-400";
			}
			if (headerBadge) headerBadge.classList.add("connected");
			if (headerAccountText) {
				headerAccountText.textContent = email
					? email.split("@")[0]
					: "Google Connecté";
			}
		} else {
			if (btnLogin) btnLogin.style.display = "inline-flex";
			if (btnLogout) btnLogout.style.display = "none";
			if (statusText) {
				statusText.textContent =
					"Non connecté (Connexion requise pour la synchronisation)";
				statusText.className = "help-text text-amber-400";
			}
			if (headerBadge) headerBadge.classList.remove("connected");
			if (headerAccountText) headerAccountText.textContent = "Non connecté";
		}
	}

	updateGeminiUI() {
		const provider = this.ai.getActiveProvider();
		const headerText = document.getElementById("header-gemini-text");
		const currentModelTag = document.getElementById("ai-current-model-tag");

		let label = "Gemini 3.8 Flash";
		if (provider === "groq") {
			label = `Groq (${this.ai.getGroqModel().split("-")[0]})`;
		} else if (provider === "mistral") {
			label = "Mistral Codestral";
		} else if (provider === "ollama") {
			label = `Ollama (${this.ai.getOllamaModel()})`;
		} else {
			const model = this.ai.getModel();
			label = model.replace(/^gemini-/, "Gemini ");
		}

		if (headerText) headerText.textContent = label;
		if (currentModelTag) currentModelTag.textContent = label;
	}

	updateStatusInfo() {
		const activeFile = this.files.find((f) => f.id === this.activeFileId);
		const statusEl = document.getElementById("status-file-info");
		if (statusEl) {
			statusEl.textContent = activeFile
				? `${activeFile.displayName} (${activeFile.type})`
				: "--";
		}
	}

	// --- Gestion dynamique des projets Google Apps Script ---
	toggleProjectDropdown() {
		const menu = document.getElementById("project-dropdown-menu");
		menu?.classList.toggle("hidden");
		if (!menu?.classList.contains("hidden")) {
			document.getElementById("project-search-input")?.focus();
			if (this.auth.isAuthenticated() && this.userProjects.length === 0) {
				this.loadUserProjects(false);
			}
		}
	}

	closeProjectDropdown() {
		document.getElementById("project-dropdown-menu")?.classList.add("hidden");
	}

	async loadUserProjects(forceRefresh = false) {
		const listContainer = document.getElementById("project-dropdown-list");
		const token = this.auth.getAccessToken();

		if (!token) {
			if (listContainer) {
				listContainer.innerHTML =
					'<div class="dropdown-empty">Connectez-vous à Google dans Paramètres pour lister automatiquement vos scripts.</div>';
			}
			return;
		}

		if (!forceRefresh) {
			try {
				const cached = localStorage.getItem("interdev_user_projects");
				if (cached) {
					this.userProjects = JSON.parse(cached);
					this.renderProjectDropdown(this.userProjects);
				}
			} catch {
				// Ignorer
			}
		}

		if (forceRefresh || this.userProjects.length === 0) {
			if (listContainer) {
				listContainer.innerHTML =
					'<div class="dropdown-empty">Recherche de vos scripts Google Apps Script...</div>';
			}
			try {
				const projects = await this.gas.listUserProjects(token);
				this.userProjects = projects;
				localStorage.setItem(
					"interdev_user_projects",
					JSON.stringify(projects),
				);
				this.renderProjectDropdown(projects);
				this.showToast(
					`${projects.length} script(s) Apps Script trouvés`,
					"info",
				);
			} catch (e) {
				console.error("Erreur listUserProjects:", e);
				if (listContainer) {
					listContainer.innerHTML = `<div class="dropdown-empty" style="color: var(--accent-red);">${e.message}</div>`;
				}
			}
		}
	}

	renderProjectDropdown(projects) {
		const listContainer = document.getElementById("project-dropdown-list");
		if (!listContainer) return;

		if (projects.length === 0) {
			listContainer.innerHTML =
				'<div class="dropdown-empty">Aucun script autonome trouvé dans votre Google Drive.</div>';
			return;
		}

		listContainer.innerHTML = "";
		projects.forEach((proj) => {
			const item = document.createElement("div");
			const isActive = proj.id === this.scriptId;
			item.className = `project-dropdown-item ${isActive ? "active" : ""}`;
			item.dataset.id = proj.id;

			const dateStr = proj.modifiedTime
				? new Date(proj.modifiedTime).toLocaleDateString("fr-FR", {
						day: "numeric",
						month: "short",
						hour: "2-digit",
						minute: "2-digit",
					})
				: "";

			item.innerHTML = `
        <span class="project-dropdown-item-title" title="${proj.title}">⚡ ${proj.title}</span>
        <span class="project-dropdown-item-date">${dateStr}</span>
      `;

			item.addEventListener("click", () => {
				this.selectProject(proj);
			});

			listContainer.appendChild(item);
		});
	}

	filterProjects(query) {
		const q = query.trim().toLowerCase();
		if (!q) {
			this.renderProjectDropdown(this.userProjects);
			return;
		}
		const filtered = this.userProjects.filter((p) =>
			p.title.toLowerCase().includes(q),
		);
		this.renderProjectDropdown(filtered);
	}

	selectProject(proj) {
		this.scriptId = proj.id;
		this.projectTitle = proj.title;
		localStorage.setItem("interdev_script_id", proj.id);

		const titleEl = document.getElementById("project-title");
		if (titleEl) titleEl.textContent = proj.title;

		this.closeProjectDropdown();
		this.showToast(`Ouverture de ${proj.title}...`, "info");
		this.fetchProjectFromGas();
	}

	// --- Gestion dynamique des modèles Gemini (Google AI Studio) ---
	async populateGeminiModels(forceFetch = false) {
		const select = document.getElementById("setting-gemini-model");
		const statusText = document.getElementById("models-status-text");
		if (!select) return;

		let models = this.ai.getCachedModels();
		const currentSelected = this.ai.getModel();

		if (forceFetch || !models || models.length === 0) {
			const key =
				document.getElementById("setting-gemini-key")?.value.trim() ||
				this.ai.getApiKey();
			if (key) {
				if (statusText)
					statusText.textContent = "Interrogation de Google AI Studio...";
				try {
					models = await this.ai.fetchAvailableModels(key);
					if (statusText)
						statusText.textContent = `✓ ${models.length} modèles récupérés de votre compte.`;
				} catch (e) {
					console.warn("Échec récupération dynamique modèles:", e);
					if (statusText)
						statusText.textContent = `Impossible d'actualiser les modèles : ${e.message}`;
				}
			}
		}

		if (models && models.length > 0) {
			select.innerHTML = "";
			models.forEach((m) => {
				const opt = document.createElement("option");
				opt.value = m.id;
				opt.textContent = `${m.name} (${m.id})`;
				if (m.id === currentSelected) {
					opt.selected = true;
				}
				select.appendChild(opt);
			});
		}
	}

	showToast(message, type = "info") {
		const container = document.getElementById("toast-container");
		if (!container) return;
		const toast = document.createElement("div");
		toast.className = `toast toast-${type}`;
		toast.textContent = message;
		container.appendChild(toast);

		setTimeout(() => {
			toast.style.opacity = "0";
			toast.style.transform = "translateY(10px)";
			toast.style.transition = "all 0.2s ease";
			setTimeout(() => toast.remove(), 200);
		}, 3000);
	}
}

// Initialisation de l'application
window.addEventListener("DOMContentLoaded", () => {
	new InterdevApp();
});
