/**
 * Client officiel Google Apps Script REST API v1
 * Documentation : https://developers.google.com/apps-script/api/reference/rest/v1/projects
 */

export class GasClient {
	constructor(baseUrl = "https://script.googleapis.com/v1") {
		this.baseUrl = baseUrl;
	}

	/**
	 * Récupère le contenu d'un projet Apps Script (liste des fichiers)
	 */
	async getProjectContent(scriptId, accessToken) {
		if (!scriptId) throw new Error("ID de projet Apps Script requis.");
		if (!accessToken)
			throw new Error("Token d'accès Google requis. Veuillez vous connecter.");

		const url = `${this.baseUrl}/projects/${encodeURIComponent(scriptId)}/content`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message ||
					`Erreur HTTP ${response.status} lors de la lecture du projet Apps Script.`,
			);
		}

		const data = await response.json();
		const rawFiles = data.files || [];

		// Normalisation vers des fichiers avec extension conviviale
		return rawFiles.map((file) => {
			let extension = ".gs";
			if (file.type === "HTML") extension = ".html";
			if (file.type === "JSON") extension = ".json";

			const displayName = file.name.endsWith(extension)
				? file.name
				: `${file.name}${extension}`;

			return {
				id: file.name,
				name: file.name,
				displayName: displayName,
				type: file.type,
				source: file.source || "",
				createTime: file.createTime,
				updateTime: file.updateTime,
				lastModifyUser: file.lastModifyUser,
			};
		});
	}

	/**
	 * Pousse la totalité des fichiers vers Google Apps Script (Synchronisation)
	 */
	async updateProjectContent(scriptId, accessToken, files) {
		if (!scriptId) throw new Error("ID de projet Apps Script requis.");
		if (!accessToken)
			throw new Error("Token d'accès Google requis. Veuillez vous connecter.");

		// Conversion au format attendu par Google Apps Script REST API
		const payloadFiles = files.map((f) => {
			let type = f.type || "SERVER_JS";
			let name = f.name;

			// Nettoyer l'extension si présente dans le nom d'origine
			if (name.endsWith(".gs")) {
				name = name.slice(0, -3);
				type = "SERVER_JS";
			} else if (name.endsWith(".html")) {
				name = name.slice(0, -5);
				type = "HTML";
			} else if (name.endsWith(".json")) {
				name = name.slice(0, -5);
				type = "JSON";
			}

			return {
				name: name,
				type: type,
				source: f.source,
			};
		});

		// Google exige impérativement que le manifest appsscript.json soit présent
		const hasManifest = payloadFiles.some(
			(f) => f.name === "appsscript" && f.type === "JSON",
		);
		if (!hasManifest) {
			payloadFiles.push({
				name: "appsscript",
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
			});
		}

		const url = `${this.baseUrl}/projects/${encodeURIComponent(scriptId)}/content`;
		const response = await fetch(url, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				files: payloadFiles,
			}),
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message ||
					`Erreur HTTP ${response.status} lors de la mise à jour Apps Script.`,
			);
		}

		return await response.json();
	}

	/**
	 * Récupère les métadonnées du projet (Titre, créateur, etc.)
	 */
	async getProjectMetadata(scriptId, accessToken) {
		const url = `${this.baseUrl}/projects/${encodeURIComponent(scriptId)}`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) return null;
		return await response.json();
	}

	/**
	 * Crée un nouveau projet Apps Script vierge
	 */
	async createProject(title, accessToken, parentId = null) {
		const url = `${this.baseUrl}/projects`;
		const body = { title: title || "Nouveau Script" };
		if (parentId) body.parentId = parentId;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				err.error?.message || `Erreur création projet Apps Script.`,
			);
		}

		return await response.json();
	}

	/**
	 * Liste l'ensemble des scripts Google Apps Script de l'utilisateur via Google Drive API
	 */
	async listUserProjects(accessToken) {
		if (!accessToken) {
			throw new Error("Token d'accès Google requis pour lister les scripts.");
		}

		const query = encodeURIComponent(
			"mimeType = 'application/vnd.google-apps.script' and trashed = false",
		);
		const fields = encodeURIComponent(
			"files(id, name, modifiedTime, createdTime, owners)",
		);
		const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=100`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			const msg = err.error?.message || "";
			if (
				response.status === 403 &&
				(msg.includes("Google Drive API") ||
					msg.includes("Access Not Configured"))
			) {
				throw new Error(
					"L'API Google Drive doit être activée sur votre projet Google Cloud pour lister vos scripts automatiquement. Activez-la dans Google Cloud Console (APIs & Services > Library > Google Drive API).",
				);
			}
			throw new Error(
				msg || `Erreur ${response.status} lors de la recherche des scripts.`,
			);
		}

		const data = await response.json();
		return (data.files || []).map((file) => ({
			id: file.id,
			title: file.name,
			modifiedTime: file.modifiedTime,
			createdTime: file.createdTime,
		}));
	}
}
