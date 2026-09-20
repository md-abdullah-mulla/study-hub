import { OverallProgressCard } from '../components/dashboard/OverallProgressCard.jsx';
import { SubjectProgressList } from '../components/dashboard/SubjectProgressList.jsx';
import { RecommendationCard } from '../components/dashboard/RecommendationCard.jsx';
import { TodayPlanCard } from '../components/dashboard/TodayPlanCard.jsx';
import { RevisionDueCard } from '../components/dashboard/RevisionDueCard.jsx';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard.jsx';
import InsightCard from '../components/dashboard/InsightCard.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { todayTitle } from '../lib/format.js';

/**
 * DASHBOARD (spec §9, §32)
 * Order matters: overall progress → subject progress → today's target →
 * what to study next → revision due → recent activity.
 * Nothing else on this screen, on purpose.
 */
export default function DashboardPage() {
  const { dashboard } = useAppData();
  if (!dashboard) return null;

  const { overall, stats, subjects, todayPlan, recommendation, revisionDue, recentActivity } = dashboard;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="sm:hidden">
        <p className="muted">{todayTitle()}</p>
      </div>

      <OverallProgressCard overall={overall} stats={stats} />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <SubjectProgressList subjects={subjects} />
        <div className="space-y-4 sm:space-y-5">
          <TodayPlanCard plan={todayPlan} />
          <RecommendationCard recommendation={recommendation} />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <InsightCard />

        <RevisionDueCard items={revisionDue} />
        <RecentActivityCard items={recentActivity} />
      </div>

      <div className="hidden sm:block">
        <p className="muted text-center">
          Bistarito analytics (study time, chapter/topic breakdown) আছে Analytics page-এ — dashboard যাতে
          জটিল না লাগে।
        </p>
      </div>
    </div>
  );
}
