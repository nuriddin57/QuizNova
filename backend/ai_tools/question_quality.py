import random
import re
from difflib import SequenceMatcher


QUESTION_SIMILARITY_THRESHOLD = 0.82
OPTION_SIMILARITY_THRESHOLD = 0.9
MIN_QUESTION_WORDS = 6
INTERROGATIVE_PREFIXES = (
    'what',
    'which',
    'how',
    'why',
    'when',
    'where',
    'who',
    'in ',
    'during ',
    'a student',
    'an instructor',
    'suppose',
    'consider',
)
PLACEHOLDER_PATTERNS = (
    re.compile(r'concept\s+[a-d]\b', re.IGNORECASE),
    re.compile(r'option\s+[a-d]\b', re.IGNORECASE),
    re.compile(r'which option best (describes|applies)\b', re.IGNORECASE),
    re.compile(r'\bfor\s+set\b', re.IGNORECASE),
    re.compile(r'\bplaceholder\b', re.IGNORECASE),
    re.compile(r'\bexample\s+question\b', re.IGNORECASE),
)
VALID_QUESTION_TYPES = {'mcq', 'multiple_choice', 'true_false'}


def collapse_whitespace(value):
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def normalize_text_for_similarity(value):
    text = collapse_whitespace(value).lower()
    text = re.sub(r'[^a-z0-9а-яёўқғҳüöşçñ\s]', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def question_opening_signature(value, word_count=4):
    normalized = normalize_text_for_similarity(value)
    parts = normalized.split()
    return ' '.join(parts[:word_count])


def clean_option_text(option_text):
    text = collapse_whitespace(option_text)
    text = re.sub(r'^[A-Da-d][\)\].:\-]\s*', '', text)
    return text.strip(' "\'')


def ensure_terminal_punctuation(text):
    cleaned = collapse_whitespace(text).strip(' "\'')
    if not cleaned:
        return ''
    if cleaned[-1] in '.?!':
        return cleaned
    lowered = cleaned.lower()
    if lowered.startswith(INTERROGATIVE_PREFIXES):
        return f'{cleaned}?'
    return f'{cleaned}.'


def is_duplicate_or_similar_question(question_text, existing_question_texts):
    normalized = normalize_text_for_similarity(question_text)
    opening = question_opening_signature(question_text)

    for existing_text in existing_question_texts or []:
        existing_normalized = normalize_text_for_similarity(existing_text)
        if not existing_normalized:
            continue
        if normalized == existing_normalized:
            return True
        if opening and opening == question_opening_signature(existing_text):
            return True
        if SequenceMatcher(None, normalized, existing_normalized).ratio() >= QUESTION_SIMILARITY_THRESHOLD:
            return True
    return False


def has_near_duplicate_options(options):
    normalized_options = [normalize_text_for_similarity(option) for option in options]
    for index, option in enumerate(normalized_options):
        for compare_option in normalized_options[index + 1:]:
            if not option or not compare_option:
                return True
            if option == compare_option:
                return True
            ratio = SequenceMatcher(None, option, compare_option).ratio()
            if ratio >= OPTION_SIMILARITY_THRESHOLD:
                return True
    return False


def has_low_quality_option_pattern(options):
    first_words = {}
    for option in options:
        words = normalize_text_for_similarity(option).split()
        if not words:
            return True
        first_key = ' '.join(words[:2]) if len(words) > 1 else words[0]
        first_words[first_key] = first_words.get(first_key, 0) + 1
    return any(count >= 3 for count in first_words.values())


def default_explanation(correct_option):
    return f'"{correct_option}" is correct because it best matches the concept being assessed.'


def normalize_question_type(raw_question):
    raw_type = collapse_whitespace(raw_question.get('question_type')).lower()
    if not raw_type:
        raw_type = collapse_whitespace(raw_question.get('type')).lower()
    if raw_type in VALID_QUESTION_TYPES:
        return 'mcq' if raw_type == 'multiple_choice' else raw_type

    options = [clean_option_text(option) for option in (raw_question.get('options') or [])]
    normalized_options = [normalize_text_for_similarity(option) for option in options]
    if len(options) == 2 and set(normalized_options) == {'true', 'false'}:
        return 'true_false'
    return 'mcq'


def extract_correct_answer_index(raw_question, options):
    raw_index = raw_question.get('correct_answer_index')
    if isinstance(raw_index, int) and 0 <= raw_index < len(options):
        return raw_index

    raw_answer = collapse_whitespace(raw_question.get('correct_answer'))
    if not raw_answer:
        return None

    if raw_answer.isdigit():
        numeric = int(raw_answer)
        if 0 <= numeric < len(options):
            return numeric

    if len(raw_answer) == 1 and raw_answer.upper() in 'ABCD':
        return ord(raw_answer.upper()) - 65

    normalized_answer = normalize_text_for_similarity(raw_answer)
    for index, option in enumerate(options):
        if normalize_text_for_similarity(option) == normalized_answer:
            return index
    return None


def validate_question_candidate(raw_question, existing_question_texts=None):
    question_text = ensure_terminal_punctuation(raw_question.get('question_text'))
    question_type = normalize_question_type(raw_question)
    options = [clean_option_text(option) for option in (raw_question.get('options') or [])]
    explanation = collapse_whitespace(raw_question.get('explanation')) or ''
    correct_answer_index = extract_correct_answer_index(raw_question, options)

    issues = []
    if len(question_text.split()) < MIN_QUESTION_WORDS:
        issues.append('Question text is too short.')
    if question_text.endswith(':') or question_text.endswith(','):
        issues.append('Question text is incomplete.')
    if any(pattern.search(question_text) for pattern in PLACEHOLDER_PATTERNS):
        issues.append('Question uses banned placeholder wording.')
    if is_duplicate_or_similar_question(question_text, existing_question_texts or []):
        issues.append('Question is duplicated or too similar to an existing item.')
    expected_option_count = 2 if question_type == 'true_false' else 4
    if len(options) != expected_option_count:
        issues.append(f'Question must contain exactly {expected_option_count} options.')
    if any(not option for option in options):
        issues.append('Options cannot be empty.')
    if question_type == 'true_false':
        normalized_options = {normalize_text_for_similarity(option) for option in options}
        if normalized_options != {'true', 'false'}:
            issues.append('True/False question must use only True and False options.')
    if has_near_duplicate_options(options):
        issues.append('Options are duplicated or too similar.')
    if question_type != 'true_false' and has_low_quality_option_pattern(options):
        issues.append('Options follow an overly repetitive pattern.')
    if correct_answer_index is None or correct_answer_index >= len(options):
        issues.append('Correct answer does not map to a valid option.')
    if explanation and len(explanation.split()) < 4:
        explanation = ''

    if issues:
        return None, issues

    return (
        {
            'question_text': question_text,
            'question_type': question_type,
            'options': options,
            'correct_answer_index': correct_answer_index,
            'explanation': explanation or default_explanation(options[correct_answer_index]),
        },
        [],
    )


def shuffle_question_options(question, rng=None):
    randomizer = rng or random.SystemRandom()
    indexed_options = list(enumerate(question['options']))
    randomizer.shuffle(indexed_options)

    shuffled_options = []
    next_correct_index = 0
    for new_index, (old_index, option_text) in enumerate(indexed_options):
        shuffled_options.append(option_text)
        if old_index == question['correct_answer_index']:
            next_correct_index = new_index

    return {
        **question,
        'options': shuffled_options,
        'correct_answer_index': next_correct_index,
    }


def finalize_question_batch(raw_questions, existing_question_texts=None, limit=None, rng=None):
    accepted_questions = []
    seen_texts = list(existing_question_texts or [])

    for raw_question in raw_questions or []:
        question, issues = validate_question_candidate(raw_question, existing_question_texts=seen_texts)
        if issues:
            continue
        shuffled = shuffle_question_options(question, rng=rng)
        accepted_questions.append(shuffled)
        seen_texts.append(shuffled['question_text'])
        if limit and len(accepted_questions) >= limit:
            break

    return accepted_questions
