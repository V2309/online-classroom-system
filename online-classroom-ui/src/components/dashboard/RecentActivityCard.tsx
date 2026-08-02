"use client";

import { UserIcon, AcademicCapIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface Activity {
  id: string;
  type: "user" | "class" | "post";
  title: string;
  time: string;
  imageUrl?: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getIcon = (type: "user" | "class" | "post") => {
    switch (type) {
      case "user":
        return <UserIcon className="w-8 h-8 text-blue-600" />;
      case "class":
        return <AcademicCapIcon className="w-8 h-8 text-green-600" />;
      case "post":
        return <DocumentTextIcon className="w-8 h-8 text-purple-600" />;
    }
  };

  const getTypeText = (type: "user" | "class" | "post") => {
    switch (type) {
      case "user":
        return "Người dùng mới";
      case "class":
        return "Lớp học mới";
      case "post":
        return "Bài đăng mới";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có hoạt động nào</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
              <div className="flex-shrink-0">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{getTypeText(activity.type)} • {activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}