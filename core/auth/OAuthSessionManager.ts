import { OAuthUserInfo, OAuthTokenResponse } from './types';

export interface OAuthSession {
  sessionId: string;
  provider: string;
  userId: string;
  userInfo: OAuthUserInfo;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  createdAt: number;
}

export class OAuthSessionManager {
  private sessions: Map<string, OAuthSession> = new Map();
  private readonly SESSION_TTL = 30 * 60 * 1000; // 30分钟

  createSession(
    provider: string,
    userId: string,
    userInfo: OAuthUserInfo,
    tokenResponse: OAuthTokenResponse
  ): OAuthSession {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const session: OAuthSession = {
      sessionId,
      provider,
      userId,
      userInfo,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: now + tokenResponse.expires_in * 1000,
      createdAt: now
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): OAuthSession | undefined {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return undefined;
    }

    if (this.isSessionExpired(session)) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  updateSession(sessionId: string, tokenResponse: OAuthTokenResponse): OAuthSession | undefined {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return undefined;
    }

    session.accessToken = tokenResponse.access_token;
    session.refreshToken = tokenResponse.refresh_token;
    session.expiresAt = Date.now() + tokenResponse.expires_in * 1000;

    return session;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  deleteSessionsByUserId(userId: string): number {
    let count = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  private isSessionExpired(session: OAuthSession): boolean {
    return Date.now() > session.expiresAt;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  cleanupExpiredSessions(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getUserSessions(userId: string): OAuthSession[] {
    const sessions: OAuthSession[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !this.isSessionExpired(session)) {
        sessions.push(session);
      }
    }

    return sessions;
  }
}
