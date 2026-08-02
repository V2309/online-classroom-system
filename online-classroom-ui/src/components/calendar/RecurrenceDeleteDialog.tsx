"use client";

interface RecurrenceDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectAll: () => void;
  totalEvents: number;
  eventTitle: string;
}

const RecurrenceDeleteDialog = ({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectAll,
  totalEvents,
  eventTitle
}: RecurrenceDeleteDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Xóa sự kiện lặp lại
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {eventTitle} là một phần của chuỗi {totalEvents} lịch học lặp lại
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Option 1: Delete only this event */}
          <button
            onClick={onSelectSingle}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-1 group-hover:border-red-500 flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full m-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-red-900">
                  Chỉ lịch học này
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Xóa chỉ lịch học được chọn, các lịch học khác trong chuỗi lặp lại vẫn giữ nguyên
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Delete all events */}
          <button
            onClick={onSelectAll}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-1 group-hover:border-red-500 flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full m-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 group-hover:text-red-900">
                  Tất cả lịch học lặp lại
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Xóa tất cả {totalEvents} lịch học trong chuỗi lặp lại này
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceDeleteDialog;