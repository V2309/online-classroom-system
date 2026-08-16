"use client";

import { useState, useRef } from "react";
import moment from "moment";
// Import các icon từ Lucide
import { 
  Trash2, 
  Pencil, 
  Clock, 
  Calendar, 
  Users, 
  AlignLeft,
  Video,
  ExternalLink 
} from "lucide-react";

// --- ĐỊNH NGHĨA TYPESCRIPT ---
type EventColor = "blue" | "green" | "yellow";

type ScheduleEvent = {
  id: number;
  title: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  color: EventColor;
  meetingLink?: string | null;
  classInfo?: {
    id: number;
    name: string;
    class_code: string | null;
  };
};

// Color classes constant
const colorClasses: Record<EventColor, string> = {
  blue: "bg-[#e5eee8] text-[#2b5938] border-l-4 border-[#3f6d4d]",
  green: "bg-[#eef5ee] text-[#34603e] border-l-4 border-[#4d825c]",
  yellow: "bg-[#faedea] text-[#a6382a] border-l-4 border-[#c24b3b]",
};

// --- Component Sự Kiện Nhỏ (Đã cập nhật Tooltip UI) ---
const EventItem = ({ event, onEdit, onDelete, role }: { 
  event: ScheduleEvent; 
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
  role?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, side: 'right' as 'right' | 'left' });
  const hideTooltipTimer = useRef<NodeJS.Timeout | null>(null);
  const colorClass = colorClasses[event.color];

  // Logic hover (giữ nguyên, đã đúng)
  const handleEventMouseEnter = (e: React.MouseEvent) => {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current);
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceOnRight = window.innerWidth - rect.right;
    const tooltipWidth = 350; 
    const preferRight = spaceOnRight > tooltipWidth; 
    
    setTooltipPosition({
      x: preferRight ? rect.right + 10 : rect.left - (tooltipWidth - 8),
      y: rect.top,
      side: preferRight ? 'right' : 'left'
    });

    setShowTooltip(true);
  };

  const handleEventMouseLeave = () => {
    hideTooltipTimer.current = setTimeout(() => {
      setShowTooltip(false);
    }, 100); 
  };

  const handleTooltipMouseEnter = () => {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current);
    }
  };
  
  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative group">
      {/* Event Item */}
      <div
        className={`p-2 rounded-r-md cursor-pointer transition-all duration-200 group-hover:shadow-md group-hover:opacity-95 ${colorClass} mb-1`}
        onMouseEnter={handleEventMouseEnter}
        onMouseLeave={handleEventMouseLeave}
      >
        <div className="text-sm font-semibold">{event.title}</div>
        {event.startTime && event.endTime && (
          <div className="text-xs opacity-80 mt-1 font-medium">
            {moment(event.startTime).format("HH:mm")} - {moment(event.endTime).format("HH:mm")}
          </div>
        )}
        {event.classInfo && (
          <div className="text-xs opacity-80 mt-1 line-clamp-1">
            {event.classInfo.name} {event.classInfo.class_code && `(${event.classInfo.class_code})`}
          </div>
        )}
        {event.description && (
          <div className="text-xs opacity-80 mt-1 line-clamp-2">
            {event.description}
          </div>
        )}
      </div>

      {/* Tooltip (Đã sửa layout) */}
      {showTooltip && (
        <div 
          className="fixed z-[9999] bg-white border border-[#ece7de] rounded-xl shadow-xl min-w-[300px] max-w-[350px] text-foreground"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* Mũi tên (Arrow) */}
          {tooltipPosition.side === 'right' ? (
            <div className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white drop-shadow-sm"></div>
          ) : (
            <div className="absolute -right-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white drop-shadow-sm"></div>
          )}
          
          {/* Nội dung chính của Tooltip */}
          <div className="p-4 space-y-3">
            
            {/* SỬA LAYOUT: Title và Buttons ngang hàng */}
            <div className="flex items-start justify-between gap-2">
              {/* Title */}
              <h3 className="font-semibold text-foreground text-base leading-tight pr-2">
                {event.title}
              </h3>
              
              {/* Action Buttons (Chỉ icon) + Color Dot */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {role === "teacher" && (
                  <>
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(event);
                          setShowTooltip(false);
                        }}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(event);
                          setShowTooltip(false);
                        }}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-100"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                {/* Color Dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${event.color === 'blue' ? 'bg-blue-500' : event.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
            </div>
            {/* KẾT THÚC SỬA LAYOUT HEADER */}

            {/* Time */}
            {event.startTime && event.endTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {moment(event.startTime).format("HH:mm")} - {moment(event.endTime).format("HH:mm")}
                </span>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {moment(event.date).format("dddd, DD/MM/YYYY")}
              </span>
            </div>

            {/* Class Info */}
            {event.classInfo && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {event.classInfo.name}
                  {event.classInfo.class_code && (
                    <span className="text-muted-foreground ml-1">({event.classInfo.class_code})</span>
                  )}
                </span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="border-t border-border pt-3">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlignLeft className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Mô tả:</p>
                    <p className="text-sm text-secondary leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Link */}
            {event.meetingLink && (
              <div className="border-t border-border pt-3">
                <div className="flex items-start gap-2 text-primary">
                  <Video className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-2">Cuộc họp trực tuyến:</p>
                    {(() => {
                      const now = new Date();
                      const endTime = new Date(event.endTime);
                      const isMeetingExpired = now > endTime;
                      const timeLeft = endTime.getTime() - now.getTime();
                      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {isMeetingExpired ? (
                              <div className="flex items-center gap-1 px-3 py-2 bg-muted text-muted-foreground text-sm rounded-lg cursor-not-allowed">
                                <Video className="w-4 h-4" />
                                Cuộc họp đã kết thúc
                              </div>
                            ) : (
                              <a
                                href={event.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-xs"
                                onClick={() => setShowTooltip(false)}
                              >
                                <Video className="w-4 h-4" />
                                Tham gia cuộc họp
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          
                          {isMeetingExpired ? (
                            <p className="text-xs text-destructive">
                              Cuộc họp đã kết thúc lúc {endTime.toLocaleString('vi-VN')}
                            </p>
                          ) : minutesLeft <= 10 && minutesLeft > 0 ? (
                            <p className="text-xs text-state-warning">
                              ⚠️ Cuộc họp sẽ kết thúc trong {minutesLeft} phút
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Click để tham gia cuộc họp trực tuyến
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* ĐÃ XÓA: Phần footer chứa button đã được di chuyển lên trên */}
        </div>
      )}
    </div>
  );
};

export default EventItem;
export type { ScheduleEvent, EventColor };