import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({ _mock: true })),
}));

describe("lib/prisma — 싱글톤 패턴", () => {
  const g = globalThis as Record<string, unknown>;

  beforeEach(() => {
    vi.resetModules();
    g.prisma = undefined;
  });

  afterEach(() => {
    g.prisma = undefined;
  });

  it("PrismaClient 인스턴스를 정상적으로 내보낸다", async () => {
    const { prisma } = await import("./prisma");
    expect(prisma).toBeDefined();
    expect(prisma).toHaveProperty("_mock", true);
  });

  it("non-production 환경에서 globalThis.prisma에 인스턴스를 캐시한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { prisma } = await import("./prisma");
    expect(g.prisma).toBe(prisma);
    vi.unstubAllEnvs();
  });

  it("globalThis.prisma가 이미 존재하면 동일 인스턴스를 재사용한다", async () => {
    const cached = { _mock: true, _cached: true };
    g.prisma = cached;
    const { prisma } = await import("./prisma");
    expect(prisma).toBe(cached);
  });

  it("production 환경에서는 globalThis.prisma에 인스턴스를 저장하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await import("./prisma");
    expect(g.prisma).toBeUndefined();
    vi.unstubAllEnvs();
  });
});
