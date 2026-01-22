import { EventEmitter } from 'events';

export enum SyncMode {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual'
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export interface StateSyncConfig {
  enableAutoSync: boolean;
  syncInterval: number;
  conflictResolution: ConflictResolutionStrategy;
  enableHistory: boolean;
  maxHistorySize: number;
  enableCompression?: boolean;
}

export interface SyncOptions {
  conflictStrategy?: ConflictResolutionStrategy;
  syncMode?: SyncMode;
  priority?: 'low' | 'normal' | 'high';
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  status?: SyncStatus;
  conflictDetected?: boolean;
  conflict?: Conflict;
  resolvedState?: any;
}

export interface Conflict {
  type: string;
  currentVersion: number;
  newVersion: number;
  currentState: any;
  newState: any;
}

export interface SyncHistoryRecord {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  conflict?: Conflict;
  resolvedState: any;
  timestamp: Date;
}

export interface StateSnapshot {
  id: string;
  timestamp: Date;
  states: Map<string, any>;
}

export interface StateSyncMetrics {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  conflict: boolean;
  success: boolean;
}

export interface StateSyncErrorMetrics {
  syncId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  error: string;
}

export class StateSyncError extends Error {
  constructor(message: string, public metadata: any) {
    super(message);
    this.name = 'StateSyncError';
  }
}

export class StateStore {
  private store: Map<string, any> = new Map();

  async get(key: string): Promise<any> {
    return this.store.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getAll(): Promise<Map<string, any>> {
    return new Map(this.store);
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

export class ConflictResolver {
  async resolve(
    currentState: any,
    newState: any,
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.LAST_WRITE_WINS
  ): Promise<any> {
    switch (strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return this.resolveLastWriteWins(currentState, newState);
      
      case ConflictResolutionStrategy.FIRST_WRITE_WINS:
        return this.resolveFirstWriteWins(currentState, newState);
      
      case ConflictResolutionStrategy.MERGE:
        return await this.resolveMerge(currentState, newState);
      
      case ConflictResolutionStrategy.MANUAL:
        return await this.resolveManual(currentState, newState);
      
      default:
        throw new Error(`未知的冲突解决策略: ${strategy}`);
    }
  }

  private resolveLastWriteWins(currentState: any, newState: any): any {
    return newState;
  }

  private resolveFirstWriteWins(currentState: any, newState: any): any {
    return currentState;
  }

  private async resolveMerge(currentState: any, newState: any): Promise<any> {
    const merged = { ...currentState };

    for (const key in newState) {
      if (typeof newState[key] === 'object' && !Array.isArray(newState[key])) {
        merged[key] = await this.resolveMerge(currentState[key] || {}, newState[key]);
      } else {
        merged[key] = newState[key];
      }
    }

    return merged;
  }

  private async resolveManual(currentState: any, newState: any): Promise<any> {
    throw new Error('手动冲突解决需要人工干预');
  }
}

export class SyncScheduler {
  private scheduledSyncs: Map<string, NodeJS.Timeout> = new Map();
  private eventBus: EventEmitter;
  private isRunningFlag: boolean = false;

  constructor(eventBus: EventEmitter) {
    this.eventBus = eventBus;
  }

  scheduleSync(
    syncId: string,
    syncFn: () => Promise<void>,
    delay: number
  ): void {
    const timeout = setTimeout(async () => {
      try {
        await syncFn();
        this.scheduledSyncs.delete(syncId);
      } catch (error) {
        this.eventBus.emit('sync:error', { syncId, error });
      }
    }, delay);

    this.scheduledSyncs.set(syncId, timeout);
  }

  cancelSync(syncId: string): void {
    const timeout = this.scheduledSyncs.get(syncId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledSyncs.delete(syncId);
    }
  }

  cancelAllSyncs(): void {
    for (const [syncId, timeout] of this.scheduledSyncs.entries()) {
      clearTimeout(timeout);
    }
    this.scheduledSyncs.clear();
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  start(): void {
    this.isRunningFlag = true;
  }

  stop(): void {
    this.isRunningFlag = false;
    this.cancelAllSyncs();
  }
}

export class MonitoringService {
  private syncMetrics: StateSyncMetrics[] = [];
  private syncErrors: StateSyncErrorMetrics[] = [];
  private getModulesSize: () => number;

  constructor(getModulesSize: () => number = () => 0) {
    this.getModulesSize = getModulesSize;
  }

  recordStateSync(metrics: StateSyncMetrics): void {
    this.syncMetrics.push(metrics);
    
    if (this.syncMetrics.length > 1000) {
      this.syncMetrics = this.syncMetrics.slice(-1000);
    }
  }

  recordStateSyncError(metrics: StateSyncErrorMetrics): void {
    this.syncErrors.push(metrics);
    
    if (this.syncErrors.length > 1000) {
      this.syncErrors = this.syncErrors.slice(-1000);
    }
  }

  getMetrics(): {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictRate: number;
    averageDuration: number;
    registeredModules: number;
  } {
    const totalSyncs = this.syncMetrics.length;
    const successfulSyncs = this.syncMetrics.filter(m => m.success).length;
    const failedSyncs = this.syncErrors.length;
    const conflictRate = totalSyncs > 0
      ? this.syncMetrics.filter(m => m.conflict).length / totalSyncs
      : 0;
    const averageDuration = totalSyncs > 0
      ? this.syncMetrics.reduce((sum, m) => sum + m.duration, 0) / totalSyncs
      : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      conflictRate,
      averageDuration,
      registeredModules: this.getModulesSize()
    };
  }

  clear(): void {
    this.syncMetrics = [];
    this.syncErrors = [];
  }
}

export class StateSyncManager {
  private stateStore: StateStore;
  private conflictResolver: ConflictResolver;
  private syncScheduler: SyncScheduler;
  private monitoring: MonitoringService;
  private eventBus: EventEmitter;
  private config: StateSyncConfig;
  private modules: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor(config: StateSyncConfig) {
    this.config = config;
    this.stateStore = new StateStore();
    this.conflictResolver = new ConflictResolver();
    this.eventBus = new EventEmitter();
    this.syncScheduler = new SyncScheduler(this.eventBus);
    this.monitoring = new MonitoringService(() => this.modules.size);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.stateStore.clear();
    this.modules.clear();
    this.isInitialized = true;

    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    this.syncScheduler.stop();

    await this.clear();
    this.isInitialized = false;
  }

  async registerModule(moduleName: string, module: any): Promise<void> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', { moduleName });
    }

    if (this.modules.has(moduleName)) {
      throw new StateSyncError('模块已注册', { moduleName });
    }

    this.modules.set(moduleName, module);

    if (module.getState) {
      const state = await module.getState();
      await this.stateStore.set(moduleName, state);
    }
  }

  async unregisterModule(moduleName: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.modules.delete(moduleName);
    await this.stateStore.delete(moduleName);
  }

  async sync(sourceModule: string, targetModule: string, options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', { sourceModule, targetModule });
    }

    const source = this.modules.get(sourceModule);
    if (!source) {
      throw new StateSyncError('源模块不存在', { sourceModule });
    }

    const target = this.modules.get(targetModule);
    if (!target) {
      throw new StateSyncError('目标模块不存在', { targetModule });
    }

    const state = await source.getState();
    return await this.syncState(sourceModule, targetModule, state, options);
  }

