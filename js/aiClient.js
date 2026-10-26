/**
 * Client Multi-Fournisseurs d'IA (Google Gemini, Groq, Mistral AI, OpenRouter, Ollama)
 * Conçu pour Google Apps Script (V8) avec fallback automatique anti-saturation 503/429
 * 100% Client-Side — Aucune dépendance npm requise
 */

export class AiClient {
	constructor() {
		// Clés de stockage LocalStorage
		this.providerStorageKey = "interdev_active_ai_provider";
		this.geminiKeyStorageKey = "interdev_gemini_api_key";
		this.geminiModelStorageKey = "interdev_gemini_model";
		this.geminiCachedModelsKey = "interdev_gemini_cached_models";

		this.groqKeyStorageKey = "interdev_groq_api_key";
		this.groqModelStorageKey = "interdev_groq_model";

		this.mistralKeyStorageKey = "interdev_mistral_api_key";
		this.mistralModelStorageKey = "interdev_mistral_model";

		this.openRouterKeyStorageKey = "interdev_openrouter_api_key";
		this.openRouterModelStorageKey = "interdev_openrouter_model";

		this.ollamaEndpointStorageKey = "interdev_ollama_endpoint";
		this.ollamaModelStorageKey = "interdev_ollama_model";

		// Valeurs par défaut
		this.defaultProvider = "gemini";
		this.defaultGeminiModel = "gemini-3.8-flash";
		this.defaultGroqModel = "llama-3.3-70b-versatile";
		this.defaultMistralModel = "codestral-latest";
		this.defaultOpenRouterModel = "deepseek/deepseek-r1:free";
		this.defaultOllamaModel = "qwen2.5-coder:1.5b";

		// Chaîne de repli (Fallback) pour Gemini en cas de saturation (503 High Demand ou 429)
		this.geminiFallbackChain = [
			"gemini-3.8-flash",
			"gemini-2.5-flash",
			"gemini-2.0-flash",
			"gemini-1.5-flash",
			"gemini-2.5-pro",
		];
	}

	// --- Gestion du Fournisseur Actif ---
	getActiveProvider() {
		return (
			localStorage.getItem(this.providerStorageKey) || this.defaultProvider
		);
	}

	setActiveProvider(provider) {
		if (provider) {
			localStorage.setItem(this.providerStorageKey, provider);
		}
	}

	// --- Gemini ---
	getApiKey() {
		return localStorage.getItem(this.geminiKeyStorageKey) || "";
	}

	setApiKey(key) {
		if (key) {
			localStorage.setItem(this.geminiKeyStorageKey, key.trim());
		} else {
			localStorage.removeItem(this.geminiKeyStorageKey);
		}
	}

	getModel() {
		return (
			localStorage.getItem(this.geminiModelStorageKey) ||
			this.defaultGeminiModel
		);
	}

	setModel(model) {
		if (model) {
			localStorage.setItem(this.geminiModelStorageKey, model);
		}
	}

	// --- Groq ---
	getGroqKey() {
		return localStorage.getItem(this.groqKeyStorageKey) || "";
	}

	setGroqKey(key) {
		if (key) {
			localStorage.setItem(this.groqKeyStorageKey, key.trim());
		} else {
			localStorage.removeItem(this.groqKeyStorageKey);
		}
	}

	getGroqModel() {
		return (
			localStorage.getItem(this.groqModelStorageKey) || this.defaultGroqModel
		);
	}

	setGroqModel(model) {
		if (model) {
			localStorage.setItem(this.groqModelStorageKey, model);
		}
	}

	// --- Mistral AI ---
	getMistralKey() {
		return localStorage.getItem(this.mistralKeyStorageKey) || "";
	}

	setMistralKey(key) {
		if (key) {
			localStorage.setItem(this.mistralKeyStorageKey, key.trim());
		} else {
			localStorage.removeItem(this.mistralKeyStorageKey);
		}
	}

	getMistralModel() {
		return (
			localStorage.getItem(this.mistralModelStorageKey) ||
			this.defaultMistralModel
		);
	}

