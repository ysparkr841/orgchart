// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyWatermark } from "./watermark";

function makeCtxMock() {
  return {
    drawImage: vi.fn(),
    fillText: vi.fn(),
    font: "",
    fillStyle: "",
    textAlign: "",
    textBaseline: "",
  };
}

function setupCanvasMock(
  width = 400,
  height = 300,
  dataUrl = "data:image/png;base64,MOCK"
) {
  const ctx = makeCtxMock();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(dataUrl);

  // Image.onload를 동기적으로 호출하도록 mock
  const OriginalImage = globalThis.Image;
  const MockImage = vi.fn().mockImplementation(() => {
    const img: Record<string, unknown> = {
      naturalWidth: width,
      naturalHeight: height,
      onload: null as (() => void) | null,
      set src(_: string) {
        if (typeof img.onload === "function") img.onload();
      },
    };
    return img;
  });
  globalThis.Image = MockImage as unknown as typeof Image;

  return { ctx, restore: () => { globalThis.Image = OriginalImage; } };
}

describe("applyWatermark", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Promise<string>을 반환한다", async () => {
    const { restore } = setupCanvasMock(400, 300, "data:image/png;base64,ABC");
    const result = await applyWatermark("data:image/png;base64,ORIG");
    expect(typeof result).toBe("string");
    restore();
  });

  it("toDataURL 반환값을 그대로 resolve한다", async () => {
    const expected = "data:image/png;base64,WATERMARKED";
    const { restore } = setupCanvasMock(400, 300, expected);
    const result = await applyWatermark("data:image/png;base64,ORIG");
    expect(result).toBe(expected);
    restore();
  });

  it("이미지를 canvas에 그린다 (drawImage 호출)", async () => {
    const { ctx, restore } = setupCanvasMock(400, 300);
    await applyWatermark("data:image/png;base64,ORIG");
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    restore();
  });

  it("워터마크 텍스트를 fillText로 그린다", async () => {
    const { ctx, restore } = setupCanvasMock(400, 300);
    await applyWatermark("data:image/png;base64,ORIG");
    expect(ctx.fillText).toHaveBeenCalledOnce();
    const [text] = ctx.fillText.mock.calls[0];
    expect(text).toBe("OrgChart Builder (무료 플랜)");
    restore();
  });

  it("작은 이미지(50x50)에서 최소 폰트 14px 적용", async () => {
    const { ctx, restore } = setupCanvasMock(50, 50);
    await applyWatermark("data:image/png;base64,ORIG");
    // Math.max(14, Math.round(50 / 50)) = Math.max(14, 1) = 14
    expect(ctx.font).toMatch(/^14px/);
    restore();
  });

  it("큰 이미지(1000x800)에서 이미지 크기 기반 폰트 적용", async () => {
    const { ctx, restore } = setupCanvasMock(1000, 800);
    await applyWatermark("data:image/png;base64,ORIG");
    // Math.max(14, Math.round(800 / 50)) = Math.max(14, 16) = 16
    expect(ctx.font).toMatch(/^16px/);
    restore();
  });

  it("fillStyle이 반투명 회색으로 설정된다", async () => {
    const { ctx, restore } = setupCanvasMock(400, 300);
    await applyWatermark("data:image/png;base64,ORIG");
    expect(ctx.fillStyle).toContain("rgba");
    restore();
  });

  it("textAlign이 right, textBaseline이 bottom으로 설정된다", async () => {
    const { ctx, restore } = setupCanvasMock(400, 300);
    await applyWatermark("data:image/png;base64,ORIG");
    expect(ctx.textAlign).toBe("right");
    expect(ctx.textBaseline).toBe("bottom");
    restore();
  });
});
