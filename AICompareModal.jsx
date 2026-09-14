export default function AICompareModal({ aiModal, onRegenerate, onApply, onClose }) {
  const { open, status, original, suggestion, error } = aiModal;
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl border-2 border-primary-500/40 p-5 sm:p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-navy-900">★ AI 자동 보완</p>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700 text-sm" aria-label="닫기">
            ✕
          </button>
        </div>

        {status === 'loading' && (
          <div className="py-10 flex flex-col items-center gap-3 text-navy-500 text-sm">
            <span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            AI가 업무 내용을 분석하고 있어요…
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {error || 'AI 보완 요청이 실패했습니다.'}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-semibold hover:bg-surface-100"
              >
                닫기
              </button>
              <button
                onClick={onRegenerate}
                className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {status === 'comparing' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-surface-100 p-3">
              <p className="text-xs font-semibold text-navy-500 mb-1">입력한 요약 (원문)</p>
              <p className="text-sm text-navy-800">{original || '(내용 없음)'}</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-3">
              <p className="text-xs font-semibold text-primary-600 mb-1">AI 보완 결과</p>
              <p className="text-sm text-navy-800">{suggestion}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onRegenerate}
                className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-semibold hover:bg-surface-100"
              >
                다시 생성
              </button>
              <button
                onClick={onApply}
                className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600"
              >
                이 내용으로 적용
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
