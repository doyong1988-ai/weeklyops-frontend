import useAppStore from '../store/useAppStore';
import WeeklyTimelineCard from './WeeklyTimelineCard';

export default function MemberAccordionCard({ member, onApproveProject, onRequestFeedback }) {
  const isExpanded = useAppStore((s) => s.expandedMemberIds.includes(member.id));
  const toggleExpanded = useAppStore((s) => s.toggleMemberExpanded);

  const statusClass =
    member.status === '제출완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';

  return (
    <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
      <button
        onClick={() => toggleExpanded(member.id)}
        aria-expanded={isExpanded}
        className="w-full flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {member.name.slice(0, 1)}
        </div>
        <div className="min-w-[120px]">
          <p className="text-sm font-semibold">
            {member.name} <span className="text-navy-400 font-normal">· {member.role}</span>
          </p>
          <p className="text-xs text-navy-400">{member.projects.length}개 프로젝트 진행 중</p>
        </div>
        <span className="text-xs font-semibold text-navy-700 ml-auto sm:ml-0">
          {member.hours ? `${member.hours}h` : '-'}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>{member.status}</span>
        {member.projects.length > 0 && (
          <svg
            className={`w-3 h-3 text-primary-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5l8 7-8 7V5z" />
          </svg>
        )}
        {member.status === '미작성' && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              // production: POST /api/notifications/remind { memberId: member.id }
              alert(`${member.name}님에게 제출 알림을 보냈습니다.`);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-100"
          >
            알림 보내기
          </span>
        )}
      </button>

      {isExpanded && member.projects.length > 0 && (
        <div className="border-t border-surface-200 p-4 sm:p-5 space-y-3">
          {member.projects.map((project) => (
            <WeeklyTimelineCard
              key={project.weeklySummaryId ?? project.projectId}
              project={project}
              onApprove={onApproveProject}
              onRequestFeedback={onRequestFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}
