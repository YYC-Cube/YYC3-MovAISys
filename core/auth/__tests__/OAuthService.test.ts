import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthService } from '../OAuthService';
import { OAuthConfig } from '../types';

describe('OAuthService', () => {
  let oauthService: OAuthService;
  let mockConfig: OAuthConfig;

  beforeEach(() => {
    mockConfig = {
      google: {
        clientId: 'test-google-client-id',
        clientSecret: 'test-google-client-secret'
      },
      github: {
        clientId: 'test-github-client-id',
        clientSecret: 'test-github-client-secret'
      },
      redirectUri: 'http://localhost:3000/callback'
    };

    oauthService = new OAuthService(mockConfig);
  });

  describe('generatePKCECodePair', () => {
    it('should generate a valid PKCE code pair', async () => {
      const codePair = await oauthService.generatePKCECodePair();

      expect(codePair).toHaveProperty('codeVerifier');
      expect(codePair).toHaveProperty('codeChallenge');
      expect(codePair).toHaveProperty('codeChallengeMethod');
      expect(codePair.codeChallengeMethod).toBe('S256');
      expect(codePair.codeVerifier).toHaveLength(256);
      expect(codePair.codeChallenge).toBeTruthy();
    });

    it('should generate unique code pairs', async () => {
      const codePair1 = await oauthService.generatePKCECodePair();
      const codePair2 = await oauthService.generatePKCECodePair();

      expect(codePair1.codeVerifier).not.toBe(codePair2.codeVerifier);
      expect(codePair1.codeChallenge).not.toBe(codePair2.codeChallenge);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL for Google', () => {
      const state = 'test-state';
      const codeChallenge = 'test-challenge';
      const url = oauthService.getAuthorizationUrl('google', state, codeChallenge);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-google-client-id');
      expect(url).toContain('redirect_uri=' + encodeURIComponent('http://localhost:3000/callback'));
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+profile+email');
      expect(url).toContain('state=test-state');
      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('should generate correct authorization URL for GitHub', () => {
      const state = 'test-state';
      const codeChallenge = 'test-challenge';
      const url = oauthService.getAuthorizationUrl('github', state, codeChallenge);

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-github-client-id');
      expect(url).toContain('redirect_uri=' + encodeURIComponent('http://localhost:3000/callback'));
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=read%3Auser+user%3Aemail');
      expect(url).toContain('state=test-state');
      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        oauthService.getAuthorizationUrl('unsupported', 'state', 'challenge');
      }).toThrow("OAuth provider 'unsupported' not found");
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      const providers = oauthService.getAvailableProviders();

      expect(providers).toContain('google');
      expect(providers).toContain('github');
      expect(providers).toHaveLength(2);
    });
  });

  describe('getProvider', () => {
    it('should return Google provider', () => {
      const provider = oauthService.getProvider('google');

      expect(provider).toBeDefined();
      expect(provider?.name).toBe('google');
      expect(provider?.clientId).toBe('test-google-client-id');
    });

    it('should return GitHub provider', () => {
      const provider = oauthService.getProvider('github');

      expect(provider).toBeDefined();
      expect(provider?.name).toBe('github');
      expect(provider?.clientId).toBe('test-github-client-id');
    });

    it('should return undefined for unsupported provider', () => {
      const provider = oauthService.getProvider('unsupported');

      expect(provider).toBeUndefined();
    });
  });
});
