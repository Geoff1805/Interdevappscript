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
		this.scriptId = localStorage.getItem("interdev_script_id") || "";
		this.projectTitle = "Sans titre";
		this.userProjects = [];
		this.autoSyncOnSave = localStorage.getItem("interdev_autosync") !== "false";

		// Templates par défaut
		this.defaultTemplates = [
			{
				id: "Code",
				name: "Code",
				displayName: "Code.gs",
				type: "SERVER_JS",
				source: `/**
 * Gmail CleanUp Pro — Moteur d'archivage & purge sélective
 * Version v1.4.0 (Runtime V8)
 */
function lancerNettoyageAutomatique() {
  const query = "category:promotions older_than:60d";
  const threads = GmailApp.search(query, 0, 100);
  console.log(\`📦 \${threads.length} conversations ciblées pour archivage.\`);
  
  threads.forEach(t => t.moveToArchive());
  console.info("=== [STATUT] Nettoyage terminé avec succès ===");
}`,
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
		this.bindDOM();
		this.initMonaco();
		this.loadInitialFiles();
		this.updateAuthUI();
		this.populateGeminiModels(false);

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
			.getElementById("btn-open-settings-script")
			?.addEventListener("click", () => {
				this.closeProjectDropdown();
				this.openSettingsModal();
			});

		// Fermer le dropdown en cliquant à l'extérieur
		document.addEventListener("click", (e) => {
			const wrapper = document.querySelector(".project-selector-wrapper");
			if (wrapper && !wrapper.contains(e.target)) {
				this.closeProjectDropdown();
			}
		});

		// Boutons Header
		document
			.getElementById("btn-sync")
			.addEventListener("click", () => this.saveAndSync());
		document
			.getElementById("btn-refresh")
			.addEventListener("click", () => this.fetchProjectFromGas());
		document
			.getElementById("btn-settings")
			.addEventListener("click", () => this.openSettingsModal());
		document
			.getElementById("btn-ai-toggle")
			.addEventListener("click", () => this.toggleAiPanel());
		document
			.getElementById("btn-sidebar-toggle")
			.addEventListener("click", () => this.toggleSidebar());

		// Sidebar actions
		document
			.getElementById("btn-add-file")
			.addEventListener("click", () => this.promptNewFile());

		// AI actions
		document
			.getElementById("btn-ai-send")
			.addEventListener("click", () => this.sendAiPrompt());
		document.getElementById("ai-input").addEventListener("keydown", (e) => {
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				this.sendAiPrompt();
			}
		});

		document.querySelectorAll(".chip").forEach((chip) => {
			chip.addEventListener("click", (e) => {
				const action = e.target.dataset.action;
				this.runAiQuickAction(action);
			});
		});

		// Paramètres Modal
		document
			.getElementById("modal-settings-close")
			.addEventListener("click", () => this.closeSettingsModal());
		document
			.getElementById("btn-save-settings")
			.addEventListener("click", () => this.saveSettings());
		document
			.getElementById("btn-google-login")
			.addEventListener("click", () => this.handleGoogleLogin());
		document
			.getElementById("btn-google-logout")
			.addEventListener("click", () => this.handleGoogleLogout());
		document
			.getElementById("btn-test-gemini")
			.addEventListener("click", () => this.testGeminiConnection());
		document
			.getElementById("btn-refresh-models")
			?.addEventListener("click", () => this.populateGeminiModels(true));
	}

	initMonaco() {
		// Chargement de Monaco via le loader AMD officiel
		if (window.require) {
			window.require.config({
				paths: {
					vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
				},
			});

			window.require(["vs/editor/editor.main"], () => {
				this.monaco = window.monaco;
				const container = document.getElementById("monaco-host");
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
					if (!this.activeFileId) return;
					const currentFile = this.files.find(
						(f) => f.id === this.activeFileId,
					);
					if (currentFile) {
						const newSource = this.editor.getValue();
						if (newSource !== currentFile.source) {
							currentFile.source = newSource;
							this.markFileDirty(this.activeFileId);
						}
					}
				});

				// Raccourci Ctrl+S dans Monaco
				this.editor.addCommand(
					this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
					() => {
						this.saveAndSync();
					},
				);

				if (this.files.length > 0) {
					this.openFile(this.files[0].id);
				}
			});
		}
	}

	loadInitialFiles() {
		this.files = [...this.defaultTemplates];
		this.openTabs = this.files.map((f) => f.id);
		this.renderSidebar();
		this.renderTabs();
		if (this.files.length > 0) {
			this.activeFileId = this.files[0].id;
		}
	}

	renderSidebar() {
		const list = document.getElementById("file-list");
		list.innerHTML = "";

		this.files.forEach((file) => {
			const li = document.createElement("li");
			li.className = `file-item ${file.id === this.activeFileId ? "active" : ""}`;
			li.dataset.fileId = file.id;

			let icon = "📄";
			if (file.displayName.endsWith(".gs")) icon = "⚡";
			if (file.displayName.endsWith(".html")) icon = "🌐";
			if (file.displayName.endsWith(".json")) icon = "⚙️";

			const isDirty = this.dirtyFiles.has(file.id);

			li.innerHTML = `
        <div class="file-item-left">
          <span class="file-icon">${icon}</span>
          <span class="file-name" title="${file.displayName}">${file.displayName}</span>
        </div>
        <div class="file-item-right">
          ${isDirty ? '<span class="unsaved-dot" title="Modifié non sauvegardé"></span>' : ""}
          ${file.id !== "appsscript" ? `<button class="btn btn-ghost btn-sm btn-delete-file" data-id="${file.id}" title="Supprimer">×</button>` : ""}
        </div>
      `;

			li.addEventListener("click", (e) => {
				if (e.target.classList.contains("btn-delete-file")) {
					e.stopPropagation();
					this.deleteFile(file.id);
				} else {
					this.openFile(file.id);
				}
			});

			list.appendChild(li);
		});
	}

	renderTabs() {
		const bar = document.getElementById("tab-bar");
		bar.innerHTML = "";

		this.openTabs.forEach((fileId) => {
			const file = this.files.find((f) => f.id === fileId);
			if (!file) return;

			const tab = document.createElement("div");
			tab.className = `tab ${file.id === this.activeFileId ? "active" : ""}`;
			tab.dataset.fileId = file.id;

			const isDirty = this.dirtyFiles.has(file.id);

			tab.innerHTML = `
        <span>${file.displayName}</span>
        ${isDirty ? '<span class="unsaved-dot"></span>' : ""}
        <span class="tab-close" data-id="${file.id}">×</span>
      `;

			tab.addEventListener("click", (e) => {
				if (e.target.classList.contains("tab-close")) {
					e.stopPropagation();
					this.closeTab(file.id);
				} else {
					this.openFile(file.id);
				}
			});

			bar.appendChild(tab);
		});
	}

	openFile(fileId) {
		const file = this.files.find((f) => f.id === fileId);
		if (!file) return;

		this.activeFileId = fileId;
		if (!this.openTabs.includes(fileId)) {
			this.openTabs.push(fileId);
		}

		if (this.editor && this.monaco) {
			let lang = "javascript";
			if (file.displayName.endsWith(".html")) lang = "html";
			if (file.displayName.endsWith(".json")) lang = "json";

			const model = this.monaco.editor.createModel(file.source, lang);
			this.editor.setModel(model);
		}

		this.renderSidebar();
		this.renderTabs();
		this.updateStatusInfo();
	}

	closeTab(fileId) {
		this.openTabs = this.openTabs.filter((id) => id !== fileId);
		if (this.activeFileId === fileId) {
			this.activeFileId =
				this.openTabs.length > 0
					? this.openTabs[this.openTabs.length - 1]
					: null;
			if (this.activeFileId) {
				this.openFile(this.activeFileId);
			} else if (this.editor) {
				this.editor.setValue("// Aucun fichier ouvert");
			}
		}
		this.renderTabs();
		this.renderSidebar();
	}

	markFileDirty(fileId) {
		this.dirtyFiles.add(fileId);
		this.updateSyncBadge("modified");
		this.renderTabs();
		this.renderSidebar();
	}

	clearDirty() {
		this.dirtyFiles.clear();
		this.updateSyncBadge("synced");
		this.renderTabs();
		this.renderSidebar();
	}

	updateSyncBadge(status) {
		const badge = document.getElementById("sync-status-badge");
		badge.className = `sync-status ${status}`;
		const textSpan = badge.querySelector(".text");

		if (status === "synced") {
			textSpan.textContent = `Synchronisé (${new Date().toLocaleTimeString()})`;
		} else if (status === "modified") {
			textSpan.textContent = `${this.dirtyFiles.size} fichier(s) modifié(s)`;
		} else if (status === "syncing") {
			textSpan.textContent = "Synchronisation en cours...";
		} else if (status === "error") {
			textSpan.textContent = "Erreur de synchro";
		}
	}

	promptNewFile() {
		const fileName = prompt(
			"Nom du nouveau fichier (ex: Utils.gs, Interface.html) :",
		);
		if (!fileName) return;

		const trimmed = fileName.trim();
		let type = "SERVER_JS";
		if (trimmed.endsWith(".html")) type = "HTML";
		if (trimmed.endsWith(".json")) type = "JSON";

		const baseName = trimmed.replace(/\.(gs|html|json)$/, "");

		const newFile = {
			id: baseName,
			name: baseName,
			displayName:
				trimmed.endsWith(".gs") ||
				trimmed.endsWith(".html") ||
				trimmed.endsWith(".json")
					? trimmed
					: `${trimmed}.gs`,
			type: type,
			source:
				type === "HTML"
					? '<!DOCTYPE html>\n<html>\n  <head><base target="_top"></head>\n  <body>\n    <h3>Nouvelle Interface</h3>\n  </body>\n</html>'
					: `// ${trimmed}\nfunction initialiser() {\n  \n}`,
		};

		this.files.push(newFile);
		this.markFileDirty(newFile.id);
		this.openFile(newFile.id);
		this.showToast(`Fichier ${newFile.displayName} créé`, "success");
	}

	deleteFile(fileId) {
		if (!confirm(`Confirmer la suppression de ${fileId} ?`)) return;
		this.files = this.files.filter((f) => f.id !== fileId);
		this.dirtyFiles.delete(fileId);
		this.closeTab(fileId);
		this.markFileDirty("deleted");
		this.showToast(`Fichier supprimé`, "info");
	}

	/**
	 * Récupère le code distant depuis Google Apps Script
	 */
	async fetchProjectFromGas() {
		const scriptId = this.scriptId;
		if (!scriptId) {
			this.openSettingsModal();
			this.showToast(
				"Veuillez renseigner votre ID de projet Google Apps Script",
				"error",
			);
			return;
		}

		const token = this.auth.getAccessToken();
		if (!token) {
			this.openSettingsModal();
			this.showToast("Connexion Google requise pour synchroniser", "error");
			return;
		}

		try {
			this.updateSyncBadge("syncing");
			this.showToast("Téléchargement des fichiers Apps Script...", "info");

			const files = await this.gas.getProjectContent(scriptId, token);
			const meta = await this.gas.getProjectMetadata(scriptId, token);

			if (meta?.title) {
				this.projectTitle = meta.title;
				document.getElementById("project-title").textContent =
					this.projectTitle;
			}

			this.files = files;
			this.openTabs = files.map((f) => f.id);
			this.dirtyFiles.clear();

			if (this.files.length > 0) {
				this.openFile(this.files[0].id);
			}

			this.updateSyncBadge("synced");
			this.showToast(
				`Projet Apps Script synchronisé (${files.length} fichiers)`,
				"success",
			);
		} catch (e) {
			console.error(e);
			this.updateSyncBadge("error");
			this.showToast(`Erreur : ${e.message}`, "error");
		}
	}

	/**
	 * Sauvegarde et synchronise vers Google Apps Script
	 */
	async saveAndSync() {
		const token = this.auth.getAccessToken();
		const scriptId = this.scriptId;

		if (!scriptId || !token) {
			this.openSettingsModal();
			this.showToast(
				"Configurez l'ID Apps Script et connectez-vous avec Google",
				"error",
			);
			return;
		}

		try {
			this.updateSyncBadge("syncing");
			await this.gas.updateProjectContent(scriptId, token, this.files);
			this.clearDirty();
			this.showToast(
				"Code synchronisé avec succès sur Google Apps Script !",
				"success",
			);
		} catch (e) {
			console.error(e);
			this.updateSyncBadge("error");
			this.showToast(`Erreur de synchronisation : ${e.message}`, "error");
		}
	}

	// --- AI Code Assistant ---
	async sendAiPrompt() {
		const input = document.getElementById("ai-input");
		const prompt = input.value.trim();
		if (!prompt) return;

		input.value = "";
		this.appendAiMessage("user", prompt);

		const activeFile = this.files.find((f) => f.id === this.activeFileId);

		try {
			this.appendAiMessage(
				"assistant",
				"🧠 Réflexion en cours via Google Gemini...",
				true,
			);
			const result = await this.ai.generateCode({
				prompt: prompt,
				activeFile: activeFile,
				allFiles: this.files,
			});

			this.replaceLastAiMessage(result.rawText, result.code);
		} catch (e) {
			console.error(e);
			this.replaceLastAiMessage(`❌ Erreur IA : ${e.message}`);
		}
	}

	async runAiQuickAction(action) {
		const activeFile = this.files.find((f) => f.id === this.activeFileId);
		if (!activeFile) {
			this.showToast("Veuillez ouvrir un fichier dans l'éditeur", "error");
			return;
		}

		this.toggleAiPanel(true);
		this.appendAiMessage("user", `⚡ Action rapide : ${action}`);
		this.appendAiMessage(
			"assistant",
			`Traitement de l'action '${action}' sur ${activeFile.displayName}...`,
			true,
		);

		try {
			const result = await this.ai.generateCode({
				prompt: "",
				activeFile: activeFile,
				allFiles: this.files,
				actionType: action,
			});

			this.replaceLastAiMessage(result.rawText, result.code);
		} catch (e) {
			console.error(e);
			this.replaceLastAiMessage(`❌ Erreur IA : ${e.message}`);
		}
	}

	appendAiMessage(role, text, isPending = false) {
		const container = document.getElementById("ai-messages");
		const msg = document.createElement("div");
		msg.className = `ai-message ${role} ${isPending ? "pending" : ""}`;
		msg.textContent = text;
		container.appendChild(msg);
		container.scrollTop = container.scrollHeight;
	}

	replaceLastAiMessage(markdownText, code = null) {
		const container = document.getElementById("ai-messages");
		const lastMsg =
			container.querySelector(".ai-message.assistant.pending") ||
			container.lastElementChild;
		if (!lastMsg) return;

		lastMsg.classList.remove("pending");

		// Conversion Markdown simple
		const formatted = markdownText
			.replace(
				/```(?:javascript|js|html|json)?\s*([\s\S]*?)```/g,
				"<pre><code>$1</code></pre>",
			)
			.replace(/`([^`]+)`/g, "<code>$1</code>")
			.replace(/\n/g, "<br>");

		let actionsHtml = "";
		if (code) {
			actionsHtml = `
        <div class="ai-code-actions">
          <button class="btn btn-primary btn-sm btn-apply-code">Remplacer dans l'éditeur</button>
          <button class="btn btn-secondary btn-sm btn-copy-code">Copier le code</button>
        </div>
      `;
		}

		lastMsg.innerHTML = `<div>${formatted}</div>${actionsHtml}`;

		if (code) {
			const btnApply = lastMsg.querySelector(".btn-apply-code");
			const btnCopy = lastMsg.querySelector(".btn-copy-code");

			btnApply.addEventListener("click", () => {
				if (this.editor && this.activeFileId) {
					this.editor.setValue(code);
					this.markFileDirty(this.activeFileId);
					this.showToast("Code inséré dans l'éditeur", "success");
				}
			});

			btnCopy.addEventListener("click", () => {
				navigator.clipboard.writeText(code);
				this.showToast("Code copié dans le presse-papier", "info");
			});
		}

		container.scrollTop = container.scrollHeight;
	}

	// --- UI Panneaux et Modals ---
	toggleSidebar() {
		document.getElementById("sidebar").classList.toggle("collapsed");
	}

	toggleAiPanel(forceOpen = false) {
		const panel = document.getElementById("ai-panel");
		if (forceOpen) {
			panel.classList.remove("collapsed");
		} else {
			panel.classList.toggle("collapsed");
		}
	}

	openSettingsModal() {
		document.getElementById("setting-script-id").value = this.scriptId;
		document.getElementById("setting-client-id").value =
			this.auth.getClientId();
		document.getElementById("setting-manual-token").value =
			this.auth.getManualToken();
		document.getElementById("setting-gemini-key").value = this.ai.getApiKey();
		document.getElementById("setting-gemini-model").value = this.ai.getModel();
		document.getElementById("setting-autosync").checked = this.autoSyncOnSave;

		document.getElementById("modal-settings").classList.remove("hidden");
	}

	closeSettingsModal() {
		document.getElementById("modal-settings").classList.add("hidden");
	}

	saveSettings() {
		const scriptId = document.getElementById("setting-script-id").value.trim();
		const clientId = document.getElementById("setting-client-id").value.trim();
		const manualToken = document
			.getElementById("setting-manual-token")
			.value.trim();
		const geminiKey = document
			.getElementById("setting-gemini-key")
			.value.trim();
		const geminiModel = document.getElementById("setting-gemini-model").value;
		const autosync = document.getElementById("setting-autosync").checked;

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

		this.ai.setApiKey(geminiKey);
		this.ai.setModel(geminiModel);
		if (geminiKey) {
			this.populateGeminiModels(true);
		}

		this.autoSyncOnSave = autosync;
		localStorage.setItem("interdev_autosync", autosync ? "true" : "false");

		this.closeSettingsModal();
		this.showToast("Paramètres enregistrés", "success");
		this.updateAuthUI();
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
		const testAi = new AiClient();
		testAi.setApiKey(key);

		try {
			const res = await testAi.generateCode({
				prompt: "Réponds simplement 'Connexion Gemini Opérationnelle !'",
			});
			alert(`✅ Succès : ${res.rawText}`);
		} catch (e) {
			alert(`❌ Échec : ${e.message}`);
		}
	}

	updateAuthUI() {
		const isAuthed = this.auth.isAuthenticated();
		const btnLogin = document.getElementById("btn-google-login");
		const btnLogout = document.getElementById("btn-google-logout");
		const statusText = document.getElementById("google-auth-status");

		if (isAuthed) {
			btnLogin.style.display = "none";
			btnLogout.style.display = "inline-flex";
			const email = this.auth.getUserEmail();
			statusText.textContent = email
				? `🟢 Connecté : ${email} (Accès Scripts & Drive)`
				: "🟢 Connecté à Google Apps Script";
			statusText.className = "help-text text-green-400";
		} else {
			btnLogin.style.display = "inline-flex";
			btnLogout.style.display = "none";
			statusText.textContent =
				"⚪ Non connecté (Connexion requise pour la synchronisation)";
			statusText.className = "help-text text-amber-400";
		}
	}

	updateStatusInfo() {
		const activeFile = this.files.find((f) => f.id === this.activeFileId);
		document.getElementById("status-file-info").textContent = activeFile
			? `${activeFile.displayName} (${activeFile.type})`
			: "--";
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
					'<div class="dropdown-empty">Connectez-vous à Google dans Paramètres ⚙️ pour lister automatiquement vos scripts.</div>';
			}
			return;
		}

		// Utiliser le cache si pas forcé
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
					'<div class="dropdown-empty">🔄 Recherche de vos scripts Google Apps Script...</div>';
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
						statusText.textContent = `✅ ${models.length} modèles récupérés avec succès de votre compte.`;
				} catch (e) {
					console.warn("Échec récupération dynamique modèles:", e);
					if (statusText)
						statusText.textContent = `⚠️ Impossible d'actualiser les modèles : ${e.message}`;
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
