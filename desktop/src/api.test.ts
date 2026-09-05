import { describe, it, expect } from "vitest";
import { connectAgent, getHealth } from "./api";

describe("API module", () => {
  it("should have connectAgent and getHealth defined", () => {
    expect(connectAgent).toBeDefined();
    expect(getHealth).toBeDefined();
  });
});
