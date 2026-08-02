// lib/presence-manager.ts
import { pusherClient } from "./pusher-client";
import { type Channel } from "pusher-js";

class GlobalPresenceManager {
  private channels: Map<string, Channel> = new Map();
  private isAuthenticated = false;

  async authenticate() {
    if (this.isAuthenticated) return;
    
    try {
      await pusherClient.signin();
      this.isAuthenticated = true;
      console.log("[GlobalPresenceManager] User authenticated successfully");
    } catch (error) {
      console.error("[GlobalPresenceManager] Authentication error:", error);
      throw error;
    }
  }

  async subscribeToClass(classCode: string): Promise<Channel | null> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const channelName = `presence-class-${classCode}`;
    
    // Nếu đã subscribe rồi thì trả về channel hiện tại
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    try {
      const channel = pusherClient.subscribe(channelName);
      this.channels.set(channelName, channel);
      
      console.log(`[GlobalPresenceManager] Subscribed to ${channelName}`);
      return channel;
    } catch (error) {
      console.error(`[GlobalPresenceManager] Error subscribing to ${channelName}:`, error);
      return null;
    }
  }

  getChannel(classCode: string): Channel | null {
    const channelName = `presence-class-${classCode}`;
    return this.channels.get(channelName) || pusherClient.channel(channelName);
  }

  unsubscribeFromClass(classCode: string) {
    const channelName = `presence-class-${classCode}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      pusherClient.unsubscribe(channelName);
      this.channels.delete(channelName);
      console.log(`[GlobalPresenceManager] Unsubscribed from ${channelName}`);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      pusherClient.unsubscribe(channelName);
    });
    this.channels.clear();
    this.isAuthenticated = false;
    console.log("[GlobalPresenceManager] Unsubscribed from all channels");
  }

  getSubscribedChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Get current members from a presence channel
  getCurrentMembers(classCode: string): any[] {
    const channel = this.getChannel(classCode);
    if (!channel) {
      console.log(`[GlobalPresenceManager] No channel found for class: ${classCode}`);
      return [];
    }
    
    const members: any[] = [];
    try {
      // Cast to any to access members property
      const presenceChannel = channel as any;
      if (presenceChannel.members && presenceChannel.members.each) {
        presenceChannel.members.each((member: any) => members.push(member));
        console.log(`[GlobalPresenceManager] Retrieved ${members.length} members for class: ${classCode}`);
      } else {
        console.log(`[GlobalPresenceManager] Channel exists but no members property for class: ${classCode}`);
      }
    } catch (error) {
      console.error('[GlobalPresenceManager] Error getting current members:', error);
    }
    
    return members;
  }
}

// Export singleton instance
export const globalPresenceManager = new GlobalPresenceManager();