	setMistralModel(model) {
		if (model) {
			localStorage.setItem(this.mistralModelStorageKey, model);
		}
	}

	// --- OpenRouter ---
	getOpenRouterKey() {
		return localStorage.getItem(this.openRouterKeyStorageKey) || "";
	}

	setOpenRouterKey(key) {
		if (key) {
			localStorage.setItem(this.openRouterKeyStorageKey, key.trim());
		} else {
			localStorage.removeItem(this.openRouterKeyStorageKey);
		}
	}

	getOpenRouterModel() {
		return (
			localStorage.getItem(this.openRouterModelStorageKey) ||
			this.defaultOpenRouterModel
		);
	}

	setOpenRouterModel(model) {
		if (model) {
			localStorage.setItem(this.openRouterModelStorageKey, model);
		}
	}

	// --- Ollama ---
	getOllamaEndpoint() {
		return (
			localStorage.getItem(this.ollamaEndpointStorageKey) ||
			"http://localhost:11434"
		);
	}

	setOllamaEndpoint(endpoint) {
		if (endpoint) {
			localStorage.setItem(this.ollamaEndpointStorageKey, endpoint.trim());
		}
	}

	getOllamaModel() {
		return (
			localStorage.getItem(this.ollamaModelStorageKey) ||
			this.defaultOllamaModel
		);
	}

	setOllamaModel(model) {
		if (model) {
			localStorage.setItem(this.ollamaModelStorageKey, model);
		}
	}

