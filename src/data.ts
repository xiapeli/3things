import type { AppData, CollectionName } from "./types";

export const EMPTY_DATA: AppData = {
  priorities: [],
  okrs: [],
  backlogItems: [],
  profile: null,
};

const COLLECTIONS: CollectionName[] = ["priorities", "okrs", "backlogItems"];
const MAX_TEXT = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validEntity(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return false;
  if (!value.id || value.id.length > 200 || value.title.length > MAX_TEXT) return false;
  return JSON.stringify(value).length <= 500_000;
}

export function parseAppData(value: unknown): AppData {
  if (!isRecord(value)) throw new Error("Dados inválidos.");
  const data: AppData = {
    priorities: value.priorities,
    okrs: value.okrs,
    backlogItems: value.backlogItems,
    profile: value.profile === null || value.profile === undefined ? null : value.profile,
  } as AppData;
  for (const collection of COLLECTIONS) {
    const items = value[collection];
    if (!Array.isArray(items) || items.length > 10_000 || !items.every(validEntity)) {
      throw new Error("Dados inválidos.");
    }
  }
  if (data.profile && (!isRecord(data.profile) || typeof data.profile.full_name !== "string" || typeof data.profile.email !== "string")) {
    throw new Error("Perfil inválido.");
  }
  return data;
}

export function hasContent(data: AppData): boolean {
  return !!data.profile || COLLECTIONS.some((collection) => data[collection].length > 0);
}

export function mergeAppData(local: AppData, remote: AppData): AppData {
  const merged = {
    priorities: [],
    okrs: [],
    backlogItems: [],
    profile: local.profile ?? remote.profile,
  } as AppData;
  for (const collection of COLLECTIONS) {
    const items = new Map<string, AppData[typeof collection][number]>();
    for (const item of [...remote[collection], ...local[collection]]) {
      const previous = items.get(item.id);
      if (!previous || item.updated_date >= previous.updated_date) items.set(item.id, item);
    }
    merged[collection] = [...items.values()] as never;
  }
  return merged;
}
