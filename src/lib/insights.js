// NOTE: 지금은 AI 기능이 꺼져 있는 상태(VITE_AI_ENABLED=false)라, 팀장 대시보드
// 상단의 "팀원별 주요 업무 비중 분석"과 "주요 이슈 및 시사점"은 실제 AI 분석이
// 아니라 이 파일의 규칙 기반 로직으로 계산됩니다. 나중에 AI를 켜면, 이 두 함수
// 대신 weekly_summaries.ai_summary 등을 모아 Claude를 호출하는 새 Edge Function
// (예: analyze-team-week)으로 교체하는 것을 권장합니다.

// 팀원별로 이번 주 가장 비중이 높았던 프로젝트 1건을 뽑는다.
export function deriveWorkloadAnalysis(members) {
  return members
    .filter((m) => m.projects.length > 0)
    .map((m) => {
      const top = [...m.projects].sort((a, b) => (b.share ?? 0) - (a.share ?? 0))[0];
      return { name: m.name, projectName: top?.name ?? '-', share: top?.share ?? 0 };
    });
}

// 간단한 규칙으로 리스크/지연/병목 후보를 추려낸다:
//  - 전체 진행률이 30% 미만인 프로젝트 → "지연 위험"
//  - 한 명이 60% 이상 투입비중을 차지하는 프로젝트 → "리소스 집중 위험"
//  - 팀장이 피드백을 남겼지만 아직 재작성되지 않은 항목 → "피드백 반영 필요"
export function deriveKeyTakeaways(members) {
  const issues = [];
  for (const m of members) {
    for (const p of m.projects) {
      if ((p.overall ?? 0) < 30) {
        issues.push({
          level: 'high',
          project: p.name,
          text: `${m.name}님 담당 — 전체 진행률 ${p.overall}%로 낮은 편입니다. 병목 원인 확인이 필요합니다.`,
        });
      }
      if ((p.share ?? 0) >= 60) {
        issues.push({
          level: 'medium',
          project: p.name,
          text: `${m.name}님의 투입 비중이 ${p.share}%로 높습니다. 리소스 집중에 따른 일정 리스크를 확인해주세요.`,
        });
      }
      if (p.feedbackStatus === 'feedback_requested') {
        issues.push({
          level: 'medium',
          project: p.name,
          text: `${m.name}님에게 피드백을 남겼습니다: "${p.feedbackComment ?? ''}" — 반영 여부 확인이 필요합니다.`,
        });
      }
    }
  }
  // high 먼저, 최대 4건만
  return issues.sort((a, b) => (a.level === 'high' ? -1 : 1) - (b.level === 'high' ? -1 : 1)).slice(0, 4);
}
