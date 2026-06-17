interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onZoomReset }: Props) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        title="확대"
        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded shadow-sm text-slate-700 hover:bg-slate-50 text-xl leading-none font-medium"
      >+</button>
      <button
        onClick={onZoomReset}
        title="전체 보기"
        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded shadow-sm text-slate-500 hover:bg-slate-50 text-xs"
      >⊙</button>
      <button
        onClick={onZoomOut}
        title="축소"
        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded shadow-sm text-slate-700 hover:bg-slate-50 text-xl leading-none font-medium"
      >−</button>
    </div>
  );
}