	// --- Récupération des modèles Gemini dynamiques ---
	getCachedModels() {
		try {
			const raw = localStorage.getItem(this.geminiCachedModelsKey);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	async fetchAvailableModels(apiKey = null) {
		const key = apiKey || this.getApiKey();
		if (!key) {
			throw new Error(
				"Clé API Google Gemini requise pour récupérer les modèles.",
			);
		}

		const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
		const response = await fetch(endpoint);
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message ||
					`Erreur ${response.status} lors de la récupération des modèles Gemini.`,
			);
		}

		const data = await response.json();
		const rawModels = data.models || [];

		const textModels = rawModels
			.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
			.map((m) => {
				const cleanId = m.name.replace(/^models\//, "");
				return {
					id: cleanId,
					name: m.displayName || cleanId,
					description: m.description || "",
					inputTokenLimit: m.inputTokenLimit,
					outputTokenLimit: m.outputTokenLimit,
				};
			});

		textModels.sort((a, b) => {
			const getScore = (id) => {
				const match = id.match(/gemini-(\d+(?:\.\d+)?)/);
				const ver = match ? parseFloat(match[1]) : 0;
				const isFlash = id.includes("flash") ? 0.05 : 0;
				return ver + isFlash;
			};
			return getScore(b.id) - getScore(a.id);
		});

		if (textModels.length > 0) {
			localStorage.setItem(
				this.geminiCachedModelsKey,
				JSON.stringify(textModels),
			);
		}

		return textModels;
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
5. Format de réponse : Fournis toujours le code complet prêt à copier ou insérer dans un bloc de code markdown (\`\`\`javascript ou \`\`\`html) avec une brève explication claire.`;
	}

	/**
	 * Point d'entrée universel pour générer du code
	 * Aiguille automatiquement vers le bon fournisseur (Gemini avec fallback, Groq, Mistral, OpenRouter, Ollama)
	 */
	async generateCode({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const provider = this.getActiveProvider();

		if (provider === "groq") {
			return this.callGroq({
				prompt,
				activeFile,
				allFiles,
				actionType,
				systemInstruction,
			});
		}
		if (provider === "mistral") {
			return this.callMistral({
				prompt,
				activeFile,
				allFiles,
				actionType,
				systemInstruction,
			});
		}
		if (provider === "openrouter") {
			return this.callOpenRouter({
				prompt,
				activeFile,
				allFiles,
				actionType,
				systemInstruction,
			});
		}
		if (provider === "ollama") {
			return this.callOllama({
				prompt,
				activeFile,
				allFiles,
				actionType,
				systemInstruction,
			});
		}

		// Par défaut : Gemini avec Fallback Anti-Saturation automatique
		return this.callGeminiWithFallback({
			prompt,
			activeFile,
			allFiles,
			actionType,
			systemInstruction,
		});
	}

	/**
	 * Appel Google Gemini avec Fallback automatique si le modèle est saturé (503 / 429)
	 */
	async callGeminiWithFallback({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const apiKey = this.getApiKey();
		if (!apiKey) {
			throw new Error(
				"Clé API Gemini manquante. Veuillez renseigner votre clé ou importer votre interdev-config.json dans Paramètres.",
			);
		}

		const initialModel = this.getModel();
		const candidateModels = [
			initialModel,
			...this.geminiFallbackChain.filter((m) => m !== initialModel),
		];

		const finalPrompt = this.buildFinalPrompt({
			prompt,
			activeFile,
			allFiles,
			actionType,
		});
		const sysPrompt = systemInstruction || this.getSystemInstruction();

		let lastError = null;

		for (const model of candidateModels) {
			try {
				const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
				const payload = {
					contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
					systemInstruction: { parts: [{ text: sysPrompt }] },
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
					const errBody = await response.json().catch(() => ({}));
					const errMsg = errBody.error?.message || "";

					// Si saturation (503 High Demand ou 429 Quota), tenter le modèle suivant dans la chaîne
					const isOverloaded =
						response.status === 503 ||
						response.status === 429 ||
						errMsg.toLowerCase().includes("high demand") ||
						errMsg.toLowerCase().includes("spikes in demand") ||
						errMsg.toLowerCase().includes("resource has been exhausted");

					if (isOverloaded) {
						console.warn(
							`Modèle ${model} saturé (${errMsg}). Tentative sur modèle suivant...`,
						);
						lastError = new Error(
							`Le modèle ${model} est saturé. Bascule automatique vers le modèle de secours...`,
						);
						continue; // Essayer le modèle suivant
					}

					throw new Error(errMsg || `Erreur API Gemini (${response.status})`);
				}

				const data = await response.json();
				const candidate = data.candidates?.[0];
				if (!candidate?.content?.parts?.[0]?.text) {
					throw new Error("Aucune réponse générée.");
				}

				const text = candidate.content.parts[0].text;
				return {
					rawText: text,
					code: this.extractCodeBlock(text),
					modelUsed: model,
				};
			} catch (err) {
				lastError = err;
				// Si c'est une erreur réseau ou de saturation, on continue la boucle
				if (
					err.message?.includes("saturé") ||
					err.message?.includes("high demand")
				) {
					continue;
				}
				throw err;
			}
		}

		throw (
			lastError ||
			new Error("Tous les modèles Gemini sont temporairement saturés.")
		);
	}

	/**
	 * Appel Groq Cloud (Llama 3.3 70B, DeepSeek-R1 Distill)
	 */
	async callGroq({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const apiKey = this.getGroqKey();
		if (!apiKey) {
			throw new Error("Clé API Groq manquante. Renseignez-la dans Paramètres.");
		}

		const model = this.getGroqModel();
		const finalPrompt = this.buildFinalPrompt({
			prompt,
			activeFile,
			allFiles,
			actionType,
		});
		const sysPrompt = systemInstruction || this.getSystemInstruction();

		const response = await fetch(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{ role: "system", content: sysPrompt },
						{ role: "user", content: finalPrompt },
					],
					temperature: 0.2,
					max_tokens: 8192,
				}),
			},
		);

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message || `Erreur Groq API (${response.status})`,
			);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";
		return {
			rawText: text,
			code: this.extractCodeBlock(text),
			modelUsed: `Groq (${model})`,
		};
	}

