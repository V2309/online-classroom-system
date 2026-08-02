/* eslint-disable camelcase */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from '@/components/HomeCard';
import MeetingModal from '@/components/MeetingModal';
import MeetingScheduleForm from '@/components/forms/MeetingScheduleForm';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from "@/hooks/useUser";
import { getTeacherClasses } from '@/lib/actions/class.action';
import Loader from '@/components/Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';

const initialValues = {
  dateTime: new Date(),
  description: '',
  link: '',
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [showMeetingScheduleForm, setShowMeetingScheduleForm] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  // Load teacher classes when component mounts
  useEffect(() => {
    const loadTeacherClasses = async () => {
      if (user?.role === 'teacher') {
        try {
          const classes = await getTeacherClasses();
          setTeacherClasses(classes);
        } catch (error) {
          console.error('Error loading teacher classes:', error);
        }
      }
    };

    loadTeacherClasses();
  }, [user]);

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');
      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || 'Instant Meeting';
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });
      setCallDetail(call);
      if (!values.description) {
        router.push(`/meeting/${call.id}`);
      }
      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  if (!client || !user) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 text-white">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="Cuộc họp ngay"
        description="Bắt đầu cuộc họp ngay"
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Tham gia cuộc họp"
        description="Qua liên kết mời"
        className="bg-blue-500"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Lên lịch "
        description="Đặt lịch cho cuộc họp"
        className="bg-purple-500"
        handleClick={() => setShowMeetingScheduleForm(true)}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="Xem bản ghi"
        description="Bản ghi cuộc họp"
        className="bg-yellow-500"
        handleClick={() => router.push('/recordings')}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Tạo cuộc họp"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-gray-700">
              Thêm mô tả
            </label>
            <Textarea
              className="border border-gray-300 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-gray-700">
              Chọn ngày và giờ
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded border border-gray-300 bg-gray-50 p-2 focus:outline-none"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Cuộc họp đã được tạo"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Đã sao chép liên kết' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Sao chép liên kết cuộc họp"
        />
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Nhập liên kết ở đây"
        className="text-center"
        buttonText="Tham gia cuộc họp"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Liên kết cuộc họp"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border border-gray-300 bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Bắt đầu cuộc họp ngay lập tức"
        className="text-center"
        buttonText="Bắt đầu cuộc họp"
        handleClick={createMeeting}
      />

      {/* Meeting Schedule Form */}
      {showMeetingScheduleForm && (
        <MeetingScheduleForm
          type="create"
          setOpen={setShowMeetingScheduleForm}
          onSuccess={() => {
            setShowMeetingScheduleForm(false);
            toast({ title: 'Lịch cuộc họp đã được tạo thành công!' });
          }}
          teacherClasses={teacherClasses.map((cls: any) => ({
            id: cls.id.toString(),
            name: cls.name,
            img: cls.img || '#3B82F6',
            class_code: cls.class_code || '',
            studentCount: cls._count?.students || 0,
            color: cls.img || '#3B82F6',
          }))}
        />
      )}
    </section>
  );
};

export default MeetingTypeList;
