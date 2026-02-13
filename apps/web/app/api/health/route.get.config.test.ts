import { describe, it, expect, vi, afterEach } from "vitest";
import { handler } from "./route.get.config";

vi.mock("@/models/user", () => ({
  getTotalUsers: vi.fn(),
}));

describe("route.get.config handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the total number of users", async () => {
    // Setup
    const { getTotalUsers } = await import("@/models/user");
    vi.mocked(getTotalUsers).mockResolvedValue(5);

    // Act
    const result = await handler({} as Parameters<typeof handler>[0]);

    // Assert
    expect(result.status).toBe(true);
    if (!result.status) throw new Error("Expected success response");
    expect(result.data).toEqual({ totalUsers: 5 });
  });

  it("returns zero when there are no users", async () => {
    // Setup
    const { getTotalUsers } = await import("@/models/user");
    vi.mocked(getTotalUsers).mockResolvedValue(0);

    // Act
    const result = await handler({} as Parameters<typeof handler>[0]);

    // Assert
    expect(result.status).toBe(true);
    if (!result.status) throw new Error("Expected success response");
    expect(result.data).toEqual({ totalUsers: 0 });
  });
});
