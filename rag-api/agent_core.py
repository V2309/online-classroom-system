# agent_core.py (Phiên bản tối ưu hóa truy xuất PDF)

import os
import re
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
# Sử dụng LLM và Embedding của Google
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# Import các thành phần cần thiết để xây dựng Agent
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools.retriever import create_retriever_tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain.tools import tool

import json

# --- Hàm tiền xử lý văn bản để cải thiện chất lượng ---
def preprocess_text(text):
    """Làm sạch và chuẩn hóa văn bản từ PDF"""
    # Loại bỏ ký tự đặc biệt và khoảng trắng thừa
    text = re.sub(r'\s+', ' ', text)  # Nhiều khoảng trắng thành 1
    text = re.sub(r'\n+', '\n', text)  # Nhiều xuống dòng thành 1
    
    # Loại bỏ header/footer thường gặp
    text = re.sub(r'Trang \d+', '', text)
    text = re.sub(r'Page \d+', '', text)
    
    # Chuẩn hóa dấu câu
    text = re.sub(r'\s+([.,;:])', r'\1', text)
    
    return text.strip()

# --- Hàm load documents được tối ưu ---
def load_documents(sources):
    docs = []
    temp_files = []
    try:
        for source in sources:
            if isinstance(source, str):
                loader = WebBaseLoader(source)
                docs.extend(loader.load())
            else:
                temp_file_path = os.path.join(".", source.name)
                with open(temp_file_path, "wb") as f:
                    f.write(source.getbuffer())
                temp_files.append(temp_file_path)
                
                # Sử dụng PyPDFLoader với extract_images=False để tăng tốc
                loader = PyPDFLoader(temp_file_path, extract_images=False)
                loaded_docs = loader.load()
                
                # Tiền xử lý và thêm metadata cho mỗi document
                for i, doc in enumerate(loaded_docs):
                    doc.page_content = preprocess_text(doc.page_content)
                    doc.metadata.update({
                        'source_file': source.name,
                        'page_number': i + 1,
                        'total_pages': len(loaded_docs),
                        'content_length': len(doc.page_content)
                    })
                docs.extend(loaded_docs)
    finally:
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)
    return docs

def split_documents(documents):
    """Chia nhỏ documents với chiến lược thông minh hơn"""
    # Sử dụng separators tối ưu cho văn bản tiếng Việt và học thuật
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,  # Giảm chunk size để tăng độ chính xác
        chunk_overlap=150,  # Tăng overlap để bảo toàn ngữ cảnh
        length_function=len,
        separators=[
            "\n\n",      # Paragraph breaks
            "\n",        # Line breaks  
            ". ",        # Sentence ends
            "? ",        # Question marks
            "! ",        # Exclamation marks
            "; ",        # Semicolons
            ", ",        # Commas
            " ",         # Spaces
            ""           # Characters
        ],
        add_start_index=True  # Thêm start index để tracking
    )
    
    chunks = text_splitter.split_documents(documents)
    
    # Lọc bỏ chunks quá ngắn hoặc chỉ chứa ký tự đặc biệt
    filtered_chunks = []
    for chunk in chunks:
        content = chunk.page_content.strip()
        if len(content) > 50 and len(content.split()) > 5:  # Ít nhất 50 ký tự và 5 từ
            # Thêm metadata về vị trí chunk trong document
            chunk.metadata.update({
                'chunk_length': len(content),
                'word_count': len(content.split())
            })
            filtered_chunks.append(chunk)
    
    return filtered_chunks




# --- Hàm tạo vector store tối ưu với hybrid search ---
def create_vector_store(text_chunks):
    """Tạo vector store với embedding model tốt hơn"""
    # Sử dụng OpenAI embedding model mới nhất và tốt nhất
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        dimensions=1536,  # Đảm bảo consistency
        show_progress_bar=True
    )
    
    # Tạo FAISS vector store
    vector_store = FAISS.from_documents(
        documents=text_chunks, 
        embedding=embeddings
    )
    
    return vector_store

def create_hybrid_retriever(vector_store, text_chunks):
    """Tạo hybrid retriever kết hợp vector search và keyword search"""
    
    # 1. Vector retriever với MMR
    vector_retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            'k': 4,
            'fetch_k': 15,
            'lambda_mult': 0.8,  # Cân bằng giữa relevance và diversity
        }
    )
    
    try:
        # 2. BM25 retriever cho keyword search
        bm25_retriever = BM25Retriever.from_documents(
            text_chunks,
            k=4
        )
        
        # 3. Ensemble retriever kết hợp cả hai
        ensemble_retriever = EnsembleRetriever(
            retrievers=[vector_retriever, bm25_retriever],
            weights=[0.7, 0.3]  # Ưu tiên vector search hơn
        )
        
        return ensemble_retriever
        
    except ImportError:
        # Fallback về vector retriever nếu không có rank_bm25
        print("Warning: rank_bm25 not installed. Using vector search only.")
        return vector_retriever


