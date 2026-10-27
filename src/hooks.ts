import { useSyncExternalStore } from "react";
import { store } from "./store";
import { sync } from "./sync";
import type { AppData, CollectionEntity, CollectionName } from "./types";

export function useData(): AppData {
  return useSyncExternalStore(store.subscribe, store.get);
}

export function useCollection<K extends CollectionName>(collection: K): CollectionEntity[K][] {
  return useData()[collection] as CollectionEntity[K][];
}

export function useSync() {
  return useSyncExternalStore(sync.subscribe, sync.get);
}
