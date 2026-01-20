import { OAuthProvider, OAuthTokenResponse, OAuthUserInfo, OAuthConfig, PKCECodePair } from './types';

export class OAuthService {
  private config: OAuthConfig;
  private providers: Map<string, OAuthProvider> = new Map();

  constructor(config: OAuthConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('google', {
      name: 'google',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId: this.config.google.clientId,
      clientSecret: this.config.google.clientSecret,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: this.config.redirectUri
    });

    this.providers.set('github', {
      name: 'github',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      clientId: this.config.github.clientId,
      clientSecret: this.config.github.clientSecret,
      scopes: ['read:user', 'user:email'],
      redirectUri: this.config.redirectUri
    });
  }

  async generatePKCECodePair(): Promise<PKCECodePair> {
    const codeVerifier = this.generateRandomString(128);
    const hashBuffer = await this.sha256(codeVerifier);
    const codeChallenge = this.base64UrlEncode(hashBuffer);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  }

  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private async sha256(message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    return await crypto.subtle.digest('SHA-256', data);
  }

  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => binary += String.fromCharCode(byte));
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  getAuthorizationUrl(providerName: string, state: string, codeChallenge?: string): string {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state
    });

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${provider.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForToken(providerName: string, code: string, codeVerifier?: string): Promise<OAuthTokenResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    const body = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: provider.redirectUri
    });

    if (codeVerifier) {
      body.append('code_verifier', codeVerifier);
    }

    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return await response.json();
  }

  async refreshAccessToken(providerName: string, refreshToken: string): Promise<OAuthTokenResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    const body = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    return await response.json();
  }

  async getUserInfo(providerName: string, accessToken: string): Promise<OAuthUserInfo> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OAuth provider '${providerName}' not found`);
    }

    const response = await fetch(provider.userInfoEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const data = await response.json();

    if (providerName === 'google') {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture,
        provider: 'google'
      };
    } else if (providerName === 'github') {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);

      return {
        id: data.id.toString(),
        email: primaryEmail?.email || data.email,
        name: data.name || data.login,
        avatar: data.avatar_url,
        provider: 'github'
      };
    }

    throw new Error(`Unsupported OAuth provider: ${providerName}`);
  }

  getProvider(name: string): OAuthProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
