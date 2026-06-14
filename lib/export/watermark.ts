const WATERMARK_TEXT = "OrgChart Builder (무료 플랜)";

export async function applyWatermark(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(img, 0, 0);

      const side = Math.min(canvas.width, canvas.height);
      const fontSize = Math.max(14, Math.round(side / 50));
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = "rgba(100, 116, 139, 0.55)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";

      const padding = fontSize * 1.2;
      ctx.fillText(WATERMARK_TEXT, canvas.width - padding, canvas.height - padding);

      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}
