import test from "node:test";
import assert from "node:assert/strict";

import { createArticleFetchPlan } from "./query-planner";

test("uses shallow crawling when only upstream-trustworthy filters are present", () => {
  const plan = createArticleFetchPlan({
    tradeTypes: "B1",
    buildingTypes: "APT",
  });

  assert.equal(plan.maxPages, 3);
  assert.equal(plan.requiresPostFilter, false);
  assert.equal(plan.stopWhenEnoughFiltered, true);
});

test("uses deep crawling when deposit filters require backend post-filtering", () => {
  const plan = createArticleFetchPlan({
    tradeTypes: "B1",
    buildingTypes: "APT",
    depositMin: 0,
    depositMax: 70000,
  });

  assert.equal(plan.maxPages, 15);
  assert.equal(plan.requiresPostFilter, true);
  assert.equal(plan.stopWhenEnoughFiltered, false);
});

test("treats area filters as backend-only filtering constraints", () => {
  const plan = createArticleFetchPlan({
    tradeTypes: "A1",
    buildingTypes: "APT",
    areaMin: 59,
    areaMax: 84,
  });

  assert.equal(plan.maxPages, 15);
  assert.equal(plan.requiresPostFilter, true);
});