	/**
	 * Appel Mistral AI (Codestral-latest)
	 */
	async callMistral({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const apiKey = this.getMistralKey();
		if (!apiKey) {
			throw new Error("Clé API Mistral (Codestral) manquante.");
		}

		const model = this.getMistralModel();
		const finalPrompt = this.buildFinalPrompt({
			prompt,
			activeFile,
			allFiles,
			actionType,
		});
		const sysPrompt = systemInstruction || this.getSystemInstruction();

		const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: "system", content: sysPrompt },
					{ role: "user", content: finalPrompt },
				],
				temperature: 0.2,
			}),
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message || `Erreur Mistral API (${response.status})`,
			);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";
		return {
			rawText: text,
			code: this.extractCodeBlock(text),
			modelUsed: `Mistral (${model})`,
		};
	}

	/**
	 * Appel OpenRouter
	 */
	async callOpenRouter({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const apiKey = this.getOpenRouterKey();
		if (!apiKey) {
			throw new Error("Clé API OpenRouter manquante.");
		}

		const model = this.getOpenRouterModel();
		const finalPrompt = this.buildFinalPrompt({
			prompt,
			activeFile,
			allFiles,
			actionType,
		});
		const sysPrompt = systemInstruction || this.getSystemInstruction();

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
					"HTTP-Referer": "https://geoff1805.github.io/Interdevappscript/",
					"X-Title": "Interdevappscript Studio",
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{ role: "system", content: sysPrompt },
						{ role: "user", content: finalPrompt },
					],
				}),
			},
		);

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message || `Erreur OpenRouter (${response.status})`,
			);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";
		return {
			rawText: text,
			code: this.extractCodeBlock(text),
			modelUsed: `OpenRouter (${model})`,
		};
	}

	/**
	 * Appel Ollama Local (0 token, 100% hors-ligne)
	 */
	async callOllama({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
		systemInstruction = null,
	}) {
		const endpoint = this.getOllamaEndpoint().replace(/\/$/, "");
		const model = this.getOllamaModel();
		const finalPrompt = this.buildFinalPrompt({
			prompt,
			activeFile,
			allFiles,
			actionType,
		});
		const sysPrompt = systemInstruction || this.getSystemInstruction();

		const url = `${endpoint}/v1/chat/completions`;
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: "system", content: sysPrompt },
					{ role: "user", content: finalPrompt },
				],
				temperature: 0.2,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`Ollama local inaccessible sur ${endpoint}. Vérifiez qu'Ollama est démarré.`,
			);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";
		return {
			rawText: text,
			code: this.extractCodeBlock(text),
			modelUsed: `Ollama Local (${model})`,
		};
	}

	buildFinalPrompt({
		prompt,
		activeFile,
		allFiles = [],
		actionType = "general",
	}) {
		let contextMessage = "";
		if (activeFile) {
			contextMessage += `Fichier actif (${activeFile.displayName}) :\n\`\`\`${activeFile.displayName.endsWith(".html") ? "html" : "javascript"}\n${activeFile.source}\n\`\`\`\n\n`;
		}

		if (allFiles.length > 1) {
			const otherFiles = allFiles.filter(
				(f) => !activeFile || f.id !== activeFile.id,
			);
			contextMessage += `Autres fichiers du projet :\n`;
			otherFiles.forEach((f) => {
				contextMessage += `- ${f.displayName} (${f.type})\n`;
			});
			contextMessage += `\n`;
		}

		if (actionType === "optimize") {
			return `Optimise ce code pour le Runtime V8 Google Apps Script et les quotas Google Workspace (batching 2D setValues/getValues, anti-timeout 6 min) :\n\n${contextMessage}`;
		}
		if (actionType === "audit") {
			return `Audite ce script Google Apps Script : identifie les risques de timeouts (6 min) et quotas, puis fournis la version corrigée complète :\n\n${contextMessage}`;
		}
		if (actionType === "jsdoc") {
			return `Génère une documentation JSDoc complète et rigoureuse pour chaque fonction de ce script Google Apps Script :\n\n${contextMessage}`;
		}
		if (actionType === "trigger") {
			return `Crée une fonction d'installation de déclencheur temporel quotidien pour ce script :\n\n${contextMessage}`;
		}

		return `${contextMessage}Demande :\n${prompt}`;
	}

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
