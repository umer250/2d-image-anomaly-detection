import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const DailyInspectionsChart = ({ data }) => (
    <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#e4e4e7' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" activeDot={{ r: 8 }} name="Total Inspections" strokeWidth={2} />
                <Line type="monotone" dataKey="anomalies" stroke="#ef4444" name="Anomalies" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export const AnomalyDistributionChart = ({ data }) => (
    <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#09090b" />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a', color: '#fff' }} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

export const NormalVsAnomalyChart = ({ data }) => {
    // Transform data for bar chart if needed, or use existing structure
    const chartData = [
        { name: 'Normal', value: data.normalImages, fill: '#22c55e' },
        { name: 'Anomaly', value: data.anomaliesDetected, fill: '#ef4444' },
    ];

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                        cursor={{ fill: '#27272a', opacity: 0.5 }}
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                        itemStyle={{ color: '#e4e4e7' }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
