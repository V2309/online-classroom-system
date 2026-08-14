// components/CollaborativeWhiteboard.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Tldraw, Editor, StoreSnapshot, TLRecord } from "tldraw";
import "tldraw/tldraw.css";
import { useUser } from "@/hooks/useUser";
import { pusherClient } from "@/lib/pusher-client";
import { whiteboardService } from "@/services/whiteboard.service";
import { toast } from "react-toastify";
import { throttle, debounce } from "lodash";

// Interface for peer cursor data
interface PeerCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface CollaborativeWhiteboardProps {
  classCode: string;
  onReady?: (methods: { save: () => Promise<void>; clear: () => Promise<void>; isSaving: boolean }) => void;
}

export default function CollaborativeWhiteboard({ classCode, onReady }: CollaborativeWhiteboardProps) {
  const { user } = useUser();
  const [initialData, setInitialData] = useState<StoreSnapshot<TLRecord> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [peerCursors, setPeerCursors] = useState<Map<string, PeerCursor>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const editorRef = useRef<Editor | null>(null);
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);
  const autoSaveBackupRef = useRef<NodeJS.Timeout | null>(null);
  const cursorCleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update peer cursor position
  const updatePeerCursor = useCallback((cursorData: any) => {
    const peerCursor: PeerCursor = {
      id: cursorData.id,
      name: cursorData.name,
      color: cursorData.color,
      x: cursorData.x,
      y: cursorData.y,
      lastSeen: Date.now(),
    };
    
    setPeerCursors(prevCursors => {
      const newCursors = new Map(prevCursors);
      newCursors.set(cursorData.id, peerCursor);
      return newCursors;
    });
  }, []);

  // Integration test function for debugging cursor functionality
  // Cleanup stale peer cursors (remove cursors that haven't been updated in 5 seconds)
  useEffect(() => {
    cursorCleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setPeerCursors(prevCursors => {
        const updatedCursors = new Map(prevCursors);
        let hasChanges = false;
        
        Array.from(updatedCursors.entries()).forEach(([id, cursor]) => {
          if (now - cursor.lastSeen > 5000) { // 5 seconds timeout
            updatedCursors.delete(id);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updatedCursors : prevCursors;
      });
    }, 5000); // Check every 5 seconds (increased from 2 seconds)
    
    return () => {
      if (cursorCleanupIntervalRef.current) {
        clearInterval(cursorCleanupIntervalRef.current);
      }
    };
  }, []);
  const testCursorFunctionality = useCallback(() => {
    console.log('🧪 [CURSOR TEST] Starting cursor functionality test...');
    
    if (!user) {
      console.error('❌ [CURSOR TEST] No user found!');
      return { success: false, error: 'No user found' };
    }
    
    if (!editorRef.current) {
      console.error('❌ [CURSOR TEST] No editor found!');
      return { success: false, error: 'No editor found' };
    }

    console.log('✅ [CURSOR TEST] User found:', user);
    console.log('✅ [CURSOR TEST] Editor found:', !!editorRef.current);
    
    // Test user preferences
    const expectedColor = user.role === 'teacher' ? '#FF0000' : '#3B82F6';
    console.log('🎨 [CURSOR TEST] Expected user color:', expectedColor);
    
    // Test simulated cursor broadcast
    const testCursorData = {
      id: user.id,
      name: user.username,
      color: expectedColor,
      x: 100,
      y: 100
    };
    
    console.log('📡 [CURSOR TEST] Test cursor data:', testCursorData);
    
    return {
      success: true,
      user,
      editor: !!editorRef.current,
      testCursorData,
      classCode,
      peerCursorsCount: peerCursors.size,
      peerCursors: Array.from(peerCursors.values())
    };
  }, [user, classCode, peerCursors]);

  // Expose test function to window for browser console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testWhiteboardCursor = testCursorFunctionality;
    }
  }, [testCursorFunctionality]);

  // 1. Tải dữ liệu cũ khi mới vào
  useEffect(() => {
    const loadData = async () => {
      const data = await whiteboardService.getWhiteboardState(classCode);
      if (data) {
        setInitialData(data as any);
      }
      setIsReady(true);
    };
    loadData();
  }, [classCode]);

  // Hàm save whiteboard
  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    try {
      setIsSaving(true);
      const editor = editorRef.current;
      
      // Đảm bảo tất cả text editing được commit trước khi lưu
      if (editor.getEditingShapeId()) {
        editor.complete(); // Complete any ongoing text editing
      }
      
      // Đợi một chút để đảm bảo store được update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const snapshot = editor.store.getStoreSnapshot();
      // Serialize snapshot thành plain object để gửi lên API
      const serializedSnapshot = JSON.parse(JSON.stringify(snapshot));
      await whiteboardService.saveWhiteboardState(classCode, serializedSnapshot);
      toast.success("Đã lưu bảng trắng", { position: "bottom-right" });
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      toast.error("Lỗi khi lưu bảng trắng", { position: "bottom-right" });
    } finally {
      setIsSaving(false);
    }
  }, [classCode]);

  // Hàm clear whiteboard
  const handleClear = useCallback(async () => {
    if (!editorRef.current) return;
    if (!confirm("Bạn có chắc muốn xóa tất cả nội dung trên bảng trắng?")) return;
    
    try {
      const editor = editorRef.current;
      // Lấy tất cả shapes từ store và xóa chúng
      const allRecords = editor.store.allRecords();
      const shapeIds = allRecords
        .filter((record: any) => record.typeName === 'shape')
        .map((record: any) => record.id);
      
      if (shapeIds.length > 0) {
        editor.deleteShapes(shapeIds);
      }
      // Lưu state sau khi xóa
      const snapshot = editor.store.getStoreSnapshot();
      const serializedSnapshot = JSON.parse(JSON.stringify(snapshot));
      await whiteboardService.saveWhiteboardState(classCode, serializedSnapshot);
      toast.success("Đã xóa bảng trắng", { position: "bottom-right" });
    } catch (error) {
      console.error("Error clearing whiteboard:", error);
      toast.error("Lỗi khi xóa", { position: "bottom-right" });
    }
  }, [classCode]);

  // Debounced save function sẽ được tạo trong handleMount sau khi editor sẵn sàng

  // Lưu trước khi reload/close tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current && debouncedSaveRef.current) {
        // Cancel debounced và save ngay lập tức
        debouncedSaveRef.current.cancel();
        const snapshot = editorRef.current.store.getStoreSnapshot();
        // Save trực tiếp (async nhưng browser sẽ giữ connection)
        const serialized = JSON.parse(JSON.stringify(snapshot));
        whiteboardService.saveWhiteboardState(classCode, serialized).catch(console.error);
      }
    };

    // Lưu khi component unmount (reload trang)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && editorRef.current && debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
        const snapshot = editorRef.current.store.getStoreSnapshot();
        const serialized = JSON.parse(JSON.stringify(snapshot));
        whiteboardService.saveWhiteboardState(classCode, serialized).catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Save khi component unmount
      if (editorRef.current && debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
        const snapshot = editorRef.current.store.getStoreSnapshot();
        const serialized = JSON.parse(JSON.stringify(snapshot));
        whiteboardService.saveWhiteboardState(classCode, serialized).catch(console.error);
      }
    };
  }, [classCode]);

  // 2. Xử lý khi Editor đã sẵn sàng (Mount)
  const handleMount = useCallback((editor: Editor) => {
    if (!user) return;
    editorRef.current = editor;

    // Cleanup previous debounced save nếu có
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
    }

    // Tạo debounced save mới - tự động lưu sau 3s khi có thay đổi (increased from 1.5s)
    debouncedSaveRef.current = debounce(async () => {
      try {
        // Đảm bảo text editing được commit trước khi auto-save
        if (editor.getEditingShapeId()) {
          editor.complete();
          // Đợi một chút để store update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const snapshot = editor.store.getStoreSnapshot();
        const serialized = JSON.parse(JSON.stringify(snapshot));
        await whiteboardService.saveWhiteboardState(classCode, serialized);
      } catch (error) {
        console.error("Error auto saving whiteboard:", error);
      }
    }, 3000); // Increased from 1.5s to 3s

    // Gọi onReady ngay sau khi editor mount
    if (onReady) {
      onReady({
        save: handleSave,
        clear: handleClear,
        isSaving,
      });
    }

    // --- CẤU HÌNH USER ---
    // Set thông tin user để hiện tên cạnh con trỏ chuột
    const userPreferences = {
      id: user.id,
      name: user.username,
      color: user.role === 'teacher' ? '#FF0000' : '#3B82F6', // Giáo viên màu đỏ, HS màu xanh
    };
    editor.user.updateUserPreferences(userPreferences);

    // --- KẾT NỐI PUSHER ---
    const channelName = `private-board-${classCode}`;
    const channel = pusherClient.subscribe(channelName);
    
    // Monitor connection status
    const handleConnectionStateChange = (state: string) => {
      console.log('Pusher connection state:', state);
      setConnectionStatus(state as any);
      
      if (state === 'connected') {
        // Clear any reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else if (state === 'disconnected' || state === 'unavailable') {
        // Attempt reconnection after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          try {
            pusherClient.connect();
          } catch (error) {
            console.error('Failed to reconnect:', error);
          }
        }, 3000);
      }
    };
    
    pusherClient.connection.bind('state_change', handleConnectionStateChange);
    pusherClient.connection.bind('connected', () => setConnectionStatus('connected'));
    pusherClient.connection.bind('disconnected', () => setConnectionStatus('disconnected'));
    pusherClient.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
      setConnectionStatus('error');
    });

    // A. GỬI DỮ LIỆU ĐI (Khi mình vẽ)
    // Dùng throttle để không spam server (gửi mỗi 100ms instead of 50ms)
    const broadcastUpdate = throttle((updates: any) => {
      // "client-update" là sự kiện client-to-client (cần bật trong Dashboard)
      try {
        channel.trigger("client-update", updates);
      } catch (error) {
        console.error('Failed to broadcast update:', error);
      }
    }, 100); // Increased from 50ms to 100ms

    const broadcastCursor = throttle((cursorData: any) => {
      try {
        channel.trigger("client-cursor", cursorData);
      } catch (error) {
        console.error('Failed to broadcast cursor:', error);
      }
    }, 100); // Increased from 50ms to 100ms

    // Lắng nghe sự thay đổi của store (vẽ, xóa, sửa)
    const cleanupListener = editor.store.listen((entry) => {
      // Chỉ gửi những thay đổi do chính mình tạo ra (source === 'user')
      if (entry.source !== 'user') return;

      const changes = entry.changes;
      // Lọc ra các thay đổi về hình dáng/nét vẽ
      const updates = {
        added: changes.added,
        updated: changes.updated,
        removed: changes.removed,
      };
      
      // Nếu có thay đổi về hình ảnh/nét vẽ -> Gửi đi
      if (Object.keys(updates.added).length || Object.keys(updates.updated).length || Object.keys(updates.removed).length) {
        broadcastUpdate(updates);
        // Auto save khi có thay đổi - sử dụng ref để tránh recreate
        if (debouncedSaveRef.current) {
          debouncedSaveRef.current();
        }
      }
    });

    // Lắng nghe khi kết thúc text editing để auto-save
    let lastEditingShapeId: string | null = null;
    const checkEditingComplete = () => {
      const currentEditingId = editor.getEditingShapeId();
      if (lastEditingShapeId && !currentEditingId) {
        // Text editing vừa kết thúc, trigger auto-save
        if (debouncedSaveRef.current) {
          debouncedSaveRef.current();
        }
      }
      lastEditingShapeId = currentEditingId;
    };
    
    const editingCheckInterval = setInterval(checkEditingComplete, 500);

    // Lắng nghe sự di chuyển chuột (để hiện con trỏ của người khác)
    let isPointerListenerActive = true;
    editor.on('event', (event) => {
        if (!isPointerListenerActive) return;
        if (event.type === 'pointer' && event.name === 'pointer_move') {
          // Gửi vị trí chuột đi
          broadcastCursor({
              id: user.id,
              name: user.username,
              color: user.role === 'teacher' ? '#FF0000' : '#3B82F6',
              x: event.point.x,
              y: event.point.y
          });
        }
    });


    // B. NHẬN DỮ LIỆU VỀ (Khi người khác vẽ)
    channel.bind("client-update", (updates: any) => {
      // Áp dụng thay đổi từ người khác vào bảng của mình
      try {
        editor.store.mergeRemoteChanges(() => {
          if (updates.added && Object.keys(updates.added).length > 0) {
            editor.store.put(Object.values(updates.added));
          }
          if (updates.updated && Object.keys(updates.updated).length > 0) {
            editor.store.put(Object.values(updates.updated).map((u: any) => u[1]));
          }
          if (updates.removed && Object.keys(updates.removed).length > 0) {
            editor.store.remove(Object.keys(updates.removed) as any);
          }
        });
      } catch (error) {
        console.error('Failed to apply remote changes:', error);
        // Try to recover by reloading the whiteboard state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });

    // Nhận vị trí chuột của người khác
    channel.bind("client-cursor", (data: any) => {
        if (data.id === user.id) return; // Bỏ qua chính mình
        // Update peer cursor position
        updatePeerCursor(data);
    });

    // C. LƯU TỰ ĐỘNG BACKUP (Mỗi 30s như một backup nếu debounced save bị miss)
    autoSaveBackupRef.current = setInterval(async () => {
      try {
        // Only backup if editor is still active
        if (!editorRef.current) return;
        
        // Commit text nếu đang edit
        if (editor.getEditingShapeId()) {
          editor.complete();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const snapshot = editor.store.getStoreSnapshot();
        const serialized = JSON.parse(JSON.stringify(snapshot));
        await whiteboardService.saveWhiteboardState(classCode, serialized);
      } catch (error) {
        console.error("Error backup saving whiteboard:", error);
      }
    }, 30000); // Increased from 15s to 30s

    // Cleanup
    return () => {
      isPointerListenerActive = false; // Dừng lắng nghe chuột
      cleanupListener();
      clearInterval(editingCheckInterval); // Dừng kiểm tra editing
      
      // Clear all timeouts and intervals
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel(); // Hủy debounced save nếu còn pending
      }
      if (autoSaveBackupRef.current) {
        clearInterval(autoSaveBackupRef.current);
      }
      if (cursorCleanupIntervalRef.current) {
        clearInterval(cursorCleanupIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Cleanup Pusher connections
      try {
        pusherClient.connection.unbind('state_change', handleConnectionStateChange);
        pusherClient.connection.unbind('connected');
        pusherClient.connection.unbind('disconnected');
        pusherClient.connection.unbind('error');
        pusherClient.unsubscribe(channelName);
      } catch (error) {
        console.error('Error during Pusher cleanup:', error);
      }
    };

  }, [user, classCode, handleSave, handleClear, isSaving, onReady, updatePeerCursor]);

  // Update button state khi isSaving thay đổi
  useEffect(() => {
    if (isReady && editorRef.current && onReady) {
      onReady({
        save: handleSave,
        clear: handleClear,
        isSaving,
      });
    }
  }, [isReady, handleSave, handleClear, isSaving, onReady]);

  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bảng trắng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <Tldraw
        onMount={handleMount}
        snapshot={initialData || undefined}
      />
      
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-40">
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : connectionStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' 
              ? 'bg-green-500' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
          }`} />
          {connectionStatus === 'connected' ? 'Đã kết nối' : 
           connectionStatus === 'connecting' ? 'Đang kết nối...' : 'Mất kết nối'}
        </div>
      </div>
      
      {/* Render peer cursors */}
      {Array.from(peerCursors.values()).map((cursor) => (
        <div
          key={cursor.id}
          className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Cursor icon */}
          <div 
            className="w-4 h-4 rotate-12"
            style={{ color: cursor.color }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-full h-full drop-shadow-md"
            >
              <path d="M8.5,2.5L8.5,17.5L12.5,13.5L16.5,17.5L20.5,13.5L12.5,2.5Z" />
            </svg>
          </div>
          
          {/* Username label */}
          <div 
            className="absolute top-5 left-2 px-2 py-1 text-xs font-medium text-white rounded-md shadow-lg whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}