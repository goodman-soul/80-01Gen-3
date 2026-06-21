export type CreditRating = 'A' | 'B' | 'C';
export type InspectionStatus = 'pending' | 'passed' | 'failed';
export type PatrolStatus = 'normal' | 'warning' | 'rectified';
export type UserRole = 'vendor' | 'admin' | 'consumer';

export interface Stall {
  id: string;
  stallNo: string;
  name: string;
  category: string;
  vendorName: string;
  vendorPhone: string;
  location: string;
  creditRating: CreditRating;
  createdAt: string;
}

export interface ProductBatch {
  id: string;
  batchNo: string;
  stallId: string;
  productName: string;
  origin: string;
  supplier: string;
  quantity: number;
  unit: string;
  productionDate: string;
  shelfLifeDays: number;
  purchaseDate: string;
  traceCode: string;
  inspectionStatus: InspectionStatus;
  remainingStock: number;
  isNearExpiry: boolean;
}

export interface InspectionItem {
  name: string;
  result: 'pass' | 'fail';
  value?: string;
}

export interface InspectionReport {
  id: string;
  batchId: string;
  inspector: string;
  inspectionDate: string;
  items: InspectionItem[];
  overall: 'pass' | 'fail';
  reportUrl?: string;
  remarks?: string;
}

export interface PatrolRecord {
  id: string;
  adminId: string;
  adminName: string;
  batchId: string;
  stallId: string;
  patrolTime: string;
  findings: string;
  actions?: string;
  status: PatrolStatus;
}

export interface TraceRecord {
  timestamp: string;
  action: string;
  operator: string;
  description: string;
  icon?: string;
}

export interface VendorUser {
  id: string;
  username: string;
  password: string;
  stallId: string;
  name: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    stallId?: string;
  };
}

export interface CreateBatchDto {
  stallId: string;
  productName: string;
  origin: string;
  supplier: string;
  quantity: number;
  unit: string;
  productionDate: string;
  shelfLifeDays: number;
}

export interface CreateInspectionDto {
  batchId: string;
  inspector: string;
  items: InspectionItem[];
  overall: 'pass' | 'fail';
  remarks?: string;
}

export interface CreatePatrolDto {
  adminId: string;
  adminName: string;
  batchId: string;
  stallId: string;
  findings: string;
  actions?: string;
  status: PatrolStatus;
}

export interface DeductInventoryDto {
  amount: number;
}

export interface StallWithMask extends Omit<Stall, 'vendorPhone'> {
  vendorNameMasked: string;
}

export interface BatchTraceDetail {
  batch: ProductBatch;
  stall: Stall;
  inspections: InspectionReport[];
  patrolRecords: PatrolRecord[];
  traceChain: TraceRecord[];
}

export interface DashboardStats {
  todayBatches: number;
  totalStock: number;
  nearExpiryCount: number;
  inspectionPassRate: number;
  recentBatches: ProductBatch[];
}
