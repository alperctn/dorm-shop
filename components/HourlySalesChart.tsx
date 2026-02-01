"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

interface HourlySalesChartProps {
    data: { hour: string; count: number }[];
}

export default function HourlySalesChart({ data }: HourlySalesChartProps) {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="hour"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#3f3f46",
                            color: "#e4e4e7",
                        }}
                        itemStyle={{ color: "#fb923c" }} /* Orange-400 */
                    />
                    <Bar
                        dataKey="count"
                        fill="#fb923c"
                        radius={[4, 4, 0, 0]}
                        name="Satış Adedi"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