def get_generation_llm():
    """Khởi tạo và trả về một LLM của Google cho các tác vụ tạo nội dung."""
    try:
        # Cấu hình tối ưu cho essay generation - sử dụng model ổn định hơn
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",  # Sử dụng model theo yêu cầu
            temperature=0.2,      # Giảm temperature để output ổn định hơn
            max_tokens=4096,      # Giữ max_tokens vừa phải để tránh quota issues
            top_p=0.7,           # Giảm top_p để tập trung hơn
            max_retries=3,       # Tăng số lần thử lại
            timeout=90           # Tăng timeout cho response dài
        )
        print("[DEBUG] Generation LLM initialized successfully")
        return llm
    except Exception as e:
        print(f"[ERROR] Failed to initialize Generation LLM: {e}")
        raise

# --- HÀM MỚI: Logic tạo câu hỏi tự luận ---
async def generate_essay_questions_logic(llm, prompt_template_str, num_questions, context=None, topic=None):
    """
    Hàm logic (async) để gọi LLM và tạo câu hỏi tự luận với xử lý lỗi cải thiện.
    """
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            prompt = None
            if topic:
                # Trường hợp 2: Tạo theo chủ đề
                prompt = prompt_template_str.format(num_questions=num_questions, topic=topic)
            elif context:
                # Trường hợp 1: Tạo theo file (RAG)
                max_context_len = 12000  # Giảm từ 15000 để tránh vượt token limit
                if len(context) > max_context_len:
                    context = context[:max_context_len] + "\n... (Nội dung đã được rút gọn)"
                    print(f"[DEBUG] Context truncated to {max_context_len} chars for essay generation")
                    
                prompt = prompt_template_str.format(num_questions=num_questions, context=context)
            
            if not prompt:
                raise ValueError("Thiếu context hoặc topic để tạo câu hỏi.")

            print(f"[DEBUG] Invoking essay generation chain (num_questions: {num_questions}, retry: {retry_count + 1})...")
            
            # Tăng timeout và max_tokens cho response dài
            response = await llm.ainvoke(prompt)
            
            raw_response = response.content if hasattr(response, 'content') else str(response)
            
            print(f"[DEBUG] Raw response length: {len(raw_response)} chars")
            print(f"[DEBUG] Raw response preview: {raw_response[:300]}...")
            
            # Cải thiện logic trích xuất JSON với nhiều phương pháp
            json_str = extract_json_from_response(raw_response)
            
            if not json_str:
                print("[ERROR] No valid JSON found in LLM response.")
                if len(raw_response) < 100:
                    print(f"[ERROR] Full response was: {raw_response}")
                else:
                    print(f"[ERROR] Response preview: {raw_response[:500]}...")
                    print(f"[ERROR] Response end: ...{raw_response[-500:]}")
                raise ValueError("Không tìm thấy nội dung JSON hợp lệ trong phản hồi của AI.")
                
            # Parse JSON với xử lý lỗi tốt hơn
            parsed_json = parse_json_safely(json_str)
            
            if 'questions' not in parsed_json or not isinstance(parsed_json['questions'], list):
                print("[ERROR] JSON output is missing 'questions' list.")
                raise ValueError("Định dạng JSON từ AI không hợp lệ (thiếu key 'questions').")
            
            questions = parsed_json['questions']
            if len(questions) != num_questions:
                print(f"[WARNING] Expected {num_questions} questions, got {len(questions)}")
                
            print(f"[DEBUG] Successfully parsed JSON with {len(questions)} questions")
            return questions
        except json.JSONDecodeError as jde:
            retry_count += 1
            print(f"[ERROR] JSON decode error on attempt {retry_count}: {jde}")
            if retry_count >= max_retries:
                print(f"[ERROR] Failed after {max_retries} attempts")
                raise ValueError(f"Lỗi khi đọc định dạng JSON từ AI sau {max_retries} lần thử: {jde}. JSON có thể đã bị cắt cụt hoặc không hợp lệ.")
            print(f"[INFO] Retrying... ({retry_count}/{max_retries})")
            continue
            
        except Exception as e:
            retry_count += 1
            print(f"[ERROR] Error in generate_essay_questions_logic on attempt {retry_count}: {e}")
            if retry_count >= max_retries:
                print(f"[ERROR] Failed after {max_retries} attempts")
                import traceback
                traceback.print_exc()
                raise
            print(f"[INFO] Retrying due to error... ({retry_count}/{max_retries})")
            continue
            
    # If we get here, all retries failed
    raise ValueError(f"Không thể tạo câu hỏi sau {max_retries} lần thử.")


