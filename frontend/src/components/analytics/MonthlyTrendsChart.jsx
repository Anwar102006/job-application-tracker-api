import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../atoms';
import { TrendingUp, Calendar, Zap, Layers } from 'lucide-react';
import { TREND_HORIZONS } from '../../constants/analytics.constants';

/**
 * Format 'YYYY-MM' into friendly display label like 'Oct 2026'
 */
const formatMonthLabel = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return '';
  const [year, month] = monthStr.split('-');
  if (!year || !month) return monthStr;

  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
  if (isNaN(date.getTime())) return monthStr;

  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/**
 * Custom accessible tooltip for MonthlyTrendsChart
 */
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-xs) var(--space-sm)',
          boxShadow: 'var(--shadow-md)',
          fontSize: 'var(--text-xs)',
        }}
      >
        <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>
          {formatMonthLabel(label)}
        </p>
        <p style={{ color: 'var(--accent)', margin: '2px 0 0' }}>
          Applications: <strong>{item.value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

CustomTrendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/**
 * Monthly Application Volume Trends Component (Phase 6.5F)
 *
 * Displays a smooth chronological area chart of submitted applications
 * with horizon selection (3, 6, 12, 24 months) and velocity statistics.
 */
export const MonthlyTrendsChart = ({
  data = [],
  months = 6,
  onMonthsChange,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      month: item.month,
      formattedMonth: formatMonthLabel(item.month),
      count: Number(item.count) || 0,
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!chartData.length) return { total: 0, peak: 0, average: 0 };
    const total = chartData.reduce((acc, curr) => acc + curr.count, 0);
    const peak = Math.max(...chartData.map((d) => d.count), 0);
    const average = Math.round((total / chartData.length) * 10) / 10;
    return { total, peak, average };
  }, [chartData]);

  return (
    <Card className="monthly-trends-card" data-testid="monthly-trends-card">
      <CardHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <TrendingUp size={20} color="var(--accent)" aria-hidden="true" />
            <div>
              <CardTitle>Application Volume Trends</CardTitle>
              <CardDescription>
                Monthly application submissions over time
              </CardDescription>
            </div>
          </div>

          {/* Horizon Selector */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              border: '1px solid var(--border)',
            }}
            role="group"
            aria-label="Time Horizon"
          >
            {TREND_HORIZONS.map((h) => {
              const isSelected = months === h.value;
              return (
                <button
                  key={h.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onMonthsChange && onMonthsChange(h.value)}
                  disabled={isLoading}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: 'var(--text-xs)',
                    fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                    backgroundColor: isSelected ? 'var(--surface)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: isLoading ? 'wait' : 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  data-testid={`trend-horizon-${h.value}`}
                >
                  {h.value}M
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Velocity Stats Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-xs) 0',
          }}
          data-testid="trends-stats-header"
        >
          <div
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Layers size={12} color="var(--accent)" aria-hidden="true" />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Period Total</span>
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} color="var(--success)" aria-hidden="true" />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Avg</span>
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
              {stats.average}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={12} color="#f59e0b" aria-hidden="true" />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peak Month</span>
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
              {stats.peak}
            </div>
          </div>
        </div>

        {/* Recharts AreaChart */}
        <div style={{ width: '100%', height: 240, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="formattedMonth"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTrendTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendGradient)"
                activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

MonthlyTrendsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
  months: PropTypes.number,
  onMonthsChange: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default MonthlyTrendsChart;
