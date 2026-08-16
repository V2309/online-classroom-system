import { CallList } from "@/components/CallList";

const RecordingsPage = () => {
  return (
    <div className="flex size-full flex-col gap-6 bg-background text-foreground min-h-screen p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Bản ghi cuộc họp</h1>
        <p className="text-secondary">Xem lại các cuộc họp đã được ghi lại</p>
      </div>

      <div className="">
        <CallList type="recordings" />
      </div>
    </div>
  );
};

export default RecordingsPage;