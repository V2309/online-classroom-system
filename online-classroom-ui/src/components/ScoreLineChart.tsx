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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            // TỐI ƯU RESPONSIVE:
            // Xóa interval={0} để Recharts tự động ẩn bớt nhãn
            // khi không đủ không gian (trên di động)
            // interval={0} 
            
            // angle={-15} // Giữ lại comment này, hữu ích nếu nhãn vẫn dài
            // textAnchor="end"
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #cccccc",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Điểm TB" // Khớp với key trong `chartData`
            stroke="#3b82f6" // Màu xanh blue
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}