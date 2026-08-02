# Test script for Quiz API endpoints
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check"""
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Health check: {response.status_code}")
    print(f"Response: {response.json()}")

def test_extract_quiz():
    """Test quiz extraction with sample file"""
    # You need to provide a sample PDF or DOCX file
    files = {'file': open('sample_quiz.pdf', 'rb')} if os.path.exists('sample_quiz.pdf') else None
    
    if files:
        response = requests.post(f"{BASE_URL}/api/extract-quiz", files=files)
        print(f"Extract quiz: {response.status_code}")
        print(f"Response: {response.json()}")
        files['file'].close()
        return response.json().get('quiz_data', [])
    else:
        print("No sample file found for testing")
        return []

def test_shuffle_quiz(quiz_data):
    """Test quiz shuffling"""
    if not quiz_data:
        print("No quiz data to shuffle")
        return
    
    payload = {
        "quiz_data": quiz_data,
        "shuffle_questions": True,
        "shuffle_answers": True
    }
    
    response = requests.post(f"{BASE_URL}/api/shuffle-quiz", json=payload)
    print(f"Shuffle quiz: {response.status_code}")
    print(f"Response: {response.json()}")

def test_download_quiz(quiz_data):
    """Test quiz download"""
    if not quiz_data:
        print("No quiz data to download")
        return
    
    payload = {
        "quiz_data": quiz_data,
        "filename": "test_quiz.pdf",
        "format": "pdf"
    }
    
    response = requests.post(f"{BASE_URL}/api/download-quiz", json=payload)
    print(f"Download quiz: {response.status_code}")
    
    if response.status_code == 200:
        with open("downloaded_quiz.pdf", "wb") as f:
            f.write(response.content)
        print("Quiz downloaded successfully")

if __name__ == "__main__":
    import os
    
    print("Testing Quiz API endpoints...")
    
    test_health()
    quiz_data = test_extract_quiz()
    test_shuffle_quiz(quiz_data)
    test_download_quiz(quiz_data)
    
    print("Testing completed!")