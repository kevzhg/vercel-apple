'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, ReferenceLine } from 'recharts';
import { PostData } from '@/lib/types';
import { useMemo } from 'react';

interface SentimentTrendChartProps {
  posts: PostData[];
  annotations?: Array<{
    date: string;
    label: string;
  }>;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  sentimentScore: number;
  postCount: number;
}

export function SentimentTrendChart({ posts, annotations = [] }: SentimentTrendChartProps) {
  const chartData = useMemo(() => {
    // Group posts by date
    const dateMap = new Map<string, { totalSentiment: number; count: number }>();

    posts.forEach((post) => {
      const date = new Date(post.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const sentiment = post.cortexAnalysis?.sentimentScore ?? 0;

      if (!dateMap.has(date)) {
        dateMap.set(date, { totalSentiment: 0, count: 0 });
      }

      const current = dateMap.get(date)!;
      current.totalSentiment += sentiment;
      current.count += 1;
    });

    // Convert to array and sort by date
    const sortedData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        dateLabel: date,
        sentimentScore: data.count > 0 ? data.totalSentiment / data.count : 0,
        postCount: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.dateLabel + ', 2026');
        const dateB = new Date(b.dateLabel + ', 2026');
        return dateA.getTime() - dateB.getTime();
      });

    return sortedData;
  }, [posts]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return '#22c55e'; // green
    if (score < -0.2) return '#ef4444'; // red
    return '#9ca3af'; // gray
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.2) return 'Positive';
    if (score < -0.2) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Sentiment Over Time
        </h3>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Positive (&gt;0.2)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-600">Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">Negative (&lt;-0.2)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateLabel"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[-1, 1]}
            tickFormatter={(value) => value.toFixed(1)}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            label={{
              value: 'Sentiment Score',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#6b7280' }
            }}
            stroke="#9ca3af"
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <ReferenceLine y={0.2} stroke="#22c55e" strokeDasharray="2 2" strokeOpacity={0.5} />
          <ReferenceLine y={-0.2} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              fontWeight: 'bold',
            }}
            formatter={(value: number) => [
              `${value.toFixed(2)} (${getSentimentLabel(value)})`,
              'Sentiment'
            ]}
            labelFormatter={(label) => {
              const item = chartData.find(d => d.dateLabel === label);
              return item ? `${item.date} (${item.postCount} posts)` : label;
            }}
          />
          <Area
            type="monotone"
            dataKey="sentimentScore"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="url(#sentimentGradient)"
          />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
          />

          {/* Annotations for key events */}
          {annotations.map((annotation, index) => {
            const dataPoint = chartData.find(d => d.dateLabel === annotation.date);
            if (!dataPoint) return null;
            return (
              <ReferenceLine
                key={`annotation-${index}`}
                x={chartData.indexOf(dataPoint)}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>

      {/* Annotations legend */}
      {annotations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {annotations.map((annotation, index) => (
            <div
              key={`annotation-label-${index}`}
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
            >
              <div className="w-8 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }} />
              <span>{annotation.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p>Sentiment scores range from -1 (very negative) to +1 (very positive).</p>
        <p className="mt-1">The shaded area indicates the overall sentiment trend over time.</p>
      </div>
    </div>
  );
}
