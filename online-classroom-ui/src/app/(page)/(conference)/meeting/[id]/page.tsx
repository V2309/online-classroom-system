

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import { getEventByMeetingId } from '@/lib/actions/schedule.action';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const MeetingPage = () => {
  const { id } = useParams();
  const { loading, user } = useUser();
  const { call, isCallLoading } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [isMeetingExpired, setIsMeetingExpired] = useState(false);

  // Kiểm tra thời gian hết hạn của meeting
  useEffect(() => {
    const checkMeetingTime = async () => {
      if (typeof id === 'string') {
        try {
          const event = await getEventByMeetingId(id);
          if (event) {
            setEventData(event);
            const now = new Date();
            const endTime = new Date(event.endTime);
            
            if (now > endTime) {
              setIsMeetingExpired(true);
            }
          }
        } catch (error) {
          console.error('Error checking meeting time:', error);
        }
      }
    };

    checkMeetingTime();
  }, [id]);

  if (loading || isCallLoading) return <Loader />;

  // Hiển thị thông báo khi meeting đã hết hạn
  if (isMeetingExpired && eventData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-center p-8 bg-white rounded-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cuộc họp đã kết thúc
          </h3>
          <p className="text-gray-600 mb-1">
            <strong>{eventData.title}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Cuộc họp đã kết thúc lúc {new Date(eventData.endTime).toLocaleString('vi-VN')}
          </p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  if (!call) return (
    <p className="text-center text-3xl font-bold text-white">
      Call Not Found
    </p>
  );

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {/* Hiển thị cảnh báo khi meeting sắp hết hạn */}
          {eventData && !isMeetingExpired && (
            (() => {
              const now = new Date();
              const endTime = new Date(eventData.endTime);
              const timeLeft = endTime.getTime() - now.getTime();
              const minutesLeft = Math.floor(timeLeft / (1000 * 60));
              
              if (minutesLeft <= 10 && minutesLeft > 0) {
                return (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg z-50">
                    ⚠️ Cuộc họp sẽ kết thúc trong {minutesLeft} phút
                  </div>
                );
              }
              return null;
            })()
          )}

          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default MeetingPage;
