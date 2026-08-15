# quiz/shuffler.py
# Logic xáo trộn thứ tự câu hỏi và đáp án.
# Tách từ index.py lines 81–106.

import re
import random
from typing import List


def shuffle_questions(quiz_data: List[dict]) -> List[dict]:
    """Xáo trộn thứ tự câu hỏi, tự động đánh lại số thứ tự."""
    questions = [q for q in quiz_data if isinstance(q.get('question_number'), int)]
    other_items = [q for q in quiz_data if not isinstance(q.get('question_number'), int)]
    random.shuffle(questions)
    for i, question in enumerate(questions):
        question['question_number'] = i + 1
    return questions + other_items


def shuffle_answers_in_question(question: dict) -> dict:
    """Xáo trộn đáp án trong 1 câu, cập nhật correct_answer_index/char."""
    if not question.get('options') or not question['options']:
        return question

    clean_options = [re.sub(r'^[A-D][\.\s]+', '', opt.strip()) for opt in question['options']]
    original_indices = list(range(len(clean_options)))
    random.shuffle(original_indices)
    shuffled_options = [clean_options[i] for i in original_indices]

    old_correct_index = question.get('correct_answer_index', 0)
    if old_correct_index < len(original_indices):
        new_correct_index = original_indices.index(old_correct_index)
        question['options'] = shuffled_options
        question['correct_answer_index'] = new_correct_index
        question['correct_answer_char'] = chr(65 + new_correct_index)

    return question


def shuffle_answers(quiz_data: List[dict]) -> List[dict]:
    """Xáo trộn đáp án cho tất cả câu hỏi trong đề."""
    return [
        shuffle_answers_in_question(q) if isinstance(q.get('question_number'), int) else q
        for q in quiz_data
    ]
