/**
 * Client Google AI Studio (Gemini Code Assistant pour Google Apps Script)
 * Intégration directe REST 100% Client-Side — Aucune dépendance npm requise
 */

export class AiClient {
	constructor() {
		this.apiKeyStorageKey = "interdev_gemini_api_key";
		this.modelStorageKey = "interdev_gemini_model";
		this.defaultModel = "gemini-2.5-flash";
	}

	getApiKey() {
		return localStorage.getItem(this.apiKeyStorageKey) || "";
	}

	setApiKey(key) {
		if (key) {
			localStorage.setItem(this.apiKeyStorageKey, key.trim());
		} else {
			localStorage.removeItem(this.apiKeyStorageKey);
		}
	}

	getModel() {
		return localStorage.getItem(this.modelStorageKey) || this.defaultModel;
	}

	setModel(model) {
		if (model) {
			localStorage.setItem(this.modelStorageKey, model);
		}
	}

	getSystemInstruction() {
		return `Tu es un Architecte Senior & Expert Élite Google Apps Script (GAS) et Google Workspace Developer.
Règles strictes de développement :
1. Runtime V8 Moderne : Utilise la syntaxe ES6+ (const/let, fléchées, async/await, déstructuration, templates littéraux, Map/Set). N'utilise jamais le vieux moteur Rhino ('var' est proscrit).
2. Optimisation des Quotas Google :
   - Évite impérativement les appels unitaires dans les boucles (PAS de getValue()/setValue() répétés).
   - Utilise systématiquement le batching : getValues() et setValues() sur des tableaux 2D.
   - Respecte la limite d'exécution de 6 minutes par script (conçois des mécanismes de reprise avec PropertiesService ou LockService).
3. Gestion des Services Workspace :
   - GmailApp (ou Gmail Advanced Service pour les filtres et labels).
   - SpreadsheetApp (batching, Range, TextFinder).
   - DriveApp (requêtes d'itération paginées 'searchFiles').
   - UrlFetchApp (gestion des codes HTTP 429/503 avec backoff exponentiel).
   - LockService & CacheService pour la concurrence et les performances.
4. Robustesse : Entoure les opérations critiques de try/catch et logue proprement avec console.log/console.warn/console.error.
5. Format de réponse : Sois concis, pragmatique. Fournis toujours le code complet prêt à copier ou fusionner dans un bloc de code markdown (\`\`\`javascript ou \`\`\`html) suivi d'une brève explication.`;
	}

	/**
	 * Envoie une requête de génération de code à Gemini
	 */
	async generateCode({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
	}) {
		const apiKey = this.getApiKey();
		if (!apiKey) {
			throw new Error(
				"Clé API Gemini manquante. Veuillez configurer votre clé Google AI Studio dans les Paramètres.",
			);
		}

		const model = this.getModel();
		const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

		// Construction du contexte
		let contextMessage = "";
		if (activeFile) {
			contextMessage += `Fichier actif en cours d'édition (${activeFile.displayName}) :\n\`\`\`${activeFile.displayName.endsWith(".html") ? "html" : "javascript"}\n${activeFile.source}\n\`\`\`\n\n`;
		}

		if (allFiles.length > 1) {
			const otherFiles = allFiles.filter(
				(f) => !activeFile || f.id !== activeFile.id,
			);
			contextMessage += `Autres fichiers du projet Apps Script :\n`;
			otherFiles.forEach((f) => {
				contextMessage += `- ${f.displayName} (${f.type})\n`;
			});
			contextMessage += `\n`;
		}

		let finalPrompt = prompt;
		if (actionType === "optimize") {
			finalPrompt = `Optimise le code suivant pour le runtime V8 de Google Apps Script et les quotas Google Workspace (batching setValues/getValues, LockService, CacheService) :\n\n${contextMessage}`;
		} else if (actionType === "audit") {
			finalPrompt = `Audite ce script Google Apps Script et identifie les risques de timeouts (6 min), dépassements de quotas (Gmail, Drive, UrlFetchApp) ou failles de sécurité, puis fournis une version corrigée et résiliente :\n\n${contextMessage}`;
		} else if (actionType === "jsdoc") {
			finalPrompt = `Génère une documentation JSDoc complète et rigoureuse pour chaque fonction de ce script Google Apps Script :\n\n${contextMessage}`;
		} else if (actionType === "trigger") {
			finalPrompt = `Crée une fonction d'installation et de gestion de déclencheur (Installable Trigger horaire ou journalier) robuste avec vérification d'existence pour exécuter la fonction principale de ce script :\n\n${contextMessage}`;
		} else {
			finalPrompt = `${contextMessage}Demande de l'utilisateur :\n${prompt}`;
		}

		const payload = {
			contents: [
				{
					role: "user",
					parts: [{ text: finalPrompt }],
				},
			],
			systemInstruction: {
				parts: [{ text: this.getSystemInstruction() }],
			},
			generationConfig: {
				temperature: 0.2,
				maxOutputTokens: 8192,
			},
		};

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message || `Erreur API Gemini (${response.status})`,
			);
		}

		const data = await response.json();
		const candidate = data.candidates?.[0];
		if (!candidate?.content?.parts?.[0]?.text) {
			throw new Error("Aucune réponse générée par l'IA.");
		}

		const text = candidate.content.parts[0].text;
		const extractedCode = this.extractCodeBlock(text);

		return {
			rawText: text,
			code: extractedCode,
		};
	}

	/**
	 * Extrait le premier ou le plus grand bloc de code d'une réponse Markdown
	 */
	extractCodeBlock(markdown) {
		const codeBlockRegex = /```(?:javascript|js|html|json)?\s*([\s\S]*?)```/g;
		let longestCode = "";
		let match = codeBlockRegex.exec(markdown);
		while (match !== null) {
			const code = match[1].trim();
			if (code.length > longestCode.length) {
				longestCode = code;
			}
			match = codeBlockRegex.exec(markdown);
		}
		return longestCode || null;
	}
}
