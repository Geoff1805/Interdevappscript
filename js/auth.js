/**
 * Module d'authentification Google OAuth2 (Google Identity Services) & Token Manager
 * 100% Client-Side — Persistance localStorage & Renouvellement Silencieux Permanent
 */

export class AuthManager {
	constructor() {
		this.clientIdKey = "interdev_google_client_id";
		this.tokenKey = "interdev_google_access_token";
		this.tokenExpiryKey = "interdev_google_token_expiry";
		this.manualTokenKey = "interdev_google_manual_token";
		this.userEmailKey = "interdev_google_user_email";
		this.tokenClient = null;
		this.refreshTimer = null;
		this.onTokenChangeCallbacks = [];

		// Initialisation différée si GIS est en cours de chargement
		this.initGisClient();
	}

	getUserEmail() {
		return localStorage.getItem(this.userEmailKey) || "";
	}

	getClientId() {
		return (
			localStorage.getItem(this.clientIdKey) ||
			"740777072621-33egh4phvjfgu84alpn1ovj16s83g7hs.apps.googleusercontent.com"
		);
	}

	setClientId(clientId) {
		if (clientId) {
			localStorage.setItem(this.clientIdKey, clientId.trim());
			this.initGisClient();
		} else {
			localStorage.removeItem(this.clientIdKey);
		}
	}

	getManualToken() {
		return localStorage.getItem(this.manualTokenKey) || "";
	}

	setManualToken(token) {
		if (token) {
			localStorage.setItem(this.manualTokenKey, token.trim());
		} else {
			localStorage.removeItem(this.manualTokenKey);
		}
		this.notifyTokenChange();
	}

