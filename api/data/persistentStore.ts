import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Stall,
  ProductBatch,
  InspectionReport,
  PatrolRecord,
  VendorUser,
  AdminUser,
} from '../../shared/types.js';
import { seedStalls, seedProductBatches, seedInspectionReports, seedPatrolRecords, seedVendorUsers, seedAdminUsers } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'trace-data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'trace-data-backup.json');

export interface StoreData {
  stalls: Stall[];
  productBatches: ProductBatch[];
  inspectionReports: InspectionReport[];
  patrolRecords: PatrolRecord[];
  vendorUsers: VendorUser[];
  adminUsers: AdminUser[];
  lastModified: string;
  version: number;
}

let inMemoryStore: StoreData;
let storeVersion = 0;
let saveTimeout: NodeJS.Timeout | null = null;
let lastSaveTime = 0;

const DEBOUNCE_MS = 500;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStoreFromFile(): StoreData | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as StoreData;
      if (data && Array.isArray(data.stalls) && Array.isArray(data.productBatches)) {
        console.log(`[PersistentStore] 从文件加载数据成功，版本 ${data.version}`);
        return data;
      }
    }
  } catch (e) {
    console.warn('[PersistentStore] 读取数据文件失败，尝试从备份恢复:', (e as Error).message);
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const data = JSON.parse(raw) as StoreData;
        console.log('[PersistentStore] 从备份文件恢复成功');
        return data;
      }
    } catch (e2) {
      console.error('[PersistentStore] 备份文件也读取失败:', (e2 as Error).message);
    }
  }
  return null;
}

function saveStoreToFile(): void {
  try {
    ensureDataDir();

    if (fs.existsSync(DATA_FILE) && Date.now() - lastSaveTime > 30000) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }

    inMemoryStore.lastModified = new Date().toISOString();
    inMemoryStore.version = storeVersion;

    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(inMemoryStore, null, 2), 'utf-8');

    if (fs.existsSync(tmpFile)) {
      fs.renameSync(tmpFile, DATA_FILE);
    }

    lastSaveTime = Date.now();
    console.log(`[PersistentStore] 数据已持久化，版本 ${storeVersion}`);
  } catch (e) {
    console.error('[PersistentStore] 持久化失败:', (e as Error).message);
  }
}

function scheduleSave(): void {
  storeVersion++;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveStoreToFile();
    saveTimeout = null;
  }, DEBOUNCE_MS);
}

function createSeedData(): StoreData {
  return {
    stalls: [...seedStalls],
    productBatches: [...seedProductBatches],
    inspectionReports: [...seedInspectionReports],
    patrolRecords: [...seedPatrolRecords],
    vendorUsers: [...seedVendorUsers],
    adminUsers: [...seedAdminUsers],
    lastModified: new Date().toISOString(),
    version: 1,
  };
}

export function initStore(): void {
  const loaded = loadStoreFromFile();

  if (loaded) {
    inMemoryStore = loaded;
    storeVersion = loaded.version || 1;
  } else {
    console.log('[PersistentStore] 未找到数据文件，使用种子数据初始化');
    inMemoryStore = createSeedData();
    saveStoreToFile();
  }

  process.on('SIGINT', () => {
    console.log('[PersistentStore] 进程退出，立即保存数据...');
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveStoreToFile();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveStoreToFile();
    process.exit(0);
  });
}

export function getStalls(): Stall[] {
  return inMemoryStore.stalls;
}

export function getProductBatches(): ProductBatch[] {
  return inMemoryStore.productBatches;
}

export function getInspectionReports(): InspectionReport[] {
  return inMemoryStore.inspectionReports;
}

export function getPatrolRecords(): PatrolRecord[] {
  return inMemoryStore.patrolRecords;
}

export function getVendorUsers(): VendorUser[] {
  return inMemoryStore.vendorUsers;
}

export function getAdminUsers(): AdminUser[] {
  return inMemoryStore.adminUsers;
}

export function addProductBatch(batch: ProductBatch): void {
  inMemoryStore.productBatches.unshift(batch);
  scheduleSave();
}

export function addInspectionReport(report: InspectionReport): void {
  inMemoryStore.inspectionReports.unshift(report);
  scheduleSave();
}

export function addPatrolRecord(record: PatrolRecord): void {
  inMemoryStore.patrolRecords.unshift(record);
  scheduleSave();
}

export function updateBatch(batchId: string, updates: Partial<ProductBatch>): ProductBatch | undefined {
  const idx = inMemoryStore.productBatches.findIndex(b => b.id === batchId);
  if (idx !== -1) {
    inMemoryStore.productBatches[idx] = { ...inMemoryStore.productBatches[idx], ...updates };
    scheduleSave();
    return inMemoryStore.productBatches[idx];
  }
  return undefined;
}

export function updateBatchInspectionStatus(batchId: string, status: 'pending' | 'passed' | 'failed'): void {
  const batch = inMemoryStore.productBatches.find(b => b.id === batchId);
  if (batch) {
    batch.inspectionStatus = status;
    scheduleSave();
  }
}

export function deductBatchStock(batchId: string, amount: number): ProductBatch | undefined {
  const batch = inMemoryStore.productBatches.find(b => b.id === batchId);
  if (batch) {
    batch.remainingStock -= amount;
    scheduleSave();
    return batch;
  }
  return undefined;
}

export function setBatchStock(batchId: string, remainingStock: number): ProductBatch | undefined {
  const batch = inMemoryStore.productBatches.find(b => b.id === batchId);
  if (batch) {
    batch.remainingStock = remainingStock;
    scheduleSave();
    return batch;
  }
  return undefined;
}

export function resetToSeedData(): void {
  inMemoryStore = createSeedData();
  scheduleSave();
  console.log('[PersistentStore] 已重置为种子数据');
}

export function getStoreInfo(): { version: number; lastModified: string; stallCount: number; batchCount: number } {
  return {
    version: storeVersion,
    lastModified: inMemoryStore.lastModified,
    stallCount: inMemoryStore.stalls.length,
    batchCount: inMemoryStore.productBatches.length,
  };
}
