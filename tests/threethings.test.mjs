import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadModule(relative) {
  const sourceUrl = new URL(relative, import.meta.url);
  const source = await readFile(sourceUrl, "utf8");
  let compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const match of [...compiled.matchAll(/from "(\.[^"]+)"/g)]) {
    const dependencyUrl = new URL(`${match[1]}.ts`, sourceUrl);
    const dependency = await loadModule(dependencyUrl.href);
    compiled = compiled.replaceAll(match[0], `from "${dependency.url}"`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
  const module = await import(url);
  return Object.assign({}, module, { url });
}

const dates = await loadModule("../src/utils/dates.ts");
const progress = await loadModule("../src/utils/progress.ts");
const { store } = await loadModule("../src/store.ts");
const dataUtils = await loadModule("../src/data.ts");

test("mondayOf encontra a segunda da semana, inclusive no domingo", () => {
  assert.equal(dates.mondayOf(new Date(2025, 6, 7)), "2025-07-07");
  assert.equal(dates.mondayOf(new Date(2025, 6, 13)), "2025-07-07");
  assert.equal(dates.mondayOf(new Date(2025, 6, 6)), "2025-06-30");
  assert.equal(dates.mondayOf(new Date(2026, 0, 1)), "2025-12-29");
});

test("shiftWeek e weekEnd navegam semanas atravessando meses", () => {
  assert.equal(dates.shiftWeek("2025-07-07", 1), "2025-07-14");
  assert.equal(dates.shiftWeek("2025-07-07", -1), "2025-06-30");
  assert.equal(dates.shiftWeek("2025-07-28", 1), "2025-08-04");
  assert.equal(dates.weekEnd("2025-07-07"), "2025-07-13");
});

test("rótulos de data seguem o formato do app", () => {
  assert.equal(dates.weekLabel("2025-07-07"), "07/07 - 13/07");
  assert.equal(dates.formatDayMonth("2025-07-08"), "08/07");
  assert.equal(dates.formatFullDate("2025-07-08"), "08/07/2025");
});

test("progresso de marcos lida com vazio e parciais", () => {
  const empty = { milestones: [] };
  assert.equal(progress.milestonePercent(empty), 0);
  const priority = {
    milestones: [
      { completed: true },
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: false },
    ],
  };
  assert.equal(progress.milestonePercent(priority), 60);
  assert.deepEqual(progress.milestoneCounts(priority), { done: 3, total: 5 });
});

test("estatísticas da semana e de todos os marcos", () => {
  const priorities = [
    { status: "completed", milestones: [{ completed: true }, { completed: true }] },
    { status: "in_progress", milestones: [{ completed: true }, { completed: false }] },
    { status: "not_started", milestones: [{ completed: false }, { completed: false }] },
  ];
  assert.deepEqual(progress.weekStats(priorities), {
    total: 3,
    completed: 1,
    inProgress: 1,
    percent: 33,
  });
  assert.deepEqual(progress.allMilestonesStats(priorities), { done: 3, total: 6, percent: 50 });
  assert.equal(progress.completionRate(priorities), 33);
  assert.equal(progress.completionRate([]), 0);
});

test("progresso de OKR usa key results concluídos", () => {
  const okr = {
    key_results: [
      { completed: true },
      { completed: false },
      { completed: false },
      { completed: false },
    ],
  };
  assert.equal(progress.okrPercent(okr), 25);
  assert.equal(progress.okrPercent({ key_results: [] }), 0);
});

test("store cria, atualiza, remove e preserva campos locais", () => {
  const priority = store.create("priorities", {
    title: "Prioridade teste",
    week_start: "2025-07-07",
    status: "not_started",
    position: 1,
    milestones: [],
  });
  assert.ok(priority.id.startsWith("priorities-"));
  assert.ok(priority.created_date);
  store.update("priorities", priority.id, { status: "completed" });
  const updated = store.list("priorities").find((p) => p.id === priority.id);
  assert.equal(updated.status, "completed");
  assert.equal(updated.title, "Prioridade teste");
  assert.ok(updated.updated_date >= priority.updated_date);
  store.remove("priorities", priority.id);
  assert.equal(store.list("priorities").some((p) => p.id === priority.id), false);
});

