"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import React from "react";

interface Homework {
  title: string;
  grade: number | null;
}

interface StudentHomeworkChartProps {
  homeworks: Homework[];
  totalHomeworks: number;
}

const StudentHomeworkChart: React.FC<StudentHomeworkChartProps> = ({ homeworks, totalHomeworks }) => {
  // Dữ liệu cho line chart
  const data = homeworks.map(hw => ({ ...hw, grade: hw.grade ?? 0 }));
  
  // Dữ liệu cho donut chart
  const submittedCount = homeworks.length;
  const notSubmittedCount = Math.max(0, totalHomeworks - submittedCount);
  
  // Tính phần trăm
  const submittedPercentage = totalHomeworks > 0 ? Math.round((submittedCount / totalHomeworks) * 100) : 0;
  
  const pieData = [
    { name: "Đã nộp", value: submittedCount, percentage: submittedPercentage },
    { name: "Chưa nộp", value: notSubmittedCount, percentage: 100 - submittedPercentage },
  ];

  const COLORS = ["#1E88E5", "#90CAF9"];

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">
      {/* Donut Chart */}
      <div className="w-full md:w-1/3 flex justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} bài`, name]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Text ở giữa donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-blue-600">{submittedPercentage}%</div>
              <div className="text-xs text-gray-600">Hoàn thành</div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-col gap-1">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-xs text-gray-700">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="w-full md:w-2/3">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="grade" stroke="#4F8EF7" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentHomeworkChart;