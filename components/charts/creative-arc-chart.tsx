'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

const ARC_COLORS: Record<string, string> = {
  unboxing: '#ff005c',
  review: '#ff6927',
  tutorial: '#ffc227',
  lifestyle: '#14b8a6',
  performance: '#8b5cf6',
  music: '#ec4899',
  'behind-the-scenes': '#06b6d4',
  announcement: '#f59e0b',
  testimonial: '#10b981',
  challenge: '#6366f1',
  uncategorized: '#9ca3af',
};

interface CreativeArc {
  name: string;
  count: number;
  totalViews: number;
  avgEngagementRate: number;
}

interface CreativeArcChartProps {
  creativeArcsBreakdown: Map<string, {
    count: number;
    avgEngagementRate: number;
    totalViews: number;
  }>;
  metric?: 'views' | 'engagement';
}

export function CreativeArcPerformanceChart({
  creativeArcsBreakdown,
  metric = 'views'
}: CreativeArcChartProps) {
  const chartData = useMemo(() => {
    const data = Array.from(creativeArcsBreakdown.entries())
      .map(([arc, stats]) => ({
        name: arc === 'uncategorized' ? 'Other' : arc,
        count: stats.count,
        totalViews: stats.totalViews,
        avgEngagementRate: stats.avgEngagementRate,
        value: metric === 'views' ? stats.totalViews : stats.avgEngagementRate,
      }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [creativeArcsBreakdown, metric]);

  const formatValue = (value: number) => {
    if (metric === 'views') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M views`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K views`;
      return `${value.toLocaleString()} views`;
    }
    return `${value.toFixed(2)}% engagement`;
  };

  const getBarColor = (arcName: string) => {
    return ARC_COLORS[arcName.toLowerCase()] || ARC_COLORS.uncategorized;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Creative Arc Performance
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              metric === 'views'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            By Views
          </button>
          <button
            onClick={() => {}}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              metric === 'engagement'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            By Engagement
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="#9ca3af"
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9ca3af"
            width={75}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              fontWeight: 'bold',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'value') return [formatValue(value), metric === 'views' ? 'Total Views' : 'Avg Engagement'];
              return [value, name];
            }}
            labelFormatter={(label) => {
              const item = chartData.find(d => d.name === label);
              return item ? `${item.name} (${item.count} posts)` : label;
            }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {chartData.slice(0, 6).map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getBarColor(item.name) }}
            />
            <span className="text-gray-600 capitalize">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