test("export/import faz roundtrip e rejeita arquivo inválido", () => {
  const okr = store.create("okrs", {
    title: "OKR teste",
    key_results: [],
    period: "quarterly",
    target_date: "2026-12-31",
    progress: 0,
    color: "blue",
  });
  store.setProfile({ full_name: "QA", email: "qa@example.invalid", member_since: "2026-01-01" });
  const backup = store.exportJson();
  const parsed = JSON.parse(backup);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.okrs.some((o) => o.id === okr.id), true);
  assert.equal(parsed.profile.full_name, "QA");
  store.importJson(backup);
  assert.equal(store.list("okrs").some((o) => o.id === okr.id), true);
  assert.throws(() => store.importJson('{"priorities":[{"noId":true}]}'), /inválido/);
  assert.throws(() => store.importJson("not json"), SyntaxError);
  store.importJson('{"priorities":[],"okrs":[],"backlogItems":[],"profile":null}');
  assert.equal(store.list("okrs").length, 0);
});

test("clearHistory esvazia prioridades mas preserva OKRs e backlog", () => {
  store.importJson('{"priorities":[],"okrs":[],"backlogItems":[],"profile":null}');
  store.create("priorities", { title: "P", week_start: "2025-07-07", status: "not_started", position: 1, milestones: [] });
  store.create("okrs", { title: "O", key_results: [], period: "annual", target_date: "2026-12-31", progress: 0, color: "red" });
  store.create("backlogItems", { title: "B", category: "idea", priority_level: "someday", tags: [], estimated_effort: "unknown", status: "captured" });
  store.clearHistory();
  assert.equal(store.list("priorities").length, 0);
  assert.equal(store.list("okrs").length, 1);
  assert.equal(store.list("backlogItems").length, 1);
  store.importJson('{"priorities":[],"okrs":[],"backlogItems":[],"profile":null}');
});

test("byPosition encontra a prioridade na posição correta", () => {
  const priorities = [{ position: 1, title: "a" }, { position: 3, title: "c" }];
  assert.equal(progress.byPosition(priorities, 1).title, "a");
  assert.equal(progress.byPosition(priorities, 2), undefined);
  assert.equal(progress.byPosition(priorities, 3).title, "c");
});

test("validação da nuvem rejeita coleções ausentes e entidades malformadas", () => {
  assert.equal(dataUtils.parseAppData({ priorities: [], okrs: [], backlogItems: [], profile: null }).priorities.length, 0);
  assert.throws(() => dataUtils.parseAppData({ priorities: [{}], okrs: [], backlogItems: [], profile: null }), /inválidos/);
  assert.throws(() => dataUtils.parseAppData({ priorities: "not-an-array", okrs: [], backlogItems: [] }), /inválidos/);
});

test("merge preserva itens únicos e escolhe a revisão mais recente do mesmo item", () => {
  const local = dataUtils.parseAppData({
    priorities: [
      { id: "shared", title: "local novo", updated_date: "2026-02-01" },
      { id: "local", title: "só local", updated_date: "2026-01-01" },
    ],
    okrs: [], backlogItems: [], profile: null,
  });
  const remote = dataUtils.parseAppData({
    priorities: [
      { id: "shared", title: "remoto antigo", updated_date: "2026-01-01" },
      { id: "remote", title: "só remoto", updated_date: "2026-01-01" },
    ],
    okrs: [], backlogItems: [], profile: null,
  });
  const merged = dataUtils.mergeAppData(local, remote);
  assert.equal(merged.priorities.length, 3);
  assert.equal(merged.priorities.find((item) => item.id === "shared").title, "local novo");
  assert.equal(dataUtils.hasContent(merged), true);
});

test("backup exportado contém dados, nunca sessão ou token", () => {
  store.importJson('{"priorities":[],"okrs":[],"backlogItems":[],"profile":null}');
  store.setProfile({ full_name: "Sem segredos", email: "local@example.invalid", member_since: "2026-01-01" });
  const backup = store.exportJson();
  assert.equal(JSON.parse(backup).profile.full_name, "Sem segredos");
  assert.equal("token" in JSON.parse(backup), false);
  assert.equal("session" in JSON.parse(backup), false);
  store.importJson('{"priorities":[],"okrs":[],"backlogItems":[],"profile":null}');
});
