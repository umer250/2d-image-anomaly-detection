export const mockStats = {
    totalImages: 12543,
    anomaliesDetected: 342,
    normalImages: 12201,
    accuracy: 98.5,
};

export const dailyInspectionsData = [
    { date: 'Mon', total: 120, anomalies: 5 },
    { date: 'Tue', total: 132, anomalies: 3 },
    { date: 'Wed', total: 101, anomalies: 8 },
    { date: 'Thu', total: 134, anomalies: 2 },
    { date: 'Fri', total: 90, anomalies: 4 },
    { date: 'Sat', total: 45, anomalies: 1 },
    { date: 'Sun', total: 30, anomalies: 0 },
];

export const anomalyDistributionData = [
    { name: 'Scratch', value: 45 },
    { name: 'Dent', value: 30 },
    { name: 'Discoloration', value: 15 },
    { name: 'Crack', value: 10 },
];

export const historyData = Array.from({ length: 50 }, (_, i) => ({
    id: `IMG-${1000 + i}`,
    name: `sample_image_${1000 + i}.jpg`,
    date: new Date(Date.now() - i * 3600000).toISOString(),
    result: Math.random() > 0.9 ? 'Anomaly' : 'Normal',
    confidence: (Math.random() * (100 - 85) + 85).toFixed(2),
    type: Math.random() > 0.9 ? ['Scratch', 'Dent', 'Crack'][Math.floor(Math.random() * 3)] : 'None',
}));
