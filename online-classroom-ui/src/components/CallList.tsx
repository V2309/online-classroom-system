"use client";

import { type Call, type CallRecording } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/use-toast";
import { useGetCalls } from "@/hooks/useGetCalls";

import Loader  from "@/components/Loader";
import { MeetingCard } from "@/components/MeetingCard";

type CallListType = {
  type: "ended" | "upcoming" | "recordings";
};

export const CallList = ({ type }: CallListType) => {
  const router = useRouter();
  const { toast } = useToast();

  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();

  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;

      case "recordings":
        return recordings;

      case "upcoming":
        return upcomingCalls;

      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case "ended":
        return "Không có cuộc họp nào đã kết thúc.";

      case "recordings":
        return "Chưa có bản ghi nào.";

      case "upcoming":
        return "Không có cuộc họp sắp tới.";

      default:
        return "Không có cuộc họp.";
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!callRecordings) return;

      try {
        const callData = await Promise.all(
          callRecordings.map((call) => call.queryRecordings())
        );

        const recordings = callData
          .filter((call) => call.recordings.length > 0)
          .flatMap((call) => call.recordings);

        setRecordings(recordings);
      } catch (error) {
        toast({ title: "Thử lại sau." });
      }
    };

    if (type === "recordings") fetchRecordings();
  }, [type, callRecordings, toast]);

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  if (isLoading) return <Loader />;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((call: Call | CallRecording, i) => (
          <MeetingCard
            key={(call as Call).id || i}
            title={
              (call as Call).state?.custom?.description?.substring(0, 26) ||
              (call as CallRecording)?.filename?.substring(0, 20) ||
              "Cuộc họp cá nhân"
            }
            date={
              (call as Call).state?.startsAt?.toLocaleString('vi-VN') ||
              new Date((call as CallRecording).start_time).toLocaleString('vi-VN')
            }
            icon={
              type === "ended"
                ? "/icons/previous.svg"
                : type === "upcoming"
                  ? "/icons/upcoming.svg"
                  : "/icons/recordings.svg"
            }
            isPreviousMeeting={type === "ended"}
            buttonIcon1={type === "recordings" ? "/icons/play.svg" : undefined}
            buttonText={type === "recordings" ? "Phát" : "Bắt đầu"}
            handleClick={
              type === "recordings"
                ? () => router.push(`${(call as CallRecording).url}`)
                : () => router.push(`/meeting/${(call as Call).id}`)
            }
            link={
              type === "recordings"
                ? (call as CallRecording).url
                : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${
                    (call as Call).id
                  }`
            }
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-400 text-lg">{noCallsMessage}</div>
        </div>
      )}
    </div>
  );
};