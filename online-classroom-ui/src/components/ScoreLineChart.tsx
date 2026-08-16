// @/components/scores/ScoreLineChart.tsx

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
    // TỐI ƯU RESPONSIVE:
    // Đặt chiều cao linh hoạt: h-80 (320px) trên di động,
    // h-[400px] (400px) trên màn hình vừa (md) trở lên.
    <div className="w-full h-80 md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 124, 89, 0.15)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#4a5046' }}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#4a5046' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-surface, #f4ede3)",
              border: "1px solid rgba(74, 124, 89, 0.18)",
              borderRadius: "8px",
              color: "#2e3230",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Điểm TB"
            stroke="#4a7c59"
            strokeWidth={2}
            activeDot={{ r: 8, fill: '#35603e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}