def extract_json_from_response(raw_response):
    """
    Trích xuất JSON từ response với nhiều phương pháp khác nhau.
    """
    # Phương pháp 1: Tìm JSON block với ```json
    json_match = re.search(r'```json\s*({[\s\S]*?})\s*```', raw_response, re.DOTALL)
    if json_match:
        json_str = json_match.group(1).strip()
        print(f"[DEBUG] Found JSON in ```json block, length: {len(json_str)}")
        return json_str
    
    # Phương pháp 2: Tìm JSON thô với cân bằng dấu ngoặc
    json_str = extract_balanced_json(raw_response)
    if json_str:
        print(f"[DEBUG] Found balanced JSON object, length: {len(json_str)}")
        return json_str
    
    # Phương pháp 3: Tìm JSON cơ bản (fallback)
    start_idx = raw_response.find('{')
    end_idx = raw_response.rfind('}')
    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        json_str = raw_response[start_idx:end_idx+1].strip()
        print(f"[DEBUG] Found basic JSON object, length: {len(json_str)}")
        return json_str
    
    return None


def extract_balanced_json(text):
    """
    Trích xuất JSON bằng cách cân bằng dấu ngoặc nhọn với xử lý truncation.
    """
    start_idx = text.find('{')
    if start_idx == -1:
        return None
    
    bracket_count = 0
    in_string = False
    escape_next = False
    last_valid_end = -1
    
    for i, char in enumerate(text[start_idx:], start_idx):
        if escape_next:
            escape_next = False
            continue
            
        if char == '\\' and in_string:
            escape_next = True
            continue
            
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
            
        if not in_string:
            if char == '{':
                bracket_count += 1
            elif char == '}':
                bracket_count -= 1
                if bracket_count == 0:
                    return text[start_idx:i+1].strip()
                elif bracket_count > 0:
                    # Lưu lại vị trí hợp lệ cuối cùng
                    last_valid_end = i
    
    # Nếu JSON bị cắt cụt, thử trả về phần có thể sửa được
    if bracket_count > 0 and start_idx != -1:
        # Trả về phần JSON cho đến cuối text
        return text[start_idx:].strip()
    
    return None


def parse_json_safely(json_str):
    """
    Parse JSON với xử lý lỗi an toàn và cố gắng sửa chữa.
    """
    try:
        # Thử parse JSON bình thường
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] Initial JSON parse failed: {e}")
        
        # Thử sửa chữa JSON bị cắt cụt
        fixed_json = attempt_json_repair(json_str)
        if fixed_json:
            try:
                result = json.loads(fixed_json)
                print(f"[DEBUG] Successfully repaired and parsed JSON")
                return result
            except json.JSONDecodeError:
                print(f"[DEBUG] JSON repair failed")
        
        # Nếu không sửa được, raise lỗi gốc
        raise e


def attempt_json_repair(json_str):
    """
    Cố gắng sửa chữa JSON bị cắt cụt hoặc có lỗi nhỏ với cách tiếp cận đơn giản.
    """
    try:
        json_str = json_str.strip()
        original_len = len(json_str)
        
        # Bước 1: Xử lý string bị cắt cụt
        if json_str.count('"') % 2 == 1:  # Số lẻ quotes = string chưa đóng
            json_str += '"'
            print(f"[DEBUG] Closed unterminated string")
        
        # Bước 2: Đóng các bracket bị thiếu
        open_braces = json_str.count('{')
        close_braces = json_str.count('}')
        if open_braces > close_braces:
            missing_braces = open_braces - close_braces
            json_str += '}' * missing_braces
            print(f"[DEBUG] Added {missing_braces} missing closing braces")
        
        # Bước 3: Xử lý JSON structure cơ bản
        # Đảm bảo không có trailing comma
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Nếu vẫn lỗi, thử một cách tiếp cận khác
        try:
            json.loads(json_str)  # Test parse
            if len(json_str) != original_len:
                print(f"[DEBUG] JSON repaired: {original_len} -> {len(json_str)} chars")
            return json_str
        except json.JSONDecodeError:
            # Fallback: Tạo JSON structure tối thiểu
            return create_fallback_json()
        
    except Exception as e:
        print(f"[DEBUG] JSON repair attempt failed: {e}")
        return create_fallback_json()