  async syncAll(options: SyncOptions = {}): Promise<SyncResult[]> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', {});
    }

    const results: SyncResult[] = [];
    const moduleNames = Array.from(this.modules.keys());

    if (moduleNames.length === 0) {
      return results;
    }

    const sourceModule = moduleNames[0];

    for (let i = 1; i < moduleNames.length; i++) {
      try {
        const result = await this.sync(sourceModule, moduleNames[i], options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          syncId: this.generateSyncId(),
          sourceModule,
          targetModule: moduleNames[i],
          duration: 0,
          status: SyncStatus.FAILED,
          conflictDetected: false,
          resolvedState: null
        });
      }
    }

    return results;
  }

  async getModuleState(moduleName: string): Promise<any> {
    if (!this.isInitialized) {
      return null;
    }

    const state = await this.stateStore.get(moduleName);
    return state !== undefined ? state : null;
  }

  async setModuleState(moduleName: string, state: any): Promise<void> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', { moduleName });
    }

    await this.stateStore.set(moduleName, state);

    const module = this.modules.get(moduleName);
    if (module && module.setState) {
      await module.setState(state);
    }

    await this.publishStateChangeEvent(moduleName, state);
  }

  async createSnapshot(): Promise<StateSnapshot & { modules: any }> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', {});
    }

    const states = await this.stateStore.getAll();
    const modules: any = {};
    
    for (const [key, value] of states.entries()) {
      if (!key.startsWith('sync_history_') && !key.startsWith('dependencies_')) {
        modules[key] = value;
      }
    }

    return {
      id: this.generateSyncId(),
      timestamp: new Date(),
      states,
      modules
    };
  }

  async restoreSnapshot(snapshot: StateSnapshot | any): Promise<void> {
    if (!this.isInitialized) {
      throw new StateSyncError('管理器未初始化', {});
    }

    const states = snapshot.states || snapshot.modules || {};

    for (const [moduleName, state] of Object.entries(states)) {
      await this.stateStore.set(moduleName, state);

      const module = this.modules.get(moduleName);
      if (module && module.setState) {
        await module.setState(state);
      }
    }
  }

  async getSyncHistory(sourceModule?: string, targetModule?: string): Promise<SyncHistoryRecord[]> {
    if (!this.isInitialized) {
      return [];
    }

    const history: SyncHistoryRecord[] = [];
    const keys = await this.stateStore.getKeys();
    const historyKeys = keys.filter(key => key.startsWith('sync_history_'));

    for (const key of historyKeys) {
      const record = await this.stateStore.get(key);
      if (record) {
        history.push(record);
      }
    }

    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let filteredHistory = history;

    if (sourceModule) {
      filteredHistory = filteredHistory.filter(record => record.sourceModule === sourceModule);
    }

    if (targetModule) {
      filteredHistory = filteredHistory.filter(record => record.targetModule === targetModule);
    }

    if (this.config.maxHistorySize > 0) {
      return filteredHistory.slice(0, this.config.maxHistorySize);
    }

    return filteredHistory;
  }

  async resetMetrics(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.monitoring.clear();
  }

  private startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.syncScheduler.start();

    this.autoSyncInterval = setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        this.eventBus.emit('sync:error', { error });
      }
    }, this.config.syncInterval);
  }

  async syncState(
    sourceModule: string,
    targetModule: string,
    state: any,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const syncId = this.generateSyncId();

    try {
      const targetState = await this.stateStore.get(targetModule);

      const conflict = await this.detectConflict(targetState, state);

      let resolvedState = state;
      if (conflict) {
        resolvedState = await this.conflictResolver.resolve(
          targetState,
          state,
          options.conflictStrategy
        );
      }

      await this.stateStore.set(targetModule, resolvedState);

      const target = this.modules.get(targetModule);
      if (target && target.setState) {
        await target.setState(resolvedState);
      }

      await this.publishStateChangeEvent(targetModule, resolvedState);

      await this.recordSyncHistory({
        syncId,
        sourceModule,
        targetModule,
        conflict,
        resolvedState,
        timestamp: new Date()
      });

      const duration = Date.now() - startTime;

      this.monitoring.recordStateSync({
        syncId,
        sourceModule,
        targetModule,
        duration,
        conflict: !!conflict,
        success: true
      });

      return {
        success: true,
        syncId,
        sourceModule,
        targetModule,
        duration,
        status: SyncStatus.COMPLETED,
        conflictDetected: !!conflict,
        conflict,
        resolvedState
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.monitoring.recordStateSyncError({
        syncId,
        sourceModule,
        targetModule,
        duration,
        error: (error as Error).message
      });

      throw new StateSyncError(
        `状态同步失败: ${(error as Error).message}`,
        { syncId, sourceModule, targetModule }
      );
    }
  }

  async syncAllModules(
    sourceModule: string,
    state: any,
    options: SyncOptions = {}
  ): Promise<SyncResult[]> {
    const targetModules = await this.getDependentModules(sourceModule);

    return await Promise.all(
      targetModules.map(targetModule =>
        this.syncState(sourceModule, targetModule, state, options)
      )
    );
  }

  async scheduleSync(
    sourceModule: string,
    targetModule: string,
    state: any,
    delay: number,
    options: SyncOptions = {}
  ): Promise<string> {
    const syncId = this.generateSyncId();

    this.syncScheduler.scheduleSync(
      syncId,
      async () => {
        await this.syncState(sourceModule, targetModule, state, options);
      },
      delay
    );

    return syncId;
  }

  async getState(module: string): Promise<any> {
    return await this.stateStore.get(module);
  }

  async setState(module: string, state: any): Promise<void> {
    await this.stateStore.set(module, state);
    await this.publishStateChangeEvent(module, state);
  }

  async deleteState(module: string): Promise<void> {
    await this.stateStore.delete(module);
  }

  async getAllStates(): Promise<Map<string, any>> {
    return await this.stateStore.getAll();
  }

  async setDependencies(module: string, dependencies: string[]): Promise<void> {
    await this.stateStore.set(`dependencies_${module}`, dependencies);
  }

  async getDependencies(module: string): Promise<string[]> {
    return await this.stateStore.get(`dependencies_${module}`) || [];
  }

  onStateChange(module: string, handler: (state: any) => void): void {
    this.eventBus.on(`${module}.state.changed`, handler);
  }

  offStateChange(module: string, handler: (state: any) => void): void {
    this.eventBus.off(`${module}.state.changed`, handler);
  }

  getEventBus(): EventEmitter {
    return this.eventBus;
  }

  getMetrics() {
    return this.monitoring.getMetrics();
  }

  async clear(): Promise<void> {
    await this.stateStore.clear();
    this.syncScheduler.cancelAllSyncs();
    this.monitoring.clear();
  }

  private async detectConflict(
    currentState: any,
    newState: any
  ): Promise<Conflict | null> {
    if (!currentState || !newState) {
      return null;
    }

    const currentVersion = currentState.version || 0;
    const newVersion = newState.version || 0;

    if (currentVersion >= newVersion) {
      return {
        type: 'version_conflict',
        currentVersion,
        newVersion,
        currentState,
        newState
      };
    }

    return null;
  }

  private async publishStateChangeEvent(
    module: string,
    state: any
  ): Promise<void> {
    this.eventBus.emit(`${module}.state.changed`, {
      module,
      state,
      timestamp: new Date()
    });
  }

  private async recordSyncHistory(record: SyncHistoryRecord): Promise<void> {
    await this.stateStore.set(`sync_history_${record.syncId}`, record);
  }

  private async getDependentModules(module: string): Promise<string[]> {
    const dependencies = await this.stateStore.get(`dependencies_${module}`);
    return dependencies || [];
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
