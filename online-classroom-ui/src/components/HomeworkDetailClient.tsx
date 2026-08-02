"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import PDFViewer from "@/components/PDFViewer";
import DocxViewer from "@/components/DocxViewer";

interface HomeworkDetailClientProps {
  submission: any;
  parsedAnswers?: Record<string | number, string | { answer?: string; score?: number; feedback?: string }> | null;
}

// Helper functions để kiểm tra loại file
function isPDF(fileType: string | null, fileName?: string | null) {
  if (!fileType) return false;
  return fileType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");
}

function isWord(fileType: string | null, fileName?: string | null) {
  if (!fileType) return false;
  const lowerFileName = fileName?.toLowerCase();
  return fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
         fileType === "application/msword" ||
         lowerFileName?.endsWith(".doc") ||
         lowerFileName?.endsWith(".docx");
}

export default function HomeworkDetailClient({ submission, parsedAnswers }: HomeworkDetailClientProps) {
  const [showOriginalOrder, setShowOriginalOrder] = useState(false);

  const homework = submission.homework;
  
  // Debug log để kiểm tra dữ liệu
  console.log("Submission Debug:", {
    submissionId: submission.id,
    questionAnswers: submission.questionAnswers,
    questionAnswersLength: submission.questionAnswers?.length || 0,
    homework: {
      id: homework.id,
      title: homework.title,
      studentViewPermission: homework.studentViewPermission,
      endTime: homework.endTime
    }
  });
  
  // Tính toán số câu đúng, sai, và chưa làm
  const totalQuestions = submission.questionAnswers?.length || 0;
  const correctAnswers = submission.questionAnswers?.filter((qa: any) => qa.isCorrect).length || 0;
  const incorrectAnswers = submission.questionAnswers?.filter((qa: any) => !qa.isCorrect && qa.answer).length || 0;
  const unansweredQuestions = totalQuestions - correctAnswers - incorrectAnswers;
  
  // Kiểm tra quyền xem điểm và thời gian hết hạn
  const isExpired = homework.endTime ? new Date() > new Date(homework.endTime) : false;
  const canViewScore = homework.studentViewPermission !== 'NO_VIEW';
  const shouldShowScore = canViewScore || isExpired;
  const canViewDetails = homework.studentViewPermission === 'SCORE_AND_RESULT' || isExpired;

  // Debug logs
  console.log('Debug Detail Page:', {
    studentViewPermission: homework.studentViewPermission,
    endTime: homework.endTime,
    currentTime: new Date(),
    isExpired,
    canViewScore,
    shouldShowScore,
    canViewDetails,
    questionAnswersLength: submission.questionAnswers?.length
  });



  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen h-screen overflow-hidden">
   
      {/* Bên trái: Hiển thị đề thi */}
      <div className="flex-1 bg-white rounded shadow p-6 h-full overflow-y-auto">
        <div className="flex items-baseline gap-2 mb-4">
        <Link href={`/class/${submission.homework.classCode}/homework/list`} className="text-xl font-bold mb-4">Bài tập</Link>
        <div className="icon line-height-1">
        <ArrowRight size={16} />
        </div>
        <h2 className="text-xl font-bold mb-4 text-blue-500">{submission.homework.title}</h2>
        </div>
        
        {/* Toggle switch cho chế độ hiển thị đề - chỉ hiển thị khi có shuffle */}
        {submission.homework.type === "extracted" && (submission.homework.isShuffleQuestions || submission.homework.isShuffleAnswers) && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Chế độ xem đề:</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${!showOriginalOrder ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Đề học sinh làm
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOriginalOrder}
                    onChange={(e) => setShowOriginalOrder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`text-xs ${showOriginalOrder ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Đề gốc
                </span>
              </div>
            </div>
            
            {/* Thông báo về chế độ hiện tại */}
            <p className="text-xs text-gray-600">
              {showOriginalOrder 
                ? "Đang xem đề theo thứ tự gốc ban đầu" 
                : "Đang xem đề theo thứ tự mà bạn đã làm bài (đã được shuffle)"}
            </p>
          </div>
        )}

        {/* Kiểm tra quyền xem lại đề */}
        {homework.blockViewAfterSubmit && submission.submittedAt ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Không thể xem lại đề</h3>
              <p className="text-yellow-700">
                Giáo viên đã chặn việc xem lại đề thi sau khi nộp bài.
                <br />
                Bạn có thể xem kết quả bài làm ở bên phải.
              </p>
            </div>
          </div>
        ) : submission.homework.type === "essay" ? (
          // Hiển thị câu hỏi tự luận
          <div className="space-y-6">
            {submission.homework.questions?.map((question: any, index: number) => {
              // Lấy câu trả lời từ parsedAnswers với xử lý cả 2 format
              let studentAnswer = "";
              let questionScore = null;
              let feedback = null;
              
              // Parse content để lấy thông tin
              if (parsedAnswers) {
                const answerData = parsedAnswers[question.id] || parsedAnswers[question.id.toString()];
                if (typeof answerData === 'string') {
                  // Format cũ: content[questionId] = "answer text"
                  studentAnswer = answerData;
                } else if (typeof answerData === 'object' && answerData) {
                  // Format mới: content[questionId] = { answer: "text", score: number, feedback: "text" }
                  studentAnswer = answerData.answer || "";
                  questionScore = answerData.score;
                  feedback = answerData.feedback;
                }
              }
              
              // Fallback: tìm trong questionAnswers nếu cần
              if (!studentAnswer || questionScore === null) {
                const questionAnswer = submission.questionAnswers?.find((qa: any) => 
                  qa.questionId === question.id || qa.questionId === question.id.toString()
                );
                
                if (questionAnswer) {
                  if (!studentAnswer && questionAnswer.answer) {
                    studentAnswer = questionAnswer.answer;
                  }
                  if (questionScore === null && questionAnswer.score !== null && questionAnswer.score !== undefined) {
                    questionScore = questionAnswer.score;
                  }
                  if (!feedback && questionAnswer.feedback) {
                    feedback = questionAnswer.feedback;
                  }
                }
              }
                
              return (
                <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Câu {index + 1} ({question.point || 0} điểm)
                    </h4>
                    {questionScore !== null && questionScore !== undefined ? (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {questionScore}/{question.point} điểm
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                        Chưa chấm
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-800 mb-2">Câu hỏi:</div>
                    <div className="text-gray-700 whitespace-pre-line">
                      {question.content || question.questionText}
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">Câu trả lời của bạn:</div>
                    {studentAnswer ? (
                      <div className="text-blue-700 whitespace-pre-line leading-relaxed">
                        {studentAnswer}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Bạn chưa trả lời câu hỏi này</div>
                    )}
                  </div>
                  
                  {feedback && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="font-medium text-yellow-800 mb-2">Nhận xét của giáo viên:</div>
                      <div className="text-yellow-700 whitespace-pre-line leading-relaxed">
                        {feedback}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Hiển thị file đề thi theo type khi được phép xem
          <>
            {submission.homework.type === "extracted" ? (
              // Với bài tập extracted, hiển thị theo chế độ được chọn
              showOriginalOrder ? (
                // Hiển thị file PDF gốc
                submission.homework.originalFileUrl ? (
                  <div className="mb-4">
                    {isPDF(submission.homework.originalFileType, submission.homework.originalFileName) ? (
                      <PDFViewer fileUrl={submission.homework.originalFileUrl} />
                    ) : isWord(submission.homework.originalFileType, submission.homework.originalFileName) ? (
                      <DocxViewer fileUrl={submission.homework.originalFileUrl} />
                    ) : (
                      <a
                        href={submission.homework.originalFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {submission.homework.originalFileName} ({submission.homework.originalFileType})
                      </a>
                    )}
                  </div>
                ) : (
                  <p>Không có file đề thi gốc.</p>
                )
              ) : (
                // Hiển thị câu hỏi theo thứ tự đã làm bài (như trang test)
                <div className="space-y-4">
                  {submission.questionAnswers.map((qa: any, index: number) => (
                    <div key={qa.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                      <h3 className="font-semibold mb-3 text-gray-800">
                        {qa.question.content}
                      </h3>
                      <div className="space-y-2">
                        {qa.question.options && typeof qa.question.options === 'object' && 
                         Object.entries(qa.question.options).map(([key, value], optionIndex) => {
                           const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D, ...
                           return (
                             <div 
                               key={key} 
                               className={`p-2 rounded border ${
                                 qa.answer === key ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'
                               }`}
                             >
                               <span className="font-medium">{letter}.</span> {value as string}
                               {qa.answer === key && (
                                 <span className="ml-2 text-blue-600 font-semibold">(Đã chọn)</span>
                               )}
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Với bài tập original, hiển thị từ attachments
              submission.homework.attachments.length > 0 ? (
                submission.homework.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="mb-4">
                    {isPDF(attachment.type, attachment.name) ? (
                      <PDFViewer fileUrl={attachment.url} />
                    ) : isWord(attachment.type, attachment.name) ? (
                      <DocxViewer fileUrl={attachment.url} />
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {attachment.name} ({attachment.type})
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p>Không có file đề thi.</p>
              )
            )}
          </>
        )}
      </div>

      {/* Bên phải: Hiển thị thông tin chi tiết bài làm */}
      <div className="w-full lg:w-[350px] bg-white rounded shadow p-6 flex flex-col gap-4 h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kết quả bài làm</h2>
        
        {/* Thông tin chung */}
        <div className="mb-4">
          {shouldShowScore ? (
            <p className="text-lg font-semibold">
              Tổng điểm: {submission.grade !== null ? (
                submission.homework.type === 'essay' ? (
                  // Với bài essay, hiển thị điểm thực tế trực tiếp
                  (() => {
                    const totalPoints = submission.homework.questions?.reduce((sum: any, q: any) => sum + (q.point || 0), 0) || 100;
                    return `${Math.round(submission.grade * 100) / 100}/${totalPoints}`;
                  })()
                ) : (
                  // Với bài trắc nghiệm, giữ nguyên /10
                  `${Math.round(submission.grade * 100) / 100}/10`
                )
              ) : 'Chờ chấm'}
            </p>
          ) : (
            <p className="text-lg font-semibold text-amber-600">Điểm sẽ có sau hết hạn làm bài</p>
          )}
          <p><strong>Thời gian làm bài:</strong> {
            submission.timeSpent 
              ? `${Math.floor(submission.timeSpent / 60)} phút ${submission.timeSpent % 60} giây`
              : 'Không có dữ liệu'
          }</p>
          <p><strong>Nộp lúc:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>
          
          {/* Thống kê khác nhau cho từng loại bài */}
          {canViewDetails && (
            <>
              {submission.homework.type === "essay" ? (
                <>
                  <p><strong>Loại bài:</strong> Tự luận</p>
                  <p><strong>Số câu hỏi:</strong> {submission.homework.questions?.length || 0}</p>
                  {submission.feedback && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Nhận xét của giáo viên:</p>
                      <p className="text-yellow-700 text-sm mt-1 whitespace-pre-line">{submission.feedback}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Số câu đúng:</strong> {correctAnswers}</p>
                  <p><strong>Số câu sai:</strong> {incorrectAnswers}</p>
                  <p><strong>Chưa làm:</strong> {unansweredQuestions}</p>
                </>
              )}
            </>
          )}
        </div>

        {canViewDetails ? (
          <>

            {/* Thông báo về đảo câu hỏi và đáp án */}
            {submission.homework.type === "extracted" && (
              <div className="mb-4 space-y-3">
                {/* Thông báo đảo thứ tự câu hỏi - chỉ hiển thị nếu isShuffleQuestions = true */}
                {submission.homework.isShuffleQuestions && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-xs">
                      <strong>Đảo đề:</strong> Giáo viên của bạn đã cài đặt đảo đề: Thứ tự câu hỏi lúc bạn bị đảo khi làm bài, quay về thứ tự gốc lúc xem kết quả.
                    </p>
                  </div>
                )}

                {/* Thông báo đảo thứ tự đáp án - chỉ hiển thị nếu isShuffleAnswers = true */}
                {submission.homework.isShuffleAnswers && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 text-xs">
                      <strong>Đảo thứ tự đáp án:</strong> Giáo viên của bạn đã cài đặt đảo thứ tự đáp án: Thứ tự đáp án mỗi câu lúc làm bài sẽ bị đảo so với đề gốc. Chú ý nội dung đáp án bạn chọn khi làm bài.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {submission.homework.type === "essay" ? (
              // Chi tiết từng câu essay trong sidebar
              <div className="max-h-96 overflow-y-auto space-y-3">
                {submission.homework.questions?.map((question: any, index: number) => {
                  // Lấy câu trả lời từ parsedAnswers với xử lý cả 2 format
                  let studentAnswer = "";
                  let questionScore = null;
                  let feedback = null;
                  
                  // Parse content để lấy thông tin
                  if (parsedAnswers) {
                    const answerData = parsedAnswers[question.id] || parsedAnswers[question.id.toString()];
                    if (typeof answerData === 'string') {
                      // Format cũ: content[questionId] = "answer text"
                      studentAnswer = answerData;
                    } else if (typeof answerData === 'object' && answerData) {
                      // Format mới: content[questionId] = { answer: "text", score: number, feedback: "text" }
                      studentAnswer = answerData.answer || "";
                      questionScore = answerData.score;
                      feedback = answerData.feedback;
                    }
                  }
                  
                  // Fallback: tìm trong questionAnswers nếu cần
                  if (!studentAnswer || questionScore === null) {
                    const questionAnswer = submission.questionAnswers?.find((qa: any) => 
                      qa.questionId === question.id || qa.questionId === question.id.toString()
                    );
                    
                    if (questionAnswer) {
                      if (!studentAnswer && questionAnswer.answer) {
                        studentAnswer = questionAnswer.answer;
                      }
                      if (questionScore === null && questionAnswer.score !== null && questionAnswer.score !== undefined) {
                        questionScore = questionAnswer.score;
                      }
                      if (!feedback && questionAnswer.feedback) {
                        feedback = questionAnswer.feedback;
                      }
                    }
                  }
                  
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-800">Câu {index + 1}</h4>
                        {questionScore !== null && questionScore !== undefined ? (
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {questionScore}/{question.point} điểm
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            Chưa chấm
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>Trả lời:</strong> {studentAnswer ? "Đã trả lời" : "Chưa trả lời"}
                      </div>
                      
                      {feedback && (
                        <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                          <div className="font-medium text-yellow-800">Nhận xét:</div>
                          <div className="text-yellow-700 mt-1">{feedback}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Bảng chi tiết trắc nghiệm (code cũ)
              <div className="max-h-96 overflow-y-auto border border-gray-300 rounded">
                <table className="table-auto w-full text-[11px]">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2">Câu</th>
                      <th className="px-2 py-2">Chọn</th>
                      <th className="px-2 py-2">Đáp án đúng</th>
                      <th className="px-2 py-2">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                {Array.isArray(submission.questionAnswers) && submission.questionAnswers.length > 0 ? (
                  submission.questionAnswers.map((qa: any, index: number) => (
                    <tr key={qa.id} className="text-center">
                      <td className="px-4 py-2 flex items-center gap-2">
                        {/* Hiển thị dấu chấm tròn nhỏ trước câu hỏi */}
                        <span className="w-2 h-2 rounded-full bg-blue-400 "></span>
                        {/* Hiển thị số thứ tự câu hỏi */}
                        <span>Câu {index + 1}</span>
                      </td>
                    <td
                      className={`px-4 py-2 ${qa.isCorrect ? "text-green-500 font-bold" : "text-red-500 font-bold"
                        }`}
                    >
                      {/* Hiển thị đáp án học sinh chọn */}
                      {qa.answer || "Chưa làm"}
                    </td>
                    <td className="px-4 py-2">{qa.question?.answer || "N/A"}</td>
                    <td className="px-4 py-2">{qa.isCorrect ? (qa.question?.point || 0) : 0}</td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-red-500">
                      <div className="py-4">
                        <p className="font-medium">Không có dữ liệu câu trả lời!</p>
                        <p className="text-xs mt-1">
                          Submission ID: {submission.id} - QuestionAnswers: {submission.questionAnswers?.length || 0}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : shouldShowScore ? (
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">Bạn chỉ được phép xem điểm tổng, không được xem chi tiết từng câu.</p>
          </div>
        ) : (
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700">
              <strong>Điểm sẽ được công bố sau hết hạn làm bài</strong>
              <br />
              <span className="text-sm">Giáo viên sẽ công bố kết quả sau khi kỳ thi kết thúc.</span>
            </p>
          </div>
        )}
       
      </div>
    </div>
  );
}