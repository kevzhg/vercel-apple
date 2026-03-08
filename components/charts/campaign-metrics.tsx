'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const VIRAL_COLORS = {
  primary: '#ff005c',
  secondary: '#ff6927',
  tertiary: '#ffc227',
  quaternary: '#14b8a6',
  quinary: '#8b5cf6',
};

interface CampaignMetricsChartProps {
  data: Array<{
    name: string;
    views?: number;
    engagement?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    [key: string]: any;
  }>;
}

export function CampaignMetricsChart({ data }: CampaignMetricsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#ff005c" strokeWidth={2} />
        <YAxis stroke="#ff005c" strokeWidth={2} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '2px solid #ff005c',
            borderRadius: '12px',
            fontWeight: 'bold',
          }}
        />
        <Legend wrapperStyle={{ fontWeight: 'bold' }} />
        <Bar dataKey="views" fill={VIRAL_COLORS.primary} radius={[8, 8, 0, 0]} />
        <Bar dataKey="engagement" fill={VIRAL_COLORS.secondary} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface EngagementBreakdownChartProps {
  data: Array<{
    name: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export function EngagementBreakdownChart({ data }: EngagementBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#ff6927" strokeWidth={2} />
        <YAxis stroke="#ff6927" strokeWidth={2} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '2px solid #ff6927',
            borderRadius: '12px',
            fontWeight: 'bold',
          }}
        />
        <Legend wrapperStyle={{ fontWeight: 'bold' }} />
        <Bar dataKey="likes" fill={VIRAL_COLORS.primary} radius={[8, 8, 0, 0]} />
        <Bar dataKey="comments" fill={VIRAL_COLORS.tertiary} radius={[8, 8, 0, 0]} />
        <Bar dataKey="shares" fill={VIRAL_COLORS.quaternary} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export function ViralPieChart({ data }: PieChartProps) {
  const COLORS = [VIRAL_COLORS.primary, VIRAL_COLORS.secondary, VIRAL_COLORS.tertiary, VIRAL_COLORS.quaternary, VIRAL_COLORS.quinary];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          strokeWidth={3}
          stroke="white"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '2px solid #ff005c',
            borderRadius: '12px',
            fontWeight: 'bold',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
