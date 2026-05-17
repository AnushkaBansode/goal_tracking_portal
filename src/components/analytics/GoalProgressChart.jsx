import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const BAR_COLORS = ['#0A3D91', '#1551b5', '#0070E0', '#0284C7', '#0A3D91', '#1551b5', '#0070E0', '#0284C7'];

/**
 * Bar chart of per-goal progress (Recharts).
 */
export default function GoalProgressChart({ chartData }) {
  if (!chartData?.length) {
    return (
      <div className="analytics-chart-empty">
        <p>No goal data to chart yet. Create a goal to see progress here.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748B', fontSize: 11 }}
          angle={-28}
          textAnchor="end"
          height={56}
          interval={0}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(10, 61, 145, 0.06)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload;
            return (
              <div className="analytics-chart-tooltip">
                <strong>{row.fullTitle}</strong>
                <span>{row.progress}% progress</span>
                <span className="muted">{row.status}</span>
              </div>
            );
          }}
        />
        <Bar dataKey="progress" radius={[8, 8, 0, 0]} maxBarSize={48}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
