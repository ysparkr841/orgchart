// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadBlob, downloadDataUrl } from "./downloadFile";

const mockClick = vi.fn();
const mockAnchor = { href: "", download: "", click: mockClick };

beforeEach(() => {
  mockClick.mockClear();
  mockAnchor.href = "";
  mockAnchor.download = "";

  global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();
  vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
});

describe("downloadBlob", () => {
  it("Blob을 생성하고 anchor click으로 다운로드한다", () => {
    downloadBlob("hello", "test.txt", "text/plain");
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("filename을 anchor download 속성에 설정한다", () => {
    downloadBlob("data", "output.json", "application/json");
    expect(mockAnchor.download).toBe("output.json");
  });

  it("href에 createObjectURL 반환값을 설정한다", () => {
    downloadBlob("content", "file.csv", "text/csv");
    expect(mockAnchor.href).toBe("blob:mock-url");
  });

  it("ArrayBuffer 콘텐츠도 처리한다", () => {
    const buffer = new ArrayBuffer(8);
    downloadBlob(buffer, "data.bin", "application/octet-stream");
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

describe("downloadDataUrl", () => {
  it("dataUrl을 anchor href에 설정하고 click한다", () => {
    downloadDataUrl("data:image/png;base64,abc", "chart.png");
    expect(mockAnchor.href).toBe("data:image/png;base64,abc");
    expect(mockAnchor.download).toBe("chart.png");
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it("createObjectURL/revokeObjectURL을 호출하지 않는다", () => {
    downloadDataUrl("data:text/plain,hello", "note.txt");
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});
