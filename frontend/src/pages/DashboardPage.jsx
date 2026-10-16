import { useState, useEffect, useCallback, useRef } from 'react';
import { Briefcase, Calendar, TrendingUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  DashboardHeader,
  DashboardMetricCard,
  ApplicationPipeline,
  UpcomingInterviewsCard,
  RecentApplicationsCard,
} from '../components/dashboard';
import * as analyticsService from '../services/analyticsService';
import * as interviewService from '../services/interviewService';
import * as applicationService from '../services/applicationService';
import { getErrorMessage } from '../utils/errorUtils';

/**
 * Dashboard Overview Page (Phase 6.5G)
 *
 * Recruiter-ready command center integrating real-time analytics KPIs,
 * application pipeline status breakdown, upcoming confirmed interviews,
 * and recent job applications.
 */
export const DashboardPage = () => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  // 1. Analytics Metrics & Pipeline State
  const [metricsState, setMetricsState] = useState({
    overview: null,
    breakdown: null,
    isLoading: true,
    error: null,
  });

  // 2. Upcoming Interviews State
  const [interviewsState, setInterviewsState] = useState({
    interviews: [],
    isLoading: true,
    error: null,
  });

  // 3. Recent Applications State
  const [applicationsState, setApplicationsState] = useState({
    applications: [],
    isLoading: true,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetch overview metrics and status breakdown
   */
  const fetchMetrics = useCallback(async () => {
    setMetricsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [overviewRes, breakdownRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getStatusBreakdown(),
      ]);

      if (!isMountedRef.current) return;

      setMetricsState({
        overview: overviewRes?.data?.data || null,
        breakdown: breakdownRes?.data?.data || null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = getErrorMessage(err, 'Failed to load analytics overview.');
      setMetricsState((prev) => ({
        ...prev,
        isLoading: false,
        error: msg,
      }));
    }
  }, []);

  /**
   * Fetch upcoming interviews within the next 14 days
   */
  const fetchInterviews = useCallback(async () => {
    setInterviewsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await interviewService.getUpcomingInterviews({ days: 14 });

      if (!isMountedRef.current) return;

      const data = res?.data?.data || [];
      setInterviewsState({
        interviews: Array.isArray(data) ? data : [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = getErrorMessage(err, 'Failed to load upcoming interviews.');
      setInterviewsState((prev) => ({
        ...prev,
        isLoading: false,
        error: msg,
      }));
    }
  }, []);

  /**
   * Fetch most recent applications using supported backend parameters
   */
  const fetchApplications = useCallback(async () => {
    setApplicationsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await applicationService.getApplications({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (!isMountedRef.current) return;

      const data = res?.data?.data || [];
      setApplicationsState({
        applications: Array.isArray(data) ? data : [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = getErrorMessage(err, 'Failed to load recent applications.');
      setApplicationsState((prev) => ({
        ...prev,
        isLoading: false,
        error: msg,
      }));
    }
  }, []);

  /**
   * Initial load on mount with unmount cleanup
   */
  useEffect(() => {
    isMountedRef.current = true;

    fetchMetrics();
    fetchInterviews();
    fetchApplications();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMetrics, fetchInterviews, fetchApplications]);

  /**
   * Manual refresh handler across all sections concurrently
   */
  const handleRefreshAll = async () => {
    setIsRefreshing(true);

    const results = await Promise.allSettled([
      fetchMetrics(),
      fetchInterviews(),
      fetchApplications(),
    ]);

    if (!isMountedRef.current) return;

    const hasFailure = results.some((r) => r.status === 'rejected');
    if (hasFailure) {
      toast.error('Refreshed with some errors.');
    } else {
      toast.success('Dashboard refreshed successfully');
    }

    setIsRefreshing(false);
  };

  const overview = metricsState.overview;

  return (
    <div className="page-container" data-testid="dashboard-page">
      {/* 1. Welcome Header & Quick Actions */}
      <DashboardHeader
        user={user}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* 2. Key Performance Metric Cards */}
      <section
        aria-label="Summary KPI Metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
        data-testid="dashboard-metrics-grid"
      >
        <DashboardMetricCard
          title="Total Applications"
          value={overview?.totalApplications ?? 0}
          subtitle="Active submissions"
          helperText="Click to manage applications"
          icon={Briefcase}
          variant="primary"
          to="/applications"
          dataTestId="dashboard-metric-applications"
        />

        <DashboardMetricCard
          title="Total Interviews"
          value={overview?.totalInterviews ?? 0}
          subtitle="All rounds tracked"
          helperText="Click to manage schedule"
          icon={Calendar}
          variant="primary"
          to="/interviews"
          dataTestId="dashboard-metric-interviews"
        />

        <DashboardMetricCard
          title="Interview Rate"
          value={`${overview?.interviewConversionRate ?? 0}%`}
          subtitle="Application to interview"
          helperText="Click to view analytics"
          icon={TrendingUp}
          variant="primary"
          to="/analytics"
          dataTestId="dashboard-metric-interview-rate"
        />

        <DashboardMetricCard
          title="Offer Rate"
          value={`${overview?.offerRate ?? 0}%`}
          subtitle="Application to offer"
          helperText="Click to view analytics"
          icon={Award}
          variant="success"
          to="/analytics"
          dataTestId="dashboard-metric-offer-rate"
        />
      </section>

      {/* 3. Application Pipeline Status Breakdown */}
      <section
        aria-label="Application Pipeline"
        style={{ marginBottom: 'var(--space-xl)' }}
        data-testid="dashboard-pipeline-section"
      >
        <ApplicationPipeline
          breakdown={metricsState.breakdown}
          totalApplications={overview?.totalApplications ?? 0}
          isLoading={metricsState.isLoading}
          error={metricsState.error}
          onRetry={fetchMetrics}
        />
      </section>

      {/* 4. Two-Column Layout: Upcoming Interviews & Recent Applications */}
      <section
        aria-label="Upcoming Interviews and Recent Applications"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
        }}
        data-testid="dashboard-content-grid"
      >
        <UpcomingInterviewsCard
          interviews={interviewsState.interviews}
          isLoading={interviewsState.isLoading}
          error={interviewsState.error}
          onRetry={fetchInterviews}
        />

        <RecentApplicationsCard
          applications={applicationsState.applications}
          isLoading={applicationsState.isLoading}
          error={applicationsState.error}
          onRetry={fetchApplications}
        />
      </section>
    </div>
  );
};

export default DashboardPage;
