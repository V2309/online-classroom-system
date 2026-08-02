# podcast_generator.py - Module tạo podcast từ PDF content

import os
# Fix FFmpeg path for pydub
os.environ["PATH"] += os.pathsep + "C:\\ffmpeg-7.1.1-essentials_build\\bin"

import google.generativeai as genai
from openai import OpenAI
import tempfile
import uuid
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Configure OpenAI API
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class PodcastGenerator:
    def __init__(self):
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    
    def analyze_document_structure(self, pdf_content: str) -> str:
        """
        Phân tích cấu trúc tài liệu để tạo outline cho podcast
        """
        prompt = f"""
        Hãy phân tích tài liệu sau và tạo một outline ngắn gọn về các chủ đề chính, 
        khái niệm quan trọng, và điểm nổi bật cần thảo luận trong podcast.
        
        Tài liệu:
        {pdf_content[:3000]}  # Phân tích phần đầu để hiểu cấu trúc
        
        Trả về dạng bullet points ngắn gọn.
        """
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except:
            return ""  # Nếu lỗi thì bỏ qua phần phân tích
        
    def generate_dialogue(self, pdf_content: str) -> str:
        """
        Tạo cuộc hội thoại podcast từ nội dung PDF sử dụng Gemini
        """
        # Phân tích cấu trúc tài liệu trước
        outline = self.analyze_document_structure(pdf_content)
        
        prompt = f"""
        Bạn là chuyên gia tạo podcast học thuật chất lượng cao. Hãy tạo một cuộc trò chuyện PODCAST SINH ĐỘNG (khoảng 7 - 10 phút) giữa hai người:
        - **Người A** (Host - người dẫn chương trình): Tò mò, hỏi những câu hỏi sâu sắc, thể hiện sự quan tâm thực sự
        - **Người B** (Expert - chuyên gia): Hiểu biết sâu, giải thích rõ ràng, nhiệt tình chia sẻ

        🎯 MUC TIÊU CHÍNH:
        - BAO PHỦ TOÀN BỘ NỘI DUNG QUAN TRỌNG trong tài liệu (từ đầu đến cuối)
        - Tạo cuộc hội thoại TỰ NHIÊN như podcast thật, không cứng nhắc
        - Thêm cảm xúc: ngạc nhiên, thú vị, aha moment, thắc mắc thực sự
        
        📋 CẤU TRÚC:
        1. **INTRO** (2-3 câu): Người B chào và giới thiệu chủ đề hấp dẫn
        2. **NỘI DUNG CHÍNH** (15-25 lượt trao đổi):
           - Đi qua TẤT CẢ các phần quan trọng của tài liệu theo thứ tự logic
           - Mỗi lượt 1-3 câu, ngắn gọn, dễ nghe
           - Xen kẽ: câu hỏi sâu, giải thích, ví dụ thực tế, so sánh, phân tích
           - Thêm các từ tự nhiên: "À", "Ừm", "Thật sao?", "Thú vị đấy", "Vậy là..."
        3. **OUTRO** (2 câu): Tổng kết ngắn gọn và cảm ơn
        
        ✨ YÊU CẦU ĐẶC BIỆT:
        - Đọc KỸ TOÀN BỘ tài liệu, không bỏ sót phần nào quan trọng
        - Ngôn ngữ TỰ NHIÊN như nói chuyện thật, không văn viết
        - Tạo "flow" mượt mà, các câu nối tiếp logic
        - Thể hiện CẢM XÚC trong câu nói (ngạc nhiên, hứng thú, suy nghĩ)
        - Giải thích bằng VÍ DỤ THỰC TẾ dễ hiểu
        - Mỗi câu KHÔNG QUÁ DÀINÓI, tối đa 2-3 câu/lượt để dễ nghe
        
        📝 ĐỊNH DẠNG BẮT BUỘC (mỗi dòng một câu nói):
        Người B: [Câu intro chào mừng và giới thiệu chủ đề]
        Người A: [Phản hồi và câu hỏi đầu tiên]
        Người B: [Giải thích điểm đầu tiên]
        Người A: [Đặt câu hỏi sâu hơn hoặc yêu cầu làm rõ]
        ...
        Người B: [Tổng kết và cảm ơn]
        
        Outline tài liệu để tham khảo:
        {outline}
        
        📄 NỘI DUNG TÀI LIỆU CẦN CHUYỂN THÀNH PODCAST:
        {pdf_content}
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Lỗi khi tạo dialogue với Gemini: {str(e)}")
    
    def text_to_speech(self, dialogue: str, voice_a: str = "echo", voice_b: str = "nova") -> str:
        """
        Chuyển đổi dialogue thành audio sử dụng OpenAI TTS
        Giọng mặc định:
        - echo: Nam, ấm áp, phù hợp làm host
        - nova: Nữ, rõ ràng, phù hợp làm expert
        Các giọng khác: alloy, nova, fable, onyx
        """
        try:
            # Log dialogue để debug
            print("[DEBUG] Dialogue nhận được:")
            print(dialogue[:500])  # In 500 ký tự đầu
            
            # Parse dialogue thành các phần riêng biệt
            lines = dialogue.strip().split('\n')
            audio_segments = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Hỗ trợ nhiều format hơn
                text = None
                voice = None
                
                if line.startswith("Người A:") or line.startswith("**Người A:**"):
                    text = line.replace("Người A:", "").replace("**Người A:**", "").strip()
                    voice = voice_a
                elif line.startswith("Người B:") or line.startswith("**Người B:**"):
                    text = line.replace("Người B:", "").replace("**Người B:**", "").strip()
                    voice = voice_b
                elif line.startswith("A:"):
                    text = line.replace("A:", "").strip()
                    voice = voice_a
                elif line.startswith("B:"):
                    text = line.replace("B:", "").strip()
                    voice = voice_b
                
                if not text or not voice:
                    continue
                
                # Bỏ qua nếu text quá ngắn (chỉ là dấu câu hoặc từ ngữ không có nghĩa)
                if len(text) < 3:
                    continue
                
                print(f"[DEBUG] Tạo audio: {voice[:1].upper()} - {text[:50]}...")
                
                # Tạo audio segment với tốc độ tự nhiên hơn
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                    response = openai_client.audio.speech.create(
                        model="tts-1-hd",  # Sử dụng HD model cho chất lượng tốt hơn
                        voice=voice,
                        input=text,
                        speed=1.05,  # Tăng tốc độ nhẹ cho tự nhiên hơn (1.0 = bình thường, max 4.0)
                        response_format="mp3"
                    )
                    response.stream_to_file(temp_file.name)
                    audio_segments.append(temp_file.name)
            
            # Merge các audio segments sử dụng pydub
            final_audio_path = os.path.join(tempfile.gettempdir(), f"podcast_{uuid.uuid4().hex}.mp3")
            
            print(f"[DEBUG] Số audio segments được tạo: {len(audio_segments)}")
            
            if audio_segments:
                try:
                    # Import pydub để merge audio
                    from pydub import AudioSegment
                    
                    # Thêm intro silence (1 giây để tạo cảm giác chuyên nghiệp)
                    intro_silence = AudioSegment.silent(duration=800)  # 0.8s
                    
                    # Load segment đầu tiên
                    combined = intro_silence + AudioSegment.from_mp3(audio_segments[0])
                    
                    # Khoảng lặng giữa các câu (ngắn hơn cho tự nhiên)
                    short_pause = AudioSegment.silent(duration=400)  # 0.4s - pause tự nhiên
                    medium_pause = AudioSegment.silent(duration=700)  # 0.7s - chuyển người nói
                    
                    # Merge tất cả segments với pause thông minh
                    prev_voice = voice_a if "Người A" in lines[0] else voice_b
                    for i, segment_path in enumerate(audio_segments[1:], 1):
                        segment_audio = AudioSegment.from_mp3(segment_path)
                        # Xác định giọng hiện tại để chọn pause phù hợp
                        curr_voice = voice_a if "Người A" in lines[min(i, len(lines)-1)] else voice_b
                        pause = medium_pause if curr_voice != prev_voice else short_pause
                        combined = combined + pause + segment_audio
                        prev_voice = curr_voice
                    
                    # Thêm outro silence
                    outro_silence = AudioSegment.silent(duration=1000)  # 1s
                    combined = combined + outro_silence
                    
                    # Export final audio với quality cao hơn
                    combined.export(final_audio_path, format="mp3", bitrate="192k")
                    
                except ImportError:
                    # Fallback: nếu không có pydub, chỉ lấy segment đầu
                    print("[WARNING] pydub not installed, using first segment only")
                    import shutil
                    shutil.copy(audio_segments[0], final_audio_path)
                
                # Cleanup temp files
                for segment in audio_segments:
                    try:
                        os.unlink(segment)
                    except:
                        pass
                        
                return final_audio_path
            else:
                raise Exception(f"Không thể tạo audio segments. Dialogue format không đúng. Xem log để kiểm tra format của dialogue.")
                
        except Exception as e:
            raise Exception(f"Lỗi khi tạo audio với OpenAI TTS: {str(e)}")
    
    def generate_podcast(self, pdf_content: str) -> Dict:
        """
        Tạo podcast hoàn chình từ PDF content
        """
        try:
            # Bước 1: Tạo dialogue
            dialogue = self.generate_dialogue(pdf_content)
            
            # Bước 2: Tạo audio
            audio_path = self.text_to_speech(dialogue)
            
            return {
                "success": True,
                "dialogue": dialogue,
                "audio_path": audio_path,
                "message": "Tạo podcast thành công!"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Lỗi khi tạo podcast: {str(e)}"
            }
