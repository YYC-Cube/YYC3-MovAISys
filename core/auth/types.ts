export interface OAuthProvider {
  name: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
  };
  redirectUri: string;
}

export interface PKCECodePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}
