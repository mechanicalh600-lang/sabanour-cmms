
export interface User {
  name: string;
  code: string;
  org: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  lastMaintained?: string;
}

export interface Activity {
  code: string;
  name: string; // Persian description e.g. "بازرسی روزانه"
  equipmentTag: string;
  planCode?: string; // Added PlanCode from scheduling
}

export enum InspectionStatus {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  NA = 'NA'
}

export interface ChecklistItemData {
  id: string;
  task: string;
  description?: string;
  status: InspectionStatus;
  comment: string;
  photo?: File | null;
  video?: File | null;
}

export interface InspectionForm {
  equipmentId: string;
  equipmentName: string;
  activityName?: string; // Added selected activity name
  timestamp: number;
  inspectorName: string;
  inspectorCode: string;
  items: ChecklistItemData[];
}

export interface GeneratedTask {
  task: string;
  description: string;
}

export interface AssetSchedule {
  jobCardName: string;
  jobCardCode: string;
  assetNumber: string;
  planCode: string;
}