	/**
	 * Initialise le client Google Identity Services (GIS)
	 */
	initGisClient() {
		const clientId = this.getClientId();
		if (!clientId) return false;

		if (
			typeof window.google === "undefined" ||
			!window.google.accounts?.oauth2
		) {
			// Si GIS n'est pas encore prêt, retenter au chargement de la fenêtre
			window.addEventListener("load", () => this.initGisClient(), {
				once: true,
			});
			setTimeout(() => this.initGisClient(), 1200);
			return false;
		}

		try {
			this.tokenClient = window.google.accounts.oauth2.initTokenClient({
				client_id: clientId,
				scope:
					"https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email",
				prompt: "",
				callback: async (response) => {
					if (response.error) {
						console.warn(
							"[Interdev] Google OAuth response warning:",
							response.error,
						);
						// Si le renouvellement silencieux échoue, ne pas alerter l'utilisateur inutilement
						if (
							response.error !== "immediate_failed" &&
							response.error !== "user_logged_out"
						) {
							console.error("Google OAuth error:", response);
						}
						return;
					}
					if (response.access_token) {
						const expiresInSeconds = Number(response.expires_in) || 3599;
						const expiryTime = Date.now() + expiresInSeconds * 1000;

						// Persistance PERMANENTE dans localStorage
						localStorage.setItem(this.tokenKey, response.access_token);
						localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());

						// Récupération de l'adresse email connectée
						try {
							const userRes = await fetch(
								"https://www.googleapis.com/oauth2/v3/userinfo",
								{
									headers: { Authorization: `Bearer ${response.access_token}` },
								},
							);
							if (userRes.ok) {
								const userData = await userRes.json();
								if (userData.email) {
									localStorage.setItem(this.userEmailKey, userData.email);
								}
							}
						} catch (e) {
							console.warn("Impossible de récupérer l'email utilisateur:", e);
						}

						// Programmer le renouvellement silencieux 5 minutes avant expiration
						this.scheduleTokenRefresh(expiresInSeconds);
						this.notifyTokenChange();
					}
				},
			});

			// Si un utilisateur était déjà connecté et que le token est expiré ou proche d'expirer, tenter un renouvellement silencieux immédiat
			const currentToken = localStorage.getItem(this.tokenKey);
			const expiry = Number(localStorage.getItem(this.tokenExpiryKey) || 0);
			if (currentToken && expiry - Date.now() < 300000) {
				this.silentRefresh();
			} else if (currentToken && expiry > Date.now()) {
				const remainingSeconds = Math.floor((expiry - Date.now()) / 1000);
				this.scheduleTokenRefresh(remainingSeconds);
			}

			return true;
		} catch (e) {
			console.error("Erreur initialisation GIS:", e);
			return false;
		}
	}

	/**
	 * Déclenche un renouvellement silencieux en tâche de fond (sans popup)
	 */
	silentRefresh() {
		if (!this.tokenClient) {
			const ok = this.initGisClient();
			if (!ok || !this.tokenClient) return;
		}

		const email = this.getUserEmail();
		try {
			// prompt: "" et hint: email permettent à Google de renvoyer un token sans aucune interaction
			this.tokenClient.requestAccessToken({
				prompt: "",
				hint: email || undefined,
			});
		} catch (e) {
			console.warn("[Interdev] Échec du renouvellement silencieux:", e);
		}
	}

	/**
	 * Programme le renouvellement automatique 5 minutes avant l'expiration du token
	 */
	scheduleTokenRefresh(expiresInSeconds) {
		if (this.refreshTimer) clearTimeout(this.refreshTimer);
		// 5 minutes (300 s) avant expiration, ou minimum 15 secondes
		const delayMs = Math.max(15000, (expiresInSeconds - 300) * 1000);
		this.refreshTimer = setTimeout(() => {
			this.silentRefresh();
		}, delayMs);
	}

	/**
	 * Déclenche la popup de connexion Google (authentification initiale ou changement de compte)
	 */
	login() {
		const clientId = this.getClientId();
		if (!clientId) {
			throw new Error(
				"Client ID Google manquant. Veuillez saisir votre Client ID.",
			);
		}
		if (
			typeof window.google === "undefined" ||
			!window.google.accounts?.oauth2
		) {
			throw new Error(
				"Le service Google Identity Services n'est pas encore chargé ou est bloqué par votre navigateur.\n\nVérifiez que vous n'avez pas d'extension type bloqueur de pub/scripts bloquant 'accounts.google.com' sur cette page.",
			);
		}
		if (!this.tokenClient) {
			const ok = this.initGisClient();
			if (!ok || !this.tokenClient) {
				throw new Error("Impossible d'initialiser le client Google OAuth.");
			}
		}
		this.tokenClient.requestAccessToken({ prompt: "select_account" });
	}

	/**
	 * Récupère le token actif (OAuth ou manuel)
	 */
	getAccessToken() {
		// 1. Priorité au token manuel si défini
		const manualToken = this.getManualToken();
		if (manualToken) return manualToken;

		// 2. Token OAuth GIS depuis localStorage
		const token = localStorage.getItem(this.tokenKey);
		const expiry = Number(localStorage.getItem(this.tokenExpiryKey) || 0);

		if (token && expiry > Date.now()) {
			// Si le token expire bientôt (< 5 min), déclencher le renouvellement silencieux
			if (expiry - Date.now() < 300000) {
				this.silentRefresh();
			}
			return token;
		}

		// Si expiré mais qu'on a un email mémorisé, lancer un renouvellement silencieux immédiat
		if (token && expiry <= Date.now()) {
			this.silentRefresh();
			// On renvoie le token pour les requêtes immédiates si renouvellement en cours
			return token;
		}

		return null;
	}

	isAuthenticated() {
		return Boolean(this.getAccessToken());
	}

	logout() {
		if (this.refreshTimer) clearTimeout(this.refreshTimer);
		const token = localStorage.getItem(this.tokenKey);
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.tokenExpiryKey);
		localStorage.removeItem(this.manualTokenKey);
		localStorage.removeItem(this.userEmailKey);

		if (
			token &&
			typeof window.google !== "undefined" &&
			window.google.accounts?.oauth2
		) {
			try {
				window.google.accounts.oauth2.revoke(token);
			} catch (_e) {
				// Ignorer
			}
		}
		this.notifyTokenChange();
	}

	onTokenChange(callback) {
		this.onTokenChangeCallbacks.push(callback);
	}

	notifyTokenChange() {
		const isAuthed = this.isAuthenticated();
		this.onTokenChangeCallbacks.forEach((cb) => {
			try {
				cb(isAuthed);
			} catch (e) {
				console.error(e);
			}
		});
	}
}
