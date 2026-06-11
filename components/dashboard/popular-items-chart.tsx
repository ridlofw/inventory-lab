"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface PopularItemsChartProps {
  data: {
    name: string;
    totalPinjam: number;
  }[];
}

export function PopularItemsChart({ data }: PopularItemsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        Belum ada data peminjaman
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={10}
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            cursor={{ fill: 'var(--accent)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
            formatter={(value: any) => [`${value} kali`, "Dipinjam"]}
          />
          <Bar dataKey="totalPinjam" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
