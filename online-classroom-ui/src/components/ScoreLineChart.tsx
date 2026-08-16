"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  [key: string]: number | string;
}

interface ScoreLineChartProps {
  data: ChartData[];
}

export default function ScoreLineChart({ data }: ScoreLineChartProps) {
  return (
    <div className="w-full h-72 sm:h-80 md:h-[360px] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 25,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 124, 89, 0.12)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--text-secondary, #333a35)", fontWeight: 500 }}
            axisLine={{ stroke: "var(--border-default, rgba(74, 124, 89, 0.18))" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 11, fill: "var(--text-muted, #575246)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(74, 124, 89, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
              fontSize: "12px",
              fontWeight: 600,
              padding: "10px 14px",
            }}
            labelStyle={{ color: "var(--text-primary, #1f2421)", fontWeight: 700, marginBottom: "4px" }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="Điểm TB"
            stroke="var(--accent-primary, #4a7c59)"
            strokeWidth={3}
            dot={{ r: 4, fill: "#ffffff", stroke: "var(--accent-primary, #4a7c59)", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "var(--accent-primary, #4a7c59)", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}