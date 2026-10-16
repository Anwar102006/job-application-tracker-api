import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../atoms';
import { PieChart as PieIcon } from 'lucide-react';
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  WORKPLACE_COLORS,
  JOB_TYPE_COLORS,
} from '../../constants/analytics.constants';

const DIMENSIONS = [
  { id: 'byStatus', label: 'Status' },
  { id: 'byPriority', label: 'Priority' },
  { id: 'byWorkplaceType', label: 'Workplace' },
  { id: 'byJobType', label: 'Job Type' },
];

/**
 * Custom accessible tooltip for Recharts BarChart
 */
const CustomTooltip = ({ active, payload, label }) => {
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
          {label}
        </p>
        <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>
          Count: <strong>{item.value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

/**
 * Status and Demographic Breakdown Component (Phase 6.5F)
 *
 * Provides tabbed breakdowns for Application Status, Priority, Workplace Type,
 * and Job Type with interactive Recharts visualizations and accessible tabular summaries.
 */
export const StatusBreakdownChart = ({ data }) => {
  const [activeDimension, setActiveDimension] = useState('byStatus');

  const { byStatus = {}, byPriority = {}, byWorkplaceType = {}, byJobType = {} } = data || {};

  const chartData = useMemo(() => {
    let sourceObj = {};
    let colorMap = {};

    switch (activeDimension) {
      case 'byPriority':
        sourceObj = byPriority;
        colorMap = PRIORITY_COLORS;
        break;
      case 'byWorkplaceType':
        sourceObj = byWorkplaceType;
        colorMap = WORKPLACE_COLORS;
        break;
      case 'byJobType':
        sourceObj = byJobType;
        colorMap = JOB_TYPE_COLORS;
        break;
      case 'byStatus':
      default:
        sourceObj = byStatus;
        colorMap = STATUS_COLORS;
        break;
    }

    return Object.entries(sourceObj).map(([name, count]) => ({
      name,
      count: Number(count) || 0,
      color: colorMap[name] || 'var(--accent)',
    }));
  }, [activeDimension, byStatus, byPriority, byWorkplaceType, byJobType]);

  const totalCount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  return (
    <Card className="status-breakdown-card" data-testid="status-breakdown-card">
      <CardHeader>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <PieIcon size={20} color="var(--accent)" aria-hidden="true" />
              <div>
                <CardTitle>Application Breakdown</CardTitle>
                <CardDescription>
                  Distribution across statuses, priorities, and job characteristics
                </CardDescription>
              </div>
            </div>

            {/* Dimension Pill Toggle */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                border: '1px solid var(--border)',
              }}
              role="tablist"
              aria-label="Breakdown Dimensions"
            >
              {DIMENSIONS.map((dim) => {
                const isSelected = activeDimension === dim.id;
                return (
                  <button
                    key={dim.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveDimension(dim.id)}
                    style={{
                      padding: '0.25rem 0.625rem',
                      fontSize: 'var(--text-xs)',
                      fontWeight: isSelected ? 'var(--font-semibold)' : 'var(--font-medium)',
                      backgroundColor: isSelected ? 'var(--surface)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                    data-testid={`dimension-tab-${dim.id}`}
                  >
                    {dim.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {totalCount === 0 ? (
          <div
            style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No application data for this breakdown. Track applications to view demographic distributions.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Recharts BarChart Visualization */}
            <div style={{ width: '100%', height: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={chartData.length > 5 ? -25 : 0}
                    textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Accessible Tag / Summary Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 'var(--space-xs)',
                paddingTop: 'var(--space-sm)',
                borderTop: '1px solid var(--border)',
              }}
              data-testid="breakdown-summary-grid"
            >
              {chartData.map((item) => {
                const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                return (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.375rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: item.color,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--text-primary)',
                        fontVariantNumeric: 'tabular-nums',
                        marginLeft: '0.25rem',
                      }}
                    >
                      {item.count} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

StatusBreakdownChart.propTypes = {
  data: PropTypes.shape({
    byStatus: PropTypes.objectOf(PropTypes.number),
    byPriority: PropTypes.objectOf(PropTypes.number),
    byJobType: PropTypes.objectOf(PropTypes.number),
    byWorkplaceType: PropTypes.objectOf(PropTypes.number),
  }),
};

export default StatusBreakdownChart;
