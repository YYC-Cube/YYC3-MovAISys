import { OAuthService } from './OAuthService';
import { OAuthSessionManager, OAuthSession } from './OAuthSessionManager';
import { OAuthConfig } from './types';

export interface OAuthAuthControllerConfig {
  oauthConfig: OAuthConfig;
  stateSecret: string;
}

export class OAuthAuthController {
  private oauthService: OAuthService;
  private sessionManager: OAuthSessionManager;
  private stateSecret: string;

  constructor(config: OAuthAuthControllerConfig) {
    this.oauthService = new OAuthService(config.oauthConfig);
    this.sessionManager = new OAuthSessionManager();
    this.stateSecret = config.stateSecret;
  }

  async initiateOAuth(providerName: string): Promise<{ authorizationUrl: string; state: string; codeChallenge: string }> {
    const providers = this.oauthService.getAvailableProviders();
    
    if (!providers.includes(providerName)) {
      throw new Error(`Unsupported OAuth provider: ${providerName}`);
    }

    const state = this.generateState();
    const pkcePair = this.oauthService.generatePKCECodePair();
    const authorizationUrl = this.oauthService.getAuthorizationUrl(providerName, state, pkcePair.codeChallenge);

    return {
      authorizationUrl,
      state,
      codeChallenge: pkcePair.codeChallenge
    };
  }

  async handleOAuthCallback(
    providerName: string,
    code: string,
    state: string,
    codeVerifier: string
  ): Promise<{ sessionId: string; userInfo: any }> {
    if (!this.validateState(state)) {
      throw new Error('Invalid state parameter');
    }

    const tokenResponse = await this.oauthService.exchangeCodeForToken(providerName, code, codeVerifier);
    const userInfo = await this.oauthService.getUserInfo(providerName, tokenResponse.access_token);

    const userId = this.generateUserId(providerName, userInfo.id);
    const session = this.sessionManager.createSession(providerName, userId, userInfo, tokenResponse);

    return {
      sessionId: session.sessionId,
      userInfo
    };
  }

  async refreshAccessToken(sessionId: string): Promise<OAuthSession | undefined> {
    const session = this.sessionManager.getSession(sessionId);
    
    if (!session || !session.refreshToken) {
      throw new Error('Session not found or refresh token not available');
    }

    const tokenResponse = await this.oauthService.refreshAccessToken(session.provider, session.refreshToken);
    return this.sessionManager.updateSession(sessionId, tokenResponse);
  }

  async logout(sessionId: string): Promise<boolean> {
    return this.sessionManager.deleteSession(sessionId);
  }

  async getUserInfo(sessionId: string): Promise<OAuthUserInfo | undefined> {
    const session = this.sessionManager.getSession(sessionId);
    return session?.userInfo;
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.sessionManager.getSession(sessionId);
    return session !== undefined;
  }

  private generateState(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const hash = this.simpleHash(`${timestamp}${random}${this.stateSecret}`);
    return `${timestamp}_${random}_${hash}`;
  }

  private validateState(state: string): boolean {
    const parts = state.split('_');
    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, random, hash] = parts;
    const expectedHash = this.simpleHash(`${timestamp}${random}${this.stateSecret}`);
    
    return hash === expectedHash;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateUserId(provider: string, providerUserId: string): string {
    return `${provider}_${providerUserId}`;
  }

  getAvailableProviders(): string[] {
    return this.oauthService.getAvailableProviders();
  }

  cleanupExpiredSessions(): number {
    return this.sessionManager.cleanupExpiredSessions();
  }

  getSessionCount(): number {
    return this.sessionManager.getSessionCount();
  }
}
