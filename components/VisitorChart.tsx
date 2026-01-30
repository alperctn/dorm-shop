"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VisitorRecord {
    date: string;
    count: number;
}

interface VisitorChartProps {
    data: VisitorRecord[];
}

export default function VisitorChart({ data }: VisitorChartProps) {
    // Veri zaten { date: "YYYY-MM-DD", count: N } formatında geliyor.
    // Grafikte güzel görünmesi için tarihi "DD/MM" formatına çevirelim.
    const chartData = data.map(item => ({
        date: item.date.split("-").reverse().slice(0, 2).join("/"), // 2024-01-30 -> 30/01
        count: item.count
    }));

    if (chartData.length === 0) {
        return <div className="text-zinc-500 text-sm text-center">henüz veri yok</div>;
    }

    return (
        <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333' }}
                        itemStyle={{ color: '#60A5FA' }} // Blue-400
                        cursor={{ fill: '#333', opacity: 0.4 }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
