import { useEffect, useState } from 'react';

export default function TimesheetRow({ row, projects, onChange, onCommitProjectName }) {
  const getProject = (id) => projects.find((p) => p.id === id) || null;
  const project = getProject(row.projectId);
  const isNonWork = project?.nonWork === true; // e.g. '점심시간' — disables the rest of the row

  // Free-text draft so typing doesn't try to resolve/create a project on
  // every keystroke — only when the field is committed (blur or Enter).
  const [draftName, setDraftName] = useState(project?.name ?? '');
  useEffect(() => {
    setDraftName(project?.name ?? '');
  }, [project?.name]);

  function commitProjectName() {
    const trimmed = draftName.trim();
    if (trimmed === (project?.name ?? '')) return; // nothing changed
    onCommitProjectName(row.id, trimmed);
  }

  function handleSummaryChange(e) {
    // Manual edits invalidate any previously-applied AI text, since it no
    // longer reflects what's on screen.
    onChange(row.id, { summary: e.target.value, aiApplied: false });
  }

  function handleProgressChange(e) {
    onChange(row.id, { progress: Number(e.target.value) });
  }

  const datalistId = `projects-${row.id}`;

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-5 py-3 ${
        isNonWork ? 'bg-surface-50' : ''
      }`}
    >
      <span className="text-sm font-semibold text-navy-900 md:w-16 shrink-0">{row.time}</span>

      <div className="md:w-40 shrink-0">
        <input
          list={datalistId}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitProjectName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          placeholder="프로젝트 입력 또는 새로 추가"
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-surface-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
        />
        <datalist id={datalistId}>
          {projects.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </div>

      <input
        type="text"
        value={row.summary}
        onChange={handleSummaryChange}
        disabled={isNonWork}
        placeholder={isNonWork ? '비업무 시간입니다' : '업무 요약을 입력하세요'}
        className="text-sm flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-surface-200 disabled:bg-surface-100 disabled:text-navy-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
      />

      <div className="flex items-center gap-2 md:w-32 shrink-0">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={row.progress}
          onChange={handleProgressChange}
          disabled={isNonWork}
          className="w-16 accent-primary-500 disabled:opacity-40"
        />
        <span className="text-xs font-semibold w-9 text-right">{row.progress}%</span>
      </div>
    </div>
  );
}
