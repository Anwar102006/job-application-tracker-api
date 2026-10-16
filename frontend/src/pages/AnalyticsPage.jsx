import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Briefcase,
  Calendar,
  TrendingUp,
  Award,
  Target,
  XCircle,
  BarChart3,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, LoadingIndicator, ErrorState } from '../components/atoms';
import {
  AnalyticsMetricCard,
  ConversionFunnelChart,
  StatusBreakdownChart,
  MonthlyTrendsChart,
} from '../components/analytics';
import * as analyticsService from '../services/analyticsService';
import { getErrorMessage } from '../utils/errorUtils';
import { DEFAULT_TREND_MONTHS } from '../constants/analytics.constants';

/**
 * Analytics and Insights Dashboard Page (Phase 6.5F)
 *
 * Integrates backend analytics endpoints:
 * - GET /api/v1/analytics/overview
 * - GET /api/v1/analytics/status-breakdown
 * - GET /api/v1/analytics/conversion-rates
 * - GET /api/v1/analytics/monthly-trends
 *
 * Provides real-time conversion funnels, volume velocity, and distribution insights.
 */
export const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState(null);
  const [conversionRates, setConversionRates] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  const [trendMonths, setTrendMonths] = useState(DEFAULT_TREND_MONTHS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch complete analytics dashboard datasets
   */
  const loadAnalytics = useCallback(async (showRefreshingToast = false) => {
    if (showRefreshingToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [overviewRes, breakdownRes, conversionRes, trendsRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getStatusBreakdown(),
        analyticsService.getConversionRates(),
        analyticsService.getMonthlyTrends({ months: trendMonths }),
      ]);

      setOverview(overviewRes?.data?.data || null);
      setStatusBreakdown(breakdownRes?.data?.data || null);
      setConversionRates(conversionRes?.data?.data || null);
      setMonthlyTrends(trendsRes?.data?.data || []);

      if (showRefreshingToast) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load analytics data.');
      setError(msg);
      if (showRefreshingToast) {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [trendMonths]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  /**
   * Dedicated handler for horizon change to avoid reloading entire dashboard
   */
  const handleTrendMonthsChange = async (newMonths) => {
    if (newMonths === trendMonths) return;
    setTrendMonths(newMonths);
    setIsTrendsLoading(true);

    try {
      const res = await analyticsService.getMonthlyTrends({ months: newMonths });
      setMonthlyTrends(res?.data?.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update monthly trends.'));
    } finally {
      setIsTrendsLoading(false);
    }
  };

  // 1. Initial Full Page Loading State
  if (isLoading && !overview) {
    return (
      <div
        className="page-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
        }}
        data-testid="analytics-loading-state"
      >
        <LoadingIndicator size="lg" label="Loading analytics and insights..." />
        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)' }}>
          Computing career pipeline metrics...
        </p>
      </div>
    );
  }

  // 2. Fatal Error State
  if (error && !overview) {
    return (
      <div className="page-container" data-testid="analytics-error-state">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics & Insights</h1>
            <p className="page-subtitle">
              Comprehensive performance metrics, conversion funnels, and application trends
            </p>
          </div>
        </div>
        <ErrorState
          title="Unable to load analytics"
          message={error}
          onRetry={() => loadAnalytics(false)}
        />
      </div>
    );
  }

  const isZeroState = overview?.totalApplications === 0;

  return (
    <div className="page-container" data-testid="analytics-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <BarChart3 size={28} color="var(--accent)" aria-hidden="true" />
            <h1 className="page-title">Analytics & Insights</h1>
          </div>
          <p className="page-subtitle">
            Comprehensive performance metrics, conversion funnels, and application trends
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics(true)}
            disabled={isRefreshing || isLoading}
            isLoading={isRefreshing}
            leftIcon={<RotateCcw size={16} />}
            aria-label="Refresh analytics data"
            data-testid="refresh-analytics-btn"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Zero State Information Notice */}
      {isZeroState && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            marginBottom: 'var(--space-xl)',
            color: 'var(--text-primary)',
          }}
          data-testid="analytics-zero-notice"
        >
          <Info size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <strong>No active applications tracked yet.</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
              Add job applications to track interview conversions, job offer rates, and monthly application velocity.
            </p>
          </div>
        </div>
      )}

      {/* KPI Overview Metric Cards Grid */}
      <section
        aria-label="Key Performance Indicators"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
        data-testid="overview-metrics-grid"
      >
        <AnalyticsMetricCard
          title="Total Applications"
          value={overview?.totalApplications ?? 0}
          subtitle="Active submissions"
          icon={Briefcase}
          variant="primary"
          helperText="Excludes archived records"
          dataTestId="metric-total-applications"
        />

        <AnalyticsMetricCard
          title="Total Interviews"
          value={overview?.totalInterviews ?? 0}
          subtitle="All rounds tracked"
          icon={Calendar}
          variant="primary"
          helperText="Scheduled & completed"
          dataTestId="metric-total-interviews"
        />

        <AnalyticsMetricCard
          title="Interview Rate"
          value={`${overview?.interviewConversionRate ?? 0}%`}
          subtitle="Application to interview"
          icon={TrendingUp}
          variant="primary"
          helperText="Apps with >= 1 interview"
          dataTestId="metric-interview-rate"
        />

        <AnalyticsMetricCard
          title="Offer Rate"
          value={`${overview?.offerRate ?? 0}%`}
          subtitle="Application to offer"
          icon={Award}
          variant="success"
          helperText="All active applications"
          dataTestId="metric-offer-rate"
        />

        <AnalyticsMetricCard
          title="Offer / Interview"
          value={`${overview?.offerToInterviewRate ?? 0}%`}
          subtitle="Interview to offer"
          icon={Target}
          variant="success"
          helperText="Of interviewed candidates"
          dataTestId="metric-offer-to-interview"
        />

        <AnalyticsMetricCard
          title="Rejection Rate"
          value={`${overview?.rejectionRate ?? 0}%`}
          subtitle="Application to rejection"
          icon={XCircle}
          variant="danger"
          helperText="Reported rejections"
          dataTestId="metric-rejection-rate"
        />
      </section>

      {/* Main Analytics Grid: Conversion Funnel & Monthly Trends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <ConversionFunnelChart data={conversionRates} />
        <MonthlyTrendsChart
          data={monthlyTrends}
          months={trendMonths}
          onMonthsChange={handleTrendMonthsChange}
          isLoading={isTrendsLoading}
        />
      </div>

      {/* Application Status & Characteristics Breakdown */}
      <section aria-label="Application Demographics Breakdown">
        <StatusBreakdownChart data={statusBreakdown} />
      </section>
    </div>
  );
};

export default AnalyticsPage;
