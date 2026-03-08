import json
import os
import random
import re
from urllib import error as url_error
from urllib import request as url_request


def generate_questions(
    *,
    topic,
    subject,
    difficulty,
    number_of_questions,
    field_of_study_name='',
):
    api_key = os.getenv('OPENAI_API_KEY', '').strip()
    if api_key:
        try:
            questions = _generate_with_openai(
                api_key=api_key,
                topic=topic,
                subject=subject,
                difficulty=difficulty,
                number_of_questions=number_of_questions,
                field_of_study_name=field_of_study_name,
            )
            return {'provider': 'openai', 'questions': [_normalize_question(item) for item in questions]}
        except Exception:
            pass

    mock_questions = _mock_generate_questions(
        topic=topic,
        subject=subject,
        difficulty=difficulty,
        number_of_questions=number_of_questions,
        field_of_study_name=field_of_study_name,
    )
    return {'provider': 'mock', 'questions': [_normalize_question(item) for item in mock_questions]}


def to_quiz_payload_questions(generated_questions):
    payload = []
    for index, question in enumerate(generated_questions):
        correct_index = int(question.get('correct_answer_index', 0))
        options = question.get('options') or []
        payload.append(
            {
                'text': question.get('question_text', ''),
                'explanation': question.get('explanation', ''),
                'question_type': 'mcq',
                'timer_seconds': 30,
                'order': index,
                'choices': [
                    {'text': option, 'is_correct': option_index == correct_index, 'order': option_index}
                    for option_index, option in enumerate(options)
                ],
            }
        )
    return payload


def _generate_with_openai(
    *,
    api_key,
    topic,
    subject,
    difficulty,
    number_of_questions,
    field_of_study_name='',
):
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    prompt = (
        'Generate university-level MCQ questions in strict JSON format. '
        'Return an object with key "questions". Each question must contain: '
        'question_text, options (array of 4 strings), correct_answer_index (0..3), explanation(optional string). '
        f'Field: {field_of_study_name or "General"}, Subject: {subject}, Topic: {topic}, '
        f'Difficulty: {difficulty}, Count: {number_of_questions}.'
    )
    payload = {
        'model': model,
        'temperature': 0.3,
        'response_format': {'type': 'json_object'},
        'messages': [
            {
                'role': 'system',
                'content': 'You are an exam question generator for Sharda University.',
            },
            {'role': 'user', 'content': prompt},
        ],
    }
    body = json.dumps(payload).encode('utf-8')
    req = url_request.Request(
        os.getenv('OPENAI_CHAT_COMPLETIONS_URL', 'https://api.openai.com/v1/chat/completions'),
        data=body,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
    )
    try:
        with url_request.urlopen(req, timeout=30) as response:
            content = response.read().decode('utf-8')
    except url_error.HTTPError as exc:
        message = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'OpenAI request failed: {message}') from exc
    except url_error.URLError as exc:
        raise RuntimeError(f'OpenAI request failed: {exc.reason}') from exc

    data = json.loads(content)
    text = (
        data.get('choices', [{}])[0]
        .get('message', {})
        .get('content', '')
    )
    parsed = json.loads(text) if isinstance(text, str) else {}
    questions = parsed.get('questions') or []
    if not isinstance(questions, list):
        raise ValueError('OpenAI response did not return a questions list.')
    return questions


def _mock_generate_questions(*, topic, subject, difficulty, number_of_questions, field_of_study_name=''):
    random.seed(f'{topic}:{subject}:{difficulty}:{field_of_study_name}:{number_of_questions}')
    normalized_topic = topic.strip() or 'General topic'
    normalized_subject = subject.strip() or 'General subject'
    field_label = field_of_study_name.strip() or 'General'
    levels = {
        'easy': 'basic',
        'medium': 'intermediate',
        'hard': 'advanced',
    }
    difficulty_label = levels.get(difficulty, difficulty)

    verbs = ['describes', 'explains', 'represents', 'applies', 'demonstrates']
    questions = []
    for index in range(1, number_of_questions + 1):
        verb = random.choice(verbs)
        question_text = (
            f'[{field_label}] {normalized_subject}: Which option best {verb} '
            f'"{normalized_topic}" at a {difficulty_label} level?'
        )
        options = [
            f'Concept A for {normalized_topic}',
            f'Concept B for {normalized_topic}',
            f'Concept C for {normalized_topic}',
            f'Concept D for {normalized_topic}',
        ]
        correct_answer_index = (index - 1) % 4
        questions.append(
            {
                'question_text': question_text,
                'options': options,
                'correct_answer_index': correct_answer_index,
                'explanation': f'Option {chr(65 + correct_answer_index)} aligns best with {normalized_topic}.',
            }
        )
    return questions


def _normalize_question(raw):
    question_text = str(raw.get('question_text') or '').strip()
    if not question_text:
        question_text = 'Generated question'

    options = raw.get('options') or []
    if not isinstance(options, list):
        options = []
    options = [re.sub(r'\s+', ' ', str(item or '').strip()) for item in options if str(item or '').strip()]
    while len(options) < 4:
        options.append(f'Option {len(options) + 1}')
    options = options[:4]

    try:
        correct_answer_index = int(raw.get('correct_answer_index', 0))
    except (TypeError, ValueError):
        correct_answer_index = 0
    if correct_answer_index < 0 or correct_answer_index > 3:
        correct_answer_index = 0

    explanation = str(raw.get('explanation') or '').strip()
    return {
        'question_text': question_text,
        'options': options,
        'correct_answer_index': correct_answer_index,
        'explanation': explanation,
    }
