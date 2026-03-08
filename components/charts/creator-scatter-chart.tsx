'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreatorProfile, getPlatformInfo, formatCreatorNumber } from '@/lib/creator-aggregator';
import { useMemo } from 'react';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ff005c',
  tiktok: '#000000',
  twitter: '#1da1f2',
  default: '#8b5cf6',
};

interface CreatorScatterChartProps {
  creators: CreatorProfile[];
  maxCreators?: number;
}

interface ChartDataPoint {
  name: string;
  followers: number;
  engagementRate: number;
  totalViews: number;
  platform: string;
  z: number; // bubble size
}

export function CreatorScatterChart({ creators, maxCreators = 20 }: CreatorScatterChartProps) {
  const chartData = useMemo(() => {
    return creators
      .slice(0, maxCreators)
      .map((creator) => {
        const topPlatform = creator.platforms[0] || 'default';
        return {
          name: creator.name,
          followers: creator.followers,
          engagementRate: creator.avgEngagementRate,
          totalViews: creator.totalViews,
          platform: topPlatform,
          z: Math.log10(creator.totalViews + 1) * 30, // log scale for bubble size
        };
      });
  }, [creators, maxCreators]);

  const getPlatformColor = (platform: string) => {
    return PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.default;
  };

  const formatFollowers = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Creator Performance Scatter Plot
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600 capitalize">{platform}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart
          margin={{ top: 20, right: 40, left: 60, bottom: 60 }}
        >
          <XAxis
            type="number"
            dataKey="followers"
            name="Followers"
            tickFormatter={formatFollowers}
            label={{
              value: 'Followers',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 12, fill: '#6b7280' }
            }}
            stroke="#9ca3af"
          />
          <YAxis
            type="number"
            dataKey="engagementRate"
            name="Engagement Rate"
            label={{
              value: 'Engagement Rate (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6b7280' }
            }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            stroke="#9ca3af"
          />
          <ZAxis
            type="number"
            dataKey="z"
            range={[50, 400]}
            name="Views"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #8b5cf6',
              borderRadius: '12px',
              fontWeight: 'bold',
            }}
            formatter={(value: number, name: string, props: any) => {
              if (name === 'Followers') return [formatFollowers(value), name];
              if (name === 'Engagement Rate') return [`${value.toFixed(2)}%`, name];
              if (name === 'Views') return [formatCreatorNumber(props.payload.totalViews), name];
              return [value, name];
            }}
            labelFormatter={(label) => {
              const item = chartData.find(d => d.name === label);
              return item ? (
                <div className="font-bold text-gray-900">{item.name}</div>
              ) : label;
            }}
          />
          <Scatter data={chartData}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getPlatformColor(entry.platform)}
                fillOpacity={0.7}
                stroke={getPlatformColor(entry.platform)}
                strokeWidth={2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p><strong>Bubble size:</strong> Total views (log scale)</p>
        <p><strong>Y-axis:</strong> Engagement rate (higher = more engaging)</p>
        <p><strong>X-axis:</strong> Follower count</p>
        <p className="mt-1 text-purple-600">
          Creators in the top-left quadrant &quot;punch above their weight&quot; (high engagement, lower followers)
        </p>
      </div>
    </div>
  );
}
