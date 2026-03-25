import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { format } from 'date-fns';
import type { TimeRange } from '../../types';

interface MetricChartProps {
  data: Array<{ timestamp: string; value: number; value2?: number }>;
  title: string;
  color: string;
  color2?: string;
  unit?: string;
  type?: 'line' | 'area';
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  height?: number;
  label?: string;
  label2?: string;
}

const timeRanges: TimeRange[] = ['1h', '6h', '24h', '7d', '30d'];

export function MetricChart({
  data,
  title,
  color,
  color2,
  unit = '%',
  type = 'line',
  timeRange,
  onTimeRangeChange,
  height = 250,
  label = 'Value',
  label2,
}: MetricChartProps) {
  const formattedData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        time: format(new Date(d.timestamp), timeRange === '1h' || timeRange === '6h' ? 'HH:mm' : 'MMM d HH:mm'),
      })),
    [data, timeRange],
  );

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-raised'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}${unit}`}
            domain={unit === '%' ? [0, 100] : ['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F1F5F9',
            }}
            formatter={(value: unknown) => [`${Number(value).toFixed(1)}${unit}`, label]}
          />
          {type === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
                name={label}
              />
              {color2 && (
                <Area
                  type="monotone"
                  dataKey="value2"
                  stroke={color2}
                  fill={color2}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                  name={label2 || 'Value 2'}
                />
              )}
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                name={label}
              />
              {color2 && (
                <Line
                  type="monotone"
                  dataKey="value2"
                  stroke={color2}
                  strokeWidth={2}
                  dot={false}
                  name={label2 || 'Value 2'}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
