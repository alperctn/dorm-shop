"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SaleRecord {
    id: string;
    date: string;
    items: string;
    total: number;
    paymentType?: string;
}

interface AdminChartProps {
    data: SaleRecord[];
}

export default function AdminChart({ data }: AdminChartProps) {
    // Veriyi gün bazında grupla
    const groupedData = data.reduce((acc, curr) => {
        // Tarih formatı "DD.MM.YYYY HH:mm" -> sadece "DD.MM" al
        const day = curr.date.split(' ')[0].split('.').slice(0, 2).join('.');

        if (!acc[day]) {
            acc[day] = { date: day, total: 0 };
        }
        acc[day].total += curr.total;
        return acc;
    }, {} as Record<string, { date: string, total: number }>);

    const chartData = Object.values(groupedData).reverse(); // Eskiden yeniye

    if (chartData.length === 0) {
        return <div className="text-zinc-500 text-sm text-center">henüz veri yok</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333' }}
                        itemStyle={{ color: '#EAB308' }}
                    />
                    <Bar dataKey="total" fill="#EAB308" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
