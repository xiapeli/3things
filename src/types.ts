export type PriorityStatus = "not_started" | "in_progress" | "completed";
export type PriorityScope = "individual" | "team";
export type PriorityFlexibility = "fixed" | "negotiable" | "flexible";
export type ImpactLevel = "low" | "medium" | "high";
export type OkrPeriod = "monthly" | "quarterly" | "semi_annual" | "annual";
export type OkrColor = "yellow" | "red" | "blue" | "green" | "purple";

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Priority {
  id: string;
  title: string;
  description: string;
  context?: string;
  success_criteria?: string;
  expected_outcome?: string;
  obstacles?: string;
  required_resources?: string;
  stakeholders?: string;
  deadline?: string;
  estimated_hours?: number;
  week_start: string;
  status: PriorityStatus;
  okr_connection?: string | null;
  impact_level: ImpactLevel;
  position: 1 | 2 | 3;
  lessons_learned?: string;
  completion_notes?: string;
  scope: PriorityScope;
  flexibility: PriorityFlexibility;
  milestones: Milestone[];
  created_date: string;
  updated_date: string;
  created_by?: string;
}

export interface KeyResult {
  id: string;
  description: string;
  target: string;
  unit: string;
  current: number;
  completed: boolean;
}

export interface OKR {
  id: string;
  title: string;
  key_results: KeyResult[];
  period: OkrPeriod;
  target_date: string;
  progress: number;
  color: OkrColor;
  created_date: string;
  updated_date: string;
}

export type BacklogCategory =
  | "idea"
  | "task"
  | "improvement"
  | "bug"
  | "feature"
  | "meeting"
  | "research"
  | "other";
export type BacklogPriorityLevel = "urgent" | "this_month" | "next_month" | "someday";
export type BacklogStatus = "captured" | "reviewing" | "approved" | "discarded" | "promoted";
export type BacklogEffort = "unknown" | "small" | "medium" | "large";

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  category: BacklogCategory;
  priority_level: BacklogPriorityLevel;
  tags: string[];
  estimated_effort: BacklogEffort;
  source?: string;
  status: BacklogStatus;
  promoted_to_priority?: boolean;
  promoted_date?: string;
  review_notes?: string;
  created_date: string;
  updated_date: string;
}

export interface Profile {
  full_name: string;
  email: string;
  member_since: string;
}

export interface AppData {
  priorities: Priority[];
  okrs: OKR[];
  backlogItems: BacklogItem[];
  profile: Profile | null;
}

export type CollectionName = "priorities" | "okrs" | "backlogItems";
export type CollectionEntity = {
  priorities: Priority;
  okrs: OKR;
  backlogItems: BacklogItem;
};