def create_fallback_json():
    """Tạo JSON fallback khi không sửa được."""
    fallback = {
        "questions": [
            {
                "question_number": 1,
                "question_text": "Câu hỏi không thể được tạo do lỗi parsing. Vui lòng thử lại.",
                "suggested_answer": "Xin lỗi, đã có lỗi trong quá trình tạo câu hỏi."
            }
        ]
    }
    print("[DEBUG] Using fallback JSON structure")
    return json.dumps(fallback, ensure_ascii=False)
# --- TẠO AGENT SỬ DỤNG GEMINI VỚI RETRIEVER TỐI ƯU ---
def create_agent_executor(vector_store, system_prompt_str, text_chunks=None):
    """Tạo agent executor với retrieval được tối ưu hóa"""
    
    # Tạo hybrid retriever thay vì retriever đơn giản
    if text_chunks:
        retriever = create_hybrid_retriever(vector_store, text_chunks)
    else:
        # Fallback về retriever thông thường nếu không có text_chunks
        retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={
                'k': 5,
                'fetch_k': 20,
                'lambda_mult': 0.75,
            }
        )

    # 1. CÔNG CỤ 1: Document search với mô tả được cải thiện
    document_search_tool = create_retriever_tool(
        retriever,
        "document_search",
        """⭐ CÔNG CỤ QUAN TRỌNG NHẤT - LUÔN DÙNG TRƯỚC TIÊN ⭐
        
        Tìm kiếm thông tin trong tài liệu học thuật đã được tải lên (PDF, slide, giáo trình).
        
        🚨 QUY TẮC BẮT BUỘC:
        - PHẢI sử dụng TRƯỚC TIÊN cho MỌI câu hỏi về kiến thức, khái niệm, định nghĩa
        - PHẢI sử dụng cho MỌI câu hỏi học thuật, dù đơn giản hay phức tạp  
        - KHÔNG ĐƯỢC bỏ qua công cụ này với bất kỳ lý do gì
        
        🎯 Sử dụng khi:
        - Câu hỏi về định nghĩa, khái niệm, lý thuyết
        - Yêu cầu giải thích nội dung bài học
        - Hỏi về công thức, quy trình, phương pháp
        - Bất kỳ thông tin nào có thể xuất hiện trong tài liệu
        
        Công cụ sử dụng hybrid search (vector + keyword) để tìm kiếm chính xác nhất."""
    )

    # 2. CÔNG CỤ 2: Web search cho thông tin bổ sung - CHỈ KHI DOCUMENT_SEARCH THẤT BẠI
    web_search_tool = TavilySearchResults(
        k=3, 
        name="web_search",
        description="""🚫 CHỈ SỬ DỤNG SAU KHI DOCUMENT_SEARCH THẤT BẠI 🚫
        
        ⚠️ KHÔNG ĐƯỢC dùng làm công cụ đầu tiên cho câu hỏi học thuật
        ⚠️ CHỈ dùng KHI document_search không tìm thấy thông tin liên quan
        
        Hữu ích cho:
        - Tin tức mới, cập nhật gần đây  
        - Thông tin ngoài phạm vi tài liệu đã tải
        - Chủ đề không có trong giáo trình/slide"""
    )

   

    # 4. Tập hợp các công cụ - ĐẶT DOCUMENT_SEARCH TOOL ĐẦU TIÊN ĐỂ ƯU TIÊN
    tools = [document_search_tool, web_search_tool]

    # 5. Gemini model với cấu hình ổn định hơn
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0.05,  # Giảm temperature rất thấp để tuân thủ quy tắc nghiêm ngặt
            max_tokens=4096,  # Tăng lên để đủ cho nội dung dài (9 phần hướng dẫn học tập)
            top_p=0.7,  # Giảm top_p để focused hơn
            max_retries=3,  # Retry nếu API call fail
            request_timeout=60  # Timeout 60s cho API calls
        )
        print("[DEBUG] Gemini LLM initialized successfully")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Gemini LLM: {e}")
        raise
    
    # 6. Prompt template được cải thiện
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt_str),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 7. Tạo Agent với error handling tốt hơn
    agent = create_tool_calling_agent(llm, tools, prompt)

    # 8. Agent Executor với cấu hình tối ưu và error handling
    try:
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=tools, 
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10,  # Tăng số lần thử để đảm bảo dùng tools
            max_execution_time=90,  # Tăng timeout
            return_intermediate_steps=False,
            early_stopping_method="force"  # Thay đổi để ép sử dụng tools nhiều hơn
        )
        print(f"[DEBUG] Agent Executor created successfully with {len(tools)} tools")
    except Exception as e:
        print(f"[ERROR] Failed to create Agent Executor: {e}")
        raise
    
    return agent_executor