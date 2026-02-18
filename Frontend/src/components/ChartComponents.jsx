import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl">
                <p className="text-zinc-400 text-xs font-semibold mb-1">{label}</p>
                <p className="text-white font-black text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

// Daily Inspections Line Chart
// Expects data: [{ name: 'Mon', count: 3 }, ...]  (from /users/dashboard)
export const DailyInspectionsChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
                dataKey="name"
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                axisLine={false}
                tickLine={false}
            />
            <YAxis
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 0 }}
                name="Inspections"
            />
        </LineChart>
    </ResponsiveContainer>
);

// Anomaly Distribution Pie Chart
// Expects data: [{ name: 'Minor', value: 5 }, { name: 'Major', value: 2 }, ...]
export const AnomalyDistributionChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
            >
                {data.map((entry, index) => (
                    <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                    />
                ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                    <span style={{ color: '#a1a1aa', fontSize: '11px', fontFamily: "'Inter', sans-serif" }}>
                        {value}
                    </span>
                )}
            />
        </PieChart>
    </ResponsiveContainer>
);

// Normal vs Anomaly Bar Chart
// Expects data: [{ name: 'Normal', value: 10 }, { name: 'Anomaly', value: 4 }]
export const NormalVsAnomalyChart = ({ data }) => {
    const FILL_COLORS = { Normal: '#10b981', Anomaly: '#ef4444' };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={FILL_COLORS[entry.name] || COLORS[index % COLORS.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
