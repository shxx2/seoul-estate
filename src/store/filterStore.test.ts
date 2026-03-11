import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { useFilterStore } from "./filterStore";
import { DEFAULT_FILTER } from "@/types/filter";

beforeEach(() => {
  useFilterStore.setState({ ...DEFAULT_FILTER });
});

test("default filters sort results by lowest price first", () => {
  const state = useFilterStore.getState();

  assert.equal(state.sortBy, "price_asc");
});

test("setFilter updates the requested page value", () => {
  useFilterStore.getState().setFilter("page", 3);

  assert.equal(useFilterStore.getState().page, 3);
});

test("submitSearch snapshots the current draft filters into applied filters", () => {
  const store = useFilterStore.getState();
  store.setFilter("guCode", "1120000000");
  store.toggleTradeType("JEONSE");
  store.setFilter("depositRange", [0, 70500]);
  store.setFilter("page", 4);

  const state = useFilterStore.getState();
  assert.equal(state.appliedFilters, null);

  state.submitSearch();

  const next = useFilterStore.getState();
  assert.equal(next.page, 1);
  assert.equal(next.refreshTrigger, 1);
  assert.equal(next.appliedFilters?.guCode, "1120000000");
  assert.deepEqual(next.appliedFilters?.tradeTypes, ["SALE", "JEONSE"]);
  assert.deepEqual(next.appliedFilters?.depositRange, [0, 70500]);
  assert.equal(next.appliedFilters?.page, 1);
});

test("draft filter edits do not change applied filters until submitSearch runs again", () => {
  const store = useFilterStore.getState();
  store.setFilter("guCode", "1120000000");
  store.submitSearch();

  const appliedBefore = useFilterStore.getState().appliedFilters;
  assert.equal(appliedBefore?.guCode, "1120000000");

  useFilterStore.getState().setFilter("guCode", "1168000000");

  const state = useFilterStore.getState();
  assert.equal(state.guCode, "1168000000");
  assert.equal(state.appliedFilters?.guCode, "1120000000");
  assert.equal(state.refreshTrigger, 1);
});

test("setPage keeps applied pagination in sync after a search is submitted", () => {
  const store = useFilterStore.getState();
  store.setFilter("guCode", "1120000000");
  store.submitSearch();
  store.setPage(3);

  const state = useFilterStore.getState();
  assert.equal(state.page, 3);
  assert.equal(state.appliedFilters?.page, 3);
});
