/**
 * Module d'authentification Google OAuth2 (Google Identity Services) & Token Manager
 * 100% Client-Side — Zéro transmission à un serveur tiers
 */

export class AuthManager {
	constructor() {
		this.clientIdKey = "interdev_google_client_id";
		this.tokenKey = "interdev_google_access_token";
		this.tokenExpiryKey = "interdev_google_token_expiry";
		this.manualTokenKey = "interdev_google_manual_token";
		this.tokenClient = null;
		this.onTokenChangeCallbacks = [];
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
		return sessionStorage.getItem(this.manualTokenKey) || "";
	}

	setManualToken(token) {
		if (token) {
			sessionStorage.setItem(this.manualTokenKey, token.trim());
		} else {
			sessionStorage.removeItem(this.manualTokenKey);
		}
		this.notifyTokenChange();
	}

	/**
	 * Initialise le client Google Identity Services si le script externe est chargé
	 */
	initGisClient() {
		const clientId = this.getClientId();
		if (!clientId) return false;
		if (
			typeof window.google === "undefined" ||
			!window.google.accounts?.oauth2
		) {
			return false;
		}

		try {
			this.tokenClient = window.google.accounts.oauth2.initTokenClient({
				client_id: clientId,
				scope:
					"https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/drive.metadata.readonly",
				prompt: "",
				callback: (response) => {
					if (response.error) {
						console.error("Google OAuth error:", response);
						alert(
							`Erreur d'authentification Google : ${response.error_description || response.error}`,
						);
						return;
					}
					if (response.access_token) {
						const expiresInSeconds = Number(response.expires_in) || 3599;
						const expiryTime = Date.now() + expiresInSeconds * 1000;
						sessionStorage.setItem(this.tokenKey, response.access_token);
						sessionStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
						this.notifyTokenChange();
					}
				},
			});
			return true;
		} catch (e) {
			console.error("Erreur initialisation GIS:", e);
			return false;
		}
	}

	/**
	 * Déclenche la popup de connexion Google
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
				"Le service Google Identity Services n'est pas encore chargé ou est bloqué par votre navigateur.\n\nVérifiez que vous n'avez pas d'extension type bloqueur de pub/scripts (uBlock, Brave Shield) bloquant 'accounts.google.com' sur cette page.",
			);
		}
		if (!this.tokenClient) {
			const ok = this.initGisClient();
			if (!ok || !this.tokenClient) {
				throw new Error("Impossible d'initialiser le client Google OAuth.");
			}
		}
		this.tokenClient.requestAccessToken({ prompt: "" });
	}

	/**
	 * Récupère le token actif (OAuth ou manuel) s'il n'est pas expiré
	 */
	getAccessToken() {
		// 1. Priorité au token manuel si défini
		const manualToken = this.getManualToken();
		if (manualToken) return manualToken;

		// 2. Token OAuth GIS
		const token = sessionStorage.getItem(this.tokenKey);
		const expiry = Number(sessionStorage.getItem(this.tokenExpiryKey) || 0);

		if (token && expiry > Date.now()) {
			return token;
		}

		// Token expiré
		if (token && expiry <= Date.now()) {
			sessionStorage.removeItem(this.tokenKey);
			sessionStorage.removeItem(this.tokenExpiryKey);
			this.notifyTokenChange();
		}

		return null;
	}

	isAuthenticated() {
		return Boolean(this.getAccessToken());
	}

	logout() {
		sessionStorage.removeItem(this.tokenKey);
		sessionStorage.removeItem(this.tokenExpiryKey);
		sessionStorage.removeItem(this.manualTokenKey);
		const token = this.getAccessToken();
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
