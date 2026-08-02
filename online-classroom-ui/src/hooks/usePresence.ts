// hooks/usePresence.ts
import { useEffect, useState } from "react";
import { globalPresenceManager } from "@/lib/presence-manager";
import { type Channel, type Members } from "pusher-js";

interface Member {
  id: string;
  info: {
    username: string;
    img: string | null;
  };
}

export function usePresence(classCode: string) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classCode) return;

    const setupPresence = async () => {
      try {
        setIsLoading(true);
        
        // Lấy hoặc tạo channel
        let presenceChannel = globalPresenceManager.getChannel(classCode);
        
        if (!presenceChannel) {
          presenceChannel = await globalPresenceManager.subscribeToClass(classCode);
        }

        if (!presenceChannel) {
          console.error(`[usePresence] Failed to get channel for class: ${classCode}`);
          return;
        }

        setChannel(presenceChannel);

        // Setup listeners
        const handleSubscriptionSucceeded = (members: Members) => {
          const memberArray: Member[] = [];
          members.each((member: Member) => memberArray.push(member));
          setOnlineMembers(memberArray);
          setIsLoading(false);
        };

        const handleMemberAdded = (member: Member) => {
          setOnlineMembers(prev => {
            if (prev.some(m => String(m.id) === String(member.id))) {
              return prev;
            }
            return [...prev, member];
          });
        };

        const handleMemberRemoved = (member: Member) => {
          setOnlineMembers(prev => 
            prev.filter(m => String(m.id) !== String(member.id))
          );
        };

        // Bind events
        presenceChannel.bind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
        presenceChannel.bind("pusher:member_added", handleMemberAdded);
        presenceChannel.bind("pusher:member_removed", handleMemberRemoved);

        // Cleanup function
        return () => {
          presenceChannel?.unbind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
          presenceChannel?.unbind("pusher:member_added", handleMemberAdded);
          presenceChannel?.unbind("pusher:member_removed", handleMemberRemoved);
        };

      } catch (error) {
        console.error("[usePresence] Error setting up presence:", error);
        setIsLoading(false);
      }
    };

    const cleanup = setupPresence();

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [classCode]);

  return {
    channel,
    onlineMembers,
    isLoading,
  };
}