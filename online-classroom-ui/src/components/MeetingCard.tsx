"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type MeetingCardProps = {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
};

export const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
}: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="flex min-h-[258px] w-full flex-col justify-between rounded-[14px] bg-white border border-gray-200 shadow-sm px-5 py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        <Image src={icon} alt="meeting" width={28} height={28} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-base font-normal text-gray-600">{date}</p>
          </div>
        </div>
      </article>
      <article className={cn("relative flex justify-center", {})}>
        <div className="relative flex w-full max-sm:hidden">
          <div className="flex-center absolute left-[136px] size-10 rounded-full border-[5px] border-gray-200 bg-gray-100 text-gray-600 text-sm font-medium">
            +5
          </div>
        </div>
        {!isPreviousMeeting && (
          <div className="flex gap-2">
            <Button onClick={handleClick} className="rounded bg-blue-600 hover:bg-blue-700 px-6 text-white">
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: "Đã sao chép link",
                  description: "Link cuộc họp đã được sao chép vào clipboard"
                });
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-6"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
              />
              &nbsp; Sao chép Link
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};