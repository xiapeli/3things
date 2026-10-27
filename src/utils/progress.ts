import type { OKR, Priority } from "../types";

export function milestonePercent(priority: Priority): number {
  const milestones = priority.milestones ?? [];
  if (milestones.length === 0) return 0;
  return (milestones.filter((m) => m.completed).length / milestones.length) * 100;
}

export function milestoneCounts(priority: Priority): { done: number; total: number } {
  const milestones = priority.milestones ?? [];
  return { done: milestones.filter((m) => m.completed).length, total: milestones.length };
}

export function weekStats(priorities: Priority[]) {
  const total = priorities.length;
  const completed = priorities.filter((p) => p.status === "completed").length;
  const inProgress = priorities.filter((p) => p.status === "in_progress").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, percent };
}

export function allMilestonesStats(priorities: Priority[]) {
  const done = priorities.reduce(
    (sum, p) => sum + (p.milestones ?? []).filter((m) => m.completed).length,
    0,
  );
  const total = priorities.reduce((sum, p) => sum + (p.milestones ?? []).length, 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

export function okrPercent(okr: OKR): number {
  const results = okr.key_results ?? [];
  if (results.length === 0) return 0;
  return Math.round((results.filter((kr) => kr.completed).length / results.length) * 100);
}

export function completionRate(priorities: Priority[]): number {
  if (priorities.length === 0) return 0;
  return Math.round(
    (priorities.filter((p) => p.status === "completed").length / priorities.length) * 100,
  );
}

export function byPosition(priorities: Priority[], position: 1 | 2 | 3): Priority | undefined {
  return priorities.find((p) => p.position === position);
}
