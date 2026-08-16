// conference page
"use client";

import React, { useEffect, useState } from "react";
import MeetingTypeList from "@/components/MeetingTypeList";
import { scheduleService } from "@/services/schedule.service";

export default function ConferencePage() {
  const [now, setNow] = useState(new Date());
  const [upcomingMeeting, setUpcomingMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // cập nhật thời gian mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval); // clear khi unmount
  }, []);

  // Lấy upcoming meeting
  useEffect(() => {
    const fetchUpcomingMeeting = async () => {
      try {
        const meeting = await scheduleService.getUpcomingMeeting();
        setUpcomingMeeting(meeting);
      } catch (error) {
        console.error("Error fetching upcoming meeting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMeeting();
  }, []);

  const time = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit", // thêm giây cho realtime rõ hơn
  });
  const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(
    now
  );

  // Format upcoming meeting time
  const getUpcomingMeetingText = () => {
    if (loading) return "Đang tải...";
    if (!upcomingMeeting) return "Không có cuộc họp sắp tới";
    
    const meetingTime = new Date(upcomingMeeting.startTime);
    const timeString = meetingTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateString = meetingTime.toLocaleDateString("vi-VN");
    
    return `${upcomingMeeting.title} - ${timeString} (${dateString})`;
  };

   return (
    <div className="flex justify-center bg-background min-h-screen p-6">
      <section className="flex w-full max-w-6xl flex-col gap-5 text-foreground">
        <div className="h-[303px] w-full rounded-2xl bg-hero bg-cover shadow-md">
          <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
            <div className="glassmorphism max-w-[400px] rounded-xl py-2 px-3 text-center text-base font-normal text-white">
              {upcomingMeeting && (
                <div className="space-y-1">
                  <div className="text-sm">Cuộc họp sắp tới:</div>
                  <div className="font-medium">{getUpcomingMeetingText()}</div>
                  {upcomingMeeting.class && (
                    <div className="text-xs">
                      Lớp: {upcomingMeeting.class.name}
                    </div>
                  )}
                </div>
              )}
              {!upcomingMeeting && !loading && (
                <div className="text-white">Không có cuộc họp sắp tới</div>
              )}
              {loading && (
                <div className="text-white">Đang tải thông tin cuộc họp...</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold lg:text-7xl text-white">{time}</h1>
              <p className="text-lg font-medium text-white/90 lg:text-2xl">{date}</p>
            </div>
          </div>
        </div>

        <MeetingTypeList />
      </section>
    </div>
  );
}




