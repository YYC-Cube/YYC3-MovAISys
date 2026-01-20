import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthSessionManager } from '../OAuthSessionManager';
import { OAuthUserInfo, OAuthTokenResponse } from '../types';

describe('OAuthSessionManager', () => {
  let sessionManager: OAuthSessionManager;
  let mockUserInfo: OAuthUserInfo;
  let mockTokenResponse: OAuthTokenResponse;

  beforeEach(() => {
    sessionManager = new OAuthSessionManager();

    mockUserInfo = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'google'
    };

    mockTokenResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'test-refresh-token'
    };
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = sessionManager.createSession(
        'google',
        'google_test-user-id',
        mockUserInfo,
        mockTokenResponse
      );

      expect(session).toBeDefined();
      expect(session.sessionId).toBeTruthy();
      expect(session.provider).toBe('google');
      expect(session.userId).toBe('google_test-user-id');
      expect(session.userInfo).toEqual(mockUserInfo);
      expect(session.accessToken).toBe('test-access-token');
      expect(session.refreshToken).toBe('test-refresh-token');
      expect(session.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should create unique session IDs', () => {
      const session1 = sessionManager.createSession('google', 'user1', mockUserInfo, mockTokenResponse);
      const session2 = sessionManager.createSession('google', 'user2', mockUserInfo, mockTokenResponse);

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('getSession', () => {
    it('should return existing session', () => {
      const createdSession = sessionManager.createSession(
        'google',
        'google_test-user-id',
        mockUserInfo,
        mockTokenResponse
      );

      const retrievedSession = sessionManager.getSession(createdSession.sessionId);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.sessionId).toBe(createdSession.sessionId);
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent-session-id');

      expect(session).toBeUndefined();
    });

    it('should return undefined for expired session', () => {
      const expiredTokenResponse: OAuthTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: -1 // 立即过期
      };

      const createdSession = sessionManager.createSession(
        'google',
        'google_test-user-id',
        mockUserInfo,
        expiredTokenResponse
      );

      const retrievedSession = sessionManager.getSession(createdSession.sessionId);

      expect(retrievedSession).toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session with new tokens', async () => {
      const createdSession = sessionManager.createSession(
        'google',
        'google_test-user-id',
        mockUserInfo,
        mockTokenResponse
      );

      const newTokenResponse: OAuthTokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 7200,
        refresh_token: 'new-refresh-token'
      };

      await new Promise(resolve => setTimeout(resolve, 1)); // 确保时间戳不同

      const updatedSession = sessionManager.updateSession(
        createdSession.sessionId,
        newTokenResponse
      );

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.accessToken).toBe('new-access-token');
      expect(updatedSession?.refreshToken).toBe('new-refresh-token');
      expect(updatedSession?.expiresAt).toBeGreaterThanOrEqual(createdSession.expiresAt);
    });

    it('should return undefined for non-existent session', () => {
      const updatedSession = sessionManager.updateSession(
        'non-existent-session-id',
        mockTokenResponse
      );

      expect(updatedSession).toBeUndefined();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const createdSession = sessionManager.createSession(
        'google',
        'google_test-user-id',
        mockUserInfo,
        mockTokenResponse
      );

      const deleted = sessionManager.deleteSession(createdSession.sessionId);

      expect(deleted).toBe(true);

      const retrievedSession = sessionManager.getSession(createdSession.sessionId);
      expect(retrievedSession).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionManager.deleteSession('non-existent-session-id');

      expect(deleted).toBe(false);
    });
  });

  describe('deleteSessionsByUserId', () => {
    it('should delete all sessions for a user', () => {
      const session1 = sessionManager.createSession('google', 'user1', mockUserInfo, mockTokenResponse);
      const session2 = sessionManager.createSession('github', 'user1', mockUserInfo, mockTokenResponse);
      const session3 = sessionManager.createSession('google', 'user2', mockUserInfo, mockTokenResponse);

      const deletedCount = sessionManager.deleteSessionsByUserId('user1');

      expect(deletedCount).toBe(2);

      expect(sessionManager.getSession(session1.sessionId)).toBeUndefined();
      expect(sessionManager.getSession(session2.sessionId)).toBeUndefined();
      expect(sessionManager.getSession(session3.sessionId)).toBeDefined();
    });

    it('should return 0 for user with no sessions', () => {
      const deletedCount = sessionManager.deleteSessionsByUserId('non-existent-user');

      expect(deletedCount).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const validTokenResponse: OAuthTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      const expiredTokenResponse: OAuthTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: -1
      };

      const validSession = sessionManager.createSession('google', 'user1', mockUserInfo, validTokenResponse);
      const expiredSession = sessionManager.createSession('google', 'user2', mockUserInfo, expiredTokenResponse);

      const cleanedCount = sessionManager.cleanupExpiredSessions();

      expect(cleanedCount).toBe(1);
      expect(sessionManager.getSession(validSession.sessionId)).toBeDefined();
      expect(sessionManager.getSession(expiredSession.sessionId)).toBeUndefined();
    });
  });

  describe('getSessionCount', () => {
    it('should return correct session count', () => {
      expect(sessionManager.getSessionCount()).toBe(0);

      sessionManager.createSession('google', 'user1', mockUserInfo, mockTokenResponse);
      expect(sessionManager.getSessionCount()).toBe(1);

      sessionManager.createSession('github', 'user2', mockUserInfo, mockTokenResponse);
      expect(sessionManager.getSessionCount()).toBe(2);
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', () => {
      const session1 = sessionManager.createSession('google', 'user1', mockUserInfo, mockTokenResponse);
      const session2 = sessionManager.createSession('github', 'user1', mockUserInfo, mockTokenResponse);
      const session3 = sessionManager.createSession('google', 'user2', mockUserInfo, mockTokenResponse);

      const userSessions = sessionManager.getUserSessions('user1');

      expect(userSessions).toHaveLength(2);
      expect(userSessions.map(s => s.sessionId)).toContain(session1.sessionId);
      expect(userSessions.map(s => s.sessionId)).toContain(session2.sessionId);
      expect(userSessions.map(s => s.sessionId)).not.toContain(session3.sessionId);
    });

    it('should return empty array for user with no sessions', () => {
      const userSessions = sessionManager.getUserSessions('non-existent-user');

      expect(userSessions).toHaveLength(0);
    });
  });
});
