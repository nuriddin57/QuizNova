import json
import os
import random
import re
from urllib import error as url_error
from urllib import request as url_request

from .question_quality import finalize_question_batch


LANGUAGE_NAMES = {
    'en': 'English',
    'uz': 'Uzbek',
    'ru': 'Russian',
}

MOCK_STYLE_LIBRARY = {
    'en': [
        {
            'question': 'In {subject}, what is the main purpose of {topic} at a {difficulty_label} level?',
            'options': [
                'To apply a structured method for reasoning about the topic',
                'To replace evidence with personal opinion',
                'To avoid checking whether a result is valid',
                'To memorize unrelated facts without context',
            ],
        },
        {
            'question': 'A student is solving a {subject} task about {topic}. Which action is the most academically sound?',
            'options': [
                'Identify the relevant principle and justify the chosen answer',
                'Pick the first familiar term without analysis',
                'Ignore the conditions given in the task',
                'Assume every problem has the same solution pattern',
            ],
        },
        {
            'question': 'Which statement best distinguishes strong understanding of {topic} in {subject}?',
            'options': [
                'It connects the concept to evidence, reasoning, and correct application',
                'It relies only on memorizing one isolated definition',
                'It rejects alternative interpretations without evaluation',
                'It treats every similar term as identical',
            ],
        },
        {
            'question': 'During a classroom discussion on {topic}, which response shows correct application of the concept in {subject}?',
            'options': [
                'Using the concept to explain why a specific answer is justified',
                'Repeating the topic name without linking it to the question',
                'Choosing an answer because it sounds more technical',
                'Assuming the longest option must be correct',
            ],
        },
        {
            'question': 'Why is {topic} important when studying {subject} at a {difficulty_label} level?',
            'options': [
                'Because it helps learners analyze, compare, and justify conclusions',
                'Because it removes the need for interpretation',
                'Because it makes every topic in the subject interchangeable',
                'Because it is useful only for guessing on tests',
            ],
        },
        {
            'question': 'When evaluating an answer about {topic} in {subject}, what should a well-prepared student check first?',
            'options': [
                'Whether the reasoning actually matches the concept being tested',
                'Whether the option contains the most advanced vocabulary',
                'Whether the answer is the longest choice on the page',
                'Whether the option appears earlier than the others',
            ],
        },
        {
            'question': 'What makes an explanation of {topic} academically strong in a {subject} quiz?',
            'options': [
                'It is precise, relevant, and supported by the concept being assessed',
                'It uses broad claims without linking them to the question',
                'It avoids subject terminology entirely',
                'It focuses only on test-taking tricks',
            ],
        },
        {
            'question': 'Suppose two answers about {topic} both seem reasonable in {subject}. How should they be compared?',
            'options': [
                'By checking which answer is better supported by the key principle in the question',
                'By choosing the answer with more complex wording',
                'By preferring the option that introduces unrelated facts',
                'By selecting the option that sounds the most absolute',
            ],
        },
    ],
    'uz': [
        {
            'question': '{subject} fanida {topic} mavzusining {difficulty_label} darajadagi asosiy vazifasi nima?',
            'options': [
                'Mavzuni tushunish va asosli xulosa chiqarish uchun tartibli yondashuv berish',
                'Dalillar o‘rniga shaxsiy fikrni qo‘llash',
                'Natijani tekshirmasdan javobni qabul qilish',
                'Mavzuga aloqasiz faktlarni yodlash bilan cheklanish',
            ],
        },
        {
            'question': "Talaba {subject} fanidan {topic} bo'yicha topshiriq ishlamoqda. Qaysi harakat eng to'g'ri akademik yondashuv hisoblanadi?",
            'options': [
                'Tegishli tamoyilni aniqlab, javobni izohlash',
                'Birinchi tanish atamani tahlilsiz tanlash',
                'Savoldagi shartlarni e’tiborsiz qoldirish',
                'Har bir masala bir xil usul bilan yechiladi deb o‘ylash',
            ],
        },
        {
            'question': "{subject} fanida {topic} ni chuqur tushungan o'quvchini qaysi belgi eng yaxshi ifodalaydi?",
            'options': [
                'U tushuncha, dalil va qo‘llash o‘rtasidagi bog‘lanishni ko‘rsata oladi',
                'Faqat bitta ta’rifni yodlab aytadi',
                'Muqobil talqinlarni tekshirmasdan rad etadi',
                'O‘xshash atamalarning barchasini bir xil deb hisoblaydi',
            ],
        },
        {
            'question': '{topic} mavzusi muhokamasida qaysi javob {subject} fanidagi tushunchani to‘g‘ri qo‘llashni ko‘rsatadi?',
            'options': [
                'Tushunchani muayyan javob nima uchun to‘g‘ri ekanini izohlashda ishlatish',
                'Savol bilan bog‘lamasdan faqat mavzu nomini takrorlash',
                'Texnikroq eshitilgani uchun variant tanlash',
                'Eng uzun variant doimo to‘g‘ri deb hisoblash',
            ],
        },
        {
            'question': "{subject} fanini {difficulty_label} darajada o'rganishda {topic} nega muhim?",
            'options': [
                'Chunki u tahlil qilish, solishtirish va xulosani asoslashga yordam beradi',
                'Chunki u talqinga ehtiyojni butunlay yo‘q qiladi',
                'Chunki u fandagi barcha mavzularni bir xil qiladi',
                'Chunki u faqat testda taxmin qilish uchun kerak',
            ],
        },
        {
            'question': "{subject} fanida {topic} bo'yicha javobni baholashda tayyor talaba avvalo nimani tekshirishi kerak?",
            'options': [
                'Javobdagi fikrlash sinov qilinayotgan tushunchaga mos keladimi-yo‘qmi',
                'Variant ichida eng murakkab so‘zlar ishlatilganmi-yo‘qmi',
                'Eng uzun variant tanlanganmi-yo‘qmi',
                'Variant boshqalardan oldin kelganmi-yo‘qmi',
            ],
        },
        {
            'question': "{subject} fanidagi quizda {topic} ni izohlash qachon akademik jihatdan kuchli hisoblanadi?",
            'options': [
                'Izoh aniq bo‘lsa, savolga bevosita mos kelsa va tushunchaga tayanib asoslangan bo‘lsa',
                'Umumiy gaplar aytilib, savol bilan bog‘lanmasa',
                'Fanga oid atamalar butunlay ishlatilmasa',
                'Faqat test yechish fokuslari aytilsa',
            ],
        },
        {
            'question': "Faraz qiling, {subject} fanida {topic} bo'yicha ikki javob birdek mantiqli ko'rinmoqda. Ularni qanday taqqoslash kerak?",
            'options': [
                'Savoldagi asosiy tamoyilga qaysi javob yaxshiroq tayanganini tekshirish kerak',
                'So‘zlari murakkabroq bo‘lgan variantni tanlash kerak',
                'Mavzuga aloqasiz fakt qo‘shilgan variantni afzal ko‘rish kerak',
                'Eng qat’iy eshitilgan variantni tanlash kerak',
            ],
        },
    ],
    'ru': [
        {
            'question': 'Какова основная роль темы "{topic}" в предмете {subject} на {difficulty_label} уровне?',
            'options': [
                'Помогать применять структурированный подход к анализу и обоснованию ответа',
                'Заменять доказательства личным мнением',
                'Позволять принимать результат без проверки',
                'Сводить обучение к запоминанию несвязанных фактов',
            ],
        },
        {
            'question': 'Студент решает задание по {subject}, связанное с темой "{topic}". Какое действие наиболее академически корректно?',
            'options': [
                'Определить нужный принцип и обосновать выбранный ответ',
                'Выбрать первый знакомый термин без анализа',
                'Игнорировать условия, данные в задании',
                'Считать, что все задачи решаются по одной схеме',
            ],
        },
        {
            'question': 'Какой признак лучше всего показывает глубокое понимание темы "{topic}" в {subject}?',
            'options': [
                'Умение связывать понятие с доказательствами, выводом и применением',
                'Запоминание только одного изолированного определения',
                'Отказ рассматривать другие интерпретации',
                'Отношение ко всем похожим терминам как к одинаковым',
            ],
        },
        {
            'question': 'Какой ответ на обсуждении темы "{topic}" показывает правильное применение понятия в {subject}?',
            'options': [
                'Использование понятия для объяснения, почему ответ обоснован',
                'Повторение названия темы без связи с вопросом',
                'Выбор варианта только потому, что он звучит сложнее',
                'Предположение, что самый длинный вариант всегда верный',
            ],
        },
        {
            'question': 'Почему тема "{topic}" важна при изучении {subject} на {difficulty_label} уровне?',
            'options': [
                'Потому что она помогает анализировать, сравнивать и обосновывать выводы',
                'Потому что она полностью устраняет необходимость интерпретации',
                'Потому что делает все темы в предмете взаимозаменяемыми',
                'Потому что нужна только для угадывания на тестах',
            ],
        },
        {
            'question': 'Что должен проверить подготовленный студент в первую очередь при оценке ответа по теме "{topic}" в {subject}?',
            'options': [
                'Соответствует ли рассуждение ключевой идее, проверяемой в вопросе',
                'Содержит ли вариант самые сложные термины',
                'Является ли вариант самым длинным на странице',
                'Расположен ли вариант раньше остальных',
            ],
        },
        {
            'question': 'Когда объяснение темы "{topic}" в викторине по {subject} можно считать академически сильным?',
            'options': [
                'Когда оно точное, уместное и опирается на проверяемое понятие',
                'Когда в нем есть только общие утверждения без связи с вопросом',
                'Когда оно полностью избегает терминов предмета',
                'Когда оно описывает только стратегии угадывания',
            ],
        },
        {
            'question': 'Предположим, два ответа по теме "{topic}" в {subject} кажутся правдоподобными. Как их лучше сравнить?',
            'options': [
                'Проверить, какой ответ лучше подтверждается основным принципом из вопроса',
                'Выбрать вариант с более сложной формулировкой',
                'Предпочесть вариант с несвязанными дополнительными фактами',
                'Считать более верным самый категоричный вариант',
            ],
        },
    ],
}

DIFFICULTY_LABELS = {
    'en': {'easy': 'introductory', 'medium': 'intermediate', 'hard': 'advanced'},
    'uz': {'easy': 'boshlang‘ich', 'medium': 'o‘rta', 'hard': 'yuqori'},
    'ru': {'easy': 'начальном', 'medium': 'среднем', 'hard': 'продвинутом'},
}

MOCK_MCQ_PREFIXES = {
    'en': [
        'In a lecture review,',
        'During seminar prep,',
        'From an exam perspective,',
        'In a classroom scenario,',
        'For a guided practice task,',
        'When revising the topic,',
        'In an assessment setting,',
        'For concept checking,',
    ],
    'uz': [
        'Ma’ruza takrorida,',
        'Seminar tayyorgarligida,',
        'Imtihon nuqtai nazaridan,',
        'Dars jarayonida,',
        'Amaliy mashqda,',
        'Mavzuni takrorlashda,',
        'Baholash holatida,',
        'Tushunchani tekshirishda,',
    ],
    'ru': [
        'При разборе лекции,',
        'Во время подготовки к семинару,',
        'С точки зрения экзамена,',
        'В учебной ситуации,',
        'В практическом задании,',
        'При повторении темы,',
        'В формате проверки знаний,',
        'Для проверки понимания,',
    ],
}

MOCK_MCQ_CONTEXTS = {
    'en': [
        'while reviewing a student explanation',
        'when comparing two close answer choices',
        'in a short in-class quiz',
        'during independent revision',
        'while checking conceptual understanding',
        'in a practical problem-solving task',
        'during oral discussion preparation',
        'while evaluating academic reasoning',
    ],
    'uz': [
        'talaba izohini tekshirayotganda',
        'bir-biriga yaqin ikki variantni solishtirganda',
        'qisqa auditoriya quizida',
        'mustaqil takrorlash jarayonida',
        'tushunchaviy anglashni baholaganda',
        'amaliy muammo yechish topshirig‘ida',
        'og‘zaki muhokamaga tayyorgarlikda',
        'akademik fikrlashni tekshirayotganda',
    ],
    'ru': [
        'при проверке объяснения студента',
        'при сравнении двух близких вариантов ответа',
        'в короткой аудиторной викторине',
        'во время самостоятельного повторения',
        'при оценке понимания понятия',
        'в практическом задании на решение проблемы',
        'при подготовке к устному обсуждению',
        'при проверке академического рассуждения',
    ],
}

MOCK_MCQ_FRAMES = {
    'en': [
        '{prefix} version {number}: {stem}, {context}?',
        '{prefix} version {number}: consider this case carefully. {stem}, {context}?',
        '{prefix} version {number}: focus on the strongest academic judgment. {stem}, {context}?',
        '{prefix} version {number}: use evidence-based thinking here. {stem}, {context}?',
    ],
    'uz': [
        '{prefix} {number}-variant: {stem}, {context}?',
        '{prefix} {number}-variant: ushbu holatni diqqat bilan ko‘rib chiqing. {stem}, {context}?',
        '{prefix} {number}-variant: eng kuchli akademik xulosaga e’tibor bering. {stem}, {context}?',
        '{prefix} {number}-variant: bu yerda dalillarga tayangan fikrlash kerak. {stem}, {context}?',
    ],
    'ru': [
        '{prefix} вариант {number}: {stem}, {context}?',
        '{prefix} вариант {number}: внимательно рассмотрите этот случай. {stem}, {context}?',
        '{prefix} вариант {number}: сосредоточьтесь на наиболее точном академическом выводе. {stem}, {context}?',
        '{prefix} вариант {number}: здесь нужно опираться на доказательное мышление. {stem}, {context}?',
    ],
}


def generate_questions(
    *,
    topic,
    subject,
    difficulty,
    number_of_questions,
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    language = (language or 'en').strip().lower()
    excluded_questions = [item for item in (excluded_questions or []) if str(item).strip()]
    target_count = max(1, int(number_of_questions))
    if target_count == 10:
        true_false_questions = generate_true_false_questions(
            topic=topic,
            difficulty=difficulty,
            count=5,
            subject=subject,
            field_of_study_name=field_of_study_name,
            language=language,
            excluded_questions=excluded_questions,
        )
        multiple_choice_questions = generate_multiple_choice_questions(
            topic=topic,
            difficulty=difficulty,
            count=5,
            subject=subject,
            field_of_study_name=field_of_study_name,
            language=language,
            excluded_questions=excluded_questions + [item['question_text'] for item in true_false_questions['questions']],
        )
        combined_questions = true_false_questions['questions'] + multiple_choice_questions['questions']
        provider = _merge_provider_names(true_false_questions['provider'], multiple_choice_questions['provider'])
        return _build_generation_response(provider=provider, questions=combined_questions, requested_count=target_count)

    generated = _generate_questions_for_type(
        topic=topic,
        subject=subject,
        difficulty=difficulty,
        target_count=target_count,
        target_question_type='mcq',
        field_of_study_name=field_of_study_name,
        language=language,
        excluded_questions=excluded_questions,
    )
    return _build_generation_response(
        provider=generated['provider'],
        questions=generated['questions'],
        requested_count=target_count,
    )


def regenerate_question(
    *,
    topic,
    subject,
    difficulty,
    field_of_study_name='',
    language='en',
    existing_questions=None,
    current_question_text='',
    current_question_type='',
):
    excluded = list(existing_questions or [])
    if current_question_text:
        excluded.append(current_question_text)

    normalized_type = str(current_question_type or '').strip().lower()
    if normalized_type == 'multiple_choice':
        normalized_type = 'mcq'

    if normalized_type in {'mcq', 'true_false'}:
        generated = _generate_questions_for_type(
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            target_count=1,
            target_question_type=normalized_type,
            field_of_study_name=field_of_study_name,
            language=language,
            excluded_questions=excluded,
        )
        result = _build_generation_response(
            provider=generated['provider'],
            questions=generated['questions'],
            requested_count=1,
        )
    else:
        result = generate_questions(
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            number_of_questions=1,
            field_of_study_name=field_of_study_name,
            language=language,
            excluded_questions=excluded,
        )
    question = (result.get('questions') or [None])[0]
    return {'provider': result['provider'], 'question': question}


def generate_true_false_questions(
    topic,
    difficulty,
    count=5,
    *,
    subject='',
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    generated = _generate_questions_for_type(
        topic=topic,
        subject=subject,
        difficulty=difficulty,
        target_count=max(1, int(count)),
        target_question_type='true_false',
        field_of_study_name=field_of_study_name,
        language=language,
        excluded_questions=excluded_questions,
    )
    return _build_generation_response(
        provider=generated['provider'],
        questions=generated['questions'],
        requested_count=max(1, int(count)),
    )


def generate_multiple_choice_questions(
    topic,
    difficulty,
    count=5,
    *,
    subject='',
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    generated = _generate_questions_for_type(
        topic=topic,
        subject=subject,
        difficulty=difficulty,
        target_count=max(1, int(count)),
        target_question_type='mcq',
        field_of_study_name=field_of_study_name,
        language=language,
        excluded_questions=excluded_questions,
    )
    return _build_generation_response(
        provider=generated['provider'],
        questions=generated['questions'],
        requested_count=max(1, int(count)),
    )


def _build_generation_response(*, provider, questions, requested_count):
    formatted_questions = [_format_generated_question(question) for question in (questions or [])][:requested_count]
    true_false_count = sum(1 for item in formatted_questions if item['type'] == 'true_false')
    multiple_choice_count = sum(1 for item in formatted_questions if item['type'] == 'multiple_choice')
    return {
        'success': len(formatted_questions) == requested_count,
        'provider': provider or 'mock',
        'total_questions': len(formatted_questions),
        'true_false_count': true_false_count,
        'multiple_choice_count': multiple_choice_count,
        'questions': formatted_questions,
    }


def _format_generated_question(question):
    question_type = question.get('question_type') or 'mcq'
    response_type = 'true_false' if question_type == 'true_false' else 'multiple_choice'
    correct_index = int(question.get('correct_answer_index', 0))
    options = list(question.get('options') or [])
    correct_answer = options[correct_index] if 0 <= correct_index < len(options) else ''
    return {
        **question,
        'type': response_type,
        'question_type': question_type,
        'correct_answer': correct_answer,
    }


def _merge_provider_names(*providers):
    names = []
    for provider in providers:
        for item in str(provider or '').split('+'):
            if item and item not in names:
                names.append(item)
    return '+'.join(names) or 'mock'


def to_quiz_payload_questions(generated_questions):
    payload = []
    for index, question in enumerate(generated_questions):
        correct_index = int(question.get('correct_answer_index', 0))
        options = question.get('options') or []
        payload.append(
            {
                'text': question.get('question_text', ''),
                'explanation': question.get('explanation', ''),
                'question_type': question.get('question_type') or 'mcq',
                'timer_seconds': 30,
                'order': index,
                'choices': [
                    {'text': option, 'is_correct': option_index == correct_index, 'order': option_index}
                    for option_index, option in enumerate(options)
                ],
            }
        )
    return payload


def analyze_question_draft(*, question_text, question_type='mcq', options=None, correct_answer='', explanation=''):
    question_text = re.sub(r'\s+', ' ', str(question_text or '').strip())
    explanation = re.sub(r'\s+', ' ', str(explanation or '').strip())
    normalized_options = [re.sub(r'\s+', ' ', str(item or '').strip()) for item in (options or [])]

    strengths = []
    issues = []
    suggestions = []
    score = 100

    if len(question_text) >= 18:
        strengths.append('Question text is long enough to be understandable.')
    else:
        issues.append('Question text is too short or unclear.')
        suggestions.append('Write the stem as a complete, specific question.')
        score -= 18

    if question_text.endswith('?'):
        strengths.append('Question is phrased as a direct question.')
    else:
        issues.append('Question stem should ideally end with a question mark.')
        suggestions.append('Turn the stem into a clear question ending with "?".')
        score -= 6

    lowered = question_text.lower()
    if any(token in lowered for token in ['always', 'never', 'all of the above', 'none of the above']):
        issues.append('Stem contains wording that often makes quiz items weaker or easier to guess.')
        suggestions.append('Avoid absolute phrases like "always" or "never" unless academically necessary.')
        score -= 10

    if question_type == 'true_false':
        normalized_options = ['True', 'False']
        if correct_answer.upper() in {'TRUE', 'FALSE'}:
            strengths.append('True/False answer key is valid.')
        else:
            issues.append('True/False question must have TRUE or FALSE as the correct answer.')
            suggestions.append('Set the correct answer to TRUE or FALSE.')
            score -= 18
    else:
        usable_options = [item for item in normalized_options if item]
        if len(usable_options) < 4:
            issues.append('Multiple-choice question needs four answer options.')
            suggestions.append('Provide four distinct answer choices.')
            score -= 20
        else:
            strengths.append('Question includes four answer options.')

        unique_options = {item.lower() for item in usable_options if item}
        if usable_options and len(unique_options) != len(usable_options):
            issues.append('Some answer options are duplicated or too similar.')
            suggestions.append('Make each answer option distinct.')
            score -= 14

        if correct_answer.upper() not in {'A', 'B', 'C', 'D'}:
            issues.append('Correct answer key for MCQ must be A, B, C, or D.')
            suggestions.append('Select one valid correct answer.')
            score -= 18
        else:
            strengths.append('Correct answer key is set.')

    if explanation:
        strengths.append('Explanation is provided.')
    else:
        suggestions.append('Add a short explanation so students understand why the answer is correct.')
        score -= 6

    if len(question_text.split()) >= 6:
        strengths.append('Stem has enough context for learners.')
    else:
        issues.append('Stem may not provide enough context.')
        suggestions.append('Add more context or a concrete concept to test.')
        score -= 8

    score = max(0, min(100, score))
    if score >= 80:
        level = 'strong'
        summary = 'Question is mostly ready to use.'
    elif score >= 55:
        level = 'needs_review'
        summary = 'Question is usable but should be improved before publishing.'
    else:
        level = 'weak'
        summary = 'Question needs revision before it is suitable for learners.'

    return {
        'quality_score': score,
        'level': level,
        'summary': summary,
        'strengths': strengths,
        'issues': issues,
        'suggestions': suggestions,
        'normalized_options': normalized_options,
    }


def _collect_questions_with_provider(*, provider_name, provider, target_count, excluded_questions, randomizer):
    accepted = []
    attempts = 0
    while len(accepted) < target_count and attempts < 4:
        attempts += 1
        remaining = target_count - len(accepted)
        request_count = min(max(remaining * 2, remaining + 2), 12)
        batch_exclusions = excluded_questions + [item['question_text'] for item in accepted]

        try:
            raw_questions = provider(request_count, batch_exclusions)
        except Exception:
            if provider_name == 'openai':
                break
            raw_questions = []

        accepted.extend(finalize_question_batch(raw_questions, existing_question_texts=batch_exclusions, limit=remaining, rng=randomizer))
    return accepted


def _generate_questions_for_type(
    *,
    topic,
    subject,
    difficulty,
    target_count,
    target_question_type,
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    randomizer = random.SystemRandom()
    api_key = os.getenv('OPENAI_API_KEY', '').strip()
    providers_used = []
    exclusions = list(excluded_questions or [])
    accepted = []

    def collect_missing_questions():
        current_exclusions = exclusions + [item['question_text'] for item in accepted]
        if api_key:
            openai_questions = _collect_questions_with_provider(
                provider_name='openai',
                provider=lambda request_count, batch_exclusions: _generate_with_openai(
                    api_key=api_key,
                    topic=topic,
                    subject=subject,
                    difficulty=difficulty,
                    number_of_questions=request_count,
                    target_count=target_count,
                    target_question_type=target_question_type,
                    field_of_study_name=field_of_study_name,
                    language=language,
                    excluded_questions=batch_exclusions,
                ),
                target_count=target_count - len(accepted),
                excluded_questions=current_exclusions,
                randomizer=randomizer,
            )
            if openai_questions:
                accepted.extend(openai_questions)
                providers_used.append('openai')

        if len(accepted) < target_count:
            mock_questions = _collect_questions_with_provider(
                provider_name='mock',
                provider=lambda request_count, batch_exclusions: _mock_generate_questions(
                    topic=topic,
                    subject=subject,
                    difficulty=difficulty,
                    number_of_questions=request_count,
                    target_count=target_count,
                    target_question_type=target_question_type,
                    field_of_study_name=field_of_study_name,
                    language=language,
                    excluded_questions=batch_exclusions,
                ),
                target_count=target_count - len(accepted),
                excluded_questions=current_exclusions,
                randomizer=randomizer,
            )
            if mock_questions:
                accepted.extend(mock_questions)
                providers_used.append('mock')

    collect_missing_questions()

    regeneration_attempts = 0
    while len(accepted) < target_count and regeneration_attempts < 3:
        regeneration_attempts += 1
        collect_missing_questions()

    return {
        'provider': '+'.join(dict.fromkeys(providers_used)) or 'mock',
        'questions': accepted[:target_count],
    }


def _generate_with_openai(
    *,
    api_key,
    topic,
    subject,
    difficulty,
    number_of_questions,
    target_count,
    target_question_type=None,
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    language_name = LANGUAGE_NAMES.get(language, 'English')
    excluded_lines = '\n'.join(f'- {item}' for item in (excluded_questions or [])[:20]) or '- None'
    prompt = (
        'Generate production-ready university quiz questions in strict JSON.\n'
        'Return only a JSON object with this exact shape:\n'
        '{"questions":[{"type":"multiple_choice|true_false","question_text":"...","options":["..."],"correct_answer":"...","explanation":"..."}]}\n\n'
        'Requirements:\n'
        '- Write in the requested language only.\n'
        '- Create unique, natural, educational quiz questions.\n'
        '- Vary question styles across the batch: definition, understanding, application, scenario, comparison.\n'
        '- Do not repeat the same opening phrase or sentence structure.\n'
        '- Do not use weak templates like "Which option best describes..." or placeholder language.\n'
        '- Every question must be complete, grammatically correct, and clearly ask one thing.\n'
        '- If the requested count is 10, return exactly 5 true_false questions first and exactly 5 multiple_choice questions after them.\n'
        '- For any true_false question, set type to "true_false" and options to exactly ["True","False"].\n'
        '- For any multiple_choice question, set type to "multiple_choice" and return exactly 4 plausible options.\n'
        '- Exactly 1 correct answer, returned as the full correct option text in "correct_answer".\n'
        '- Incorrect options must be realistic distractors, not nonsense.\n'
        '- Shuffle the option order naturally.\n'
        '- Add a short explanation of why the correct answer is right.\n'
        '- Avoid duplicates or near-duplicates.\n'
        '- Match the requested subject, topic, field, difficulty, and language.\n\n'
        f'Language: {language_name}\n'
        f'Field of study: {field_of_study_name or "General"}\n'
        f'Subject: {subject}\n'
        f'Topic: {topic}\n'
        f'Difficulty: {difficulty}\n'
        f'Question count: {number_of_questions}\n'
        f'If final question count is {target_count}, honor the mixed structure requirement exactly when count is 10.\n'
        f'If a specific question type is requested, return only that type: {"multiple_choice" if target_question_type == "mcq" else target_question_type or "mixed as needed"}.\n'
        'Questions to avoid repeating or paraphrasing:\n'
        f'{excluded_lines}\n'
    )
    payload = {
        'model': model,
        'temperature': 0.85,
        'response_format': {'type': 'json_object'},
        'messages': [
            {
                'role': 'system',
                'content': (
                    'You are a strict assessment writer for QuizNova. '
                    'You write realistic, diverse, high-quality educational quiz questions and return valid JSON only.'
                ),
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
    text = data.get('choices', [{}])[0].get('message', {}).get('content', '')
    parsed = _extract_json_object(text)
    questions = parsed.get('questions') or []
    if not isinstance(questions, list):
        raise ValueError('OpenAI response did not return a questions list.')
    return questions


def _extract_json_object(text):
    if isinstance(text, dict):
        return text
    content = str(text or '').strip()
    if content.startswith('```'):
        content = re.sub(r'^```(?:json)?\s*|\s*```$', '', content, flags=re.DOTALL)
    return json.loads(content)


def _mock_generate_questions(
    *,
    topic,
    subject,
    difficulty,
    number_of_questions,
    target_count,
    target_question_type=None,
    field_of_study_name='',
    language='en',
    excluded_questions=None,
):
    language = language if language in MOCK_STYLE_LIBRARY else 'en'
    seed = f'{topic}:{subject}:{difficulty}:{field_of_study_name}:{language}:{len(excluded_questions or [])}:{number_of_questions}'
    generator = random.Random(seed)
    styles = MOCK_STYLE_LIBRARY[language][:]
    generator.shuffle(styles)

    difficulty_label = DIFFICULTY_LABELS.get(language, DIFFICULTY_LABELS['en']).get(difficulty, difficulty)
    normalized_topic = topic.strip() or 'General topic'
    normalized_subject = subject.strip() or 'General subject'
    normalized_field = field_of_study_name.strip() or ''
    base_offset = len(excluded_questions or [])

    questions = []
    mcq_target = 5 if target_count == 10 and target_question_type in {None, 'mcq'} else number_of_questions if target_question_type in {None, 'mcq'} else 0
    tf_target = 5 if target_count == 10 and target_question_type in {None, 'true_false'} else number_of_questions if target_question_type == 'true_false' else 0

    while len(questions) < min(number_of_questions, mcq_target):
        index = base_offset + len(questions)
        if index < len(styles):
            style = styles[index]
            stem = style['question'].format(
                subject=normalized_subject,
                topic=normalized_topic,
                difficulty_label=difficulty_label,
                field_of_study_name=normalized_field,
            )
            options = [option.format(subject=normalized_subject, topic=normalized_topic) for option in style['options']]
        else:
            dynamic_style = _mock_dynamic_mcq_style(language, normalized_subject, normalized_topic, difficulty_label, index)
            stem = dynamic_style['question']
            options = dynamic_style['options']
        stem = _mock_mcq_question_text(language, stem, index)
        options = _mock_mcq_options(language, options, index)
        questions.append(
            {
                'question_text': stem,
                'question_type': 'mcq',
                'type': 'multiple_choice',
                'options': options[:4],
                'correct_answer': options[0],
                'explanation': _mock_explanation(language, normalized_topic, normalized_subject),
            }
        )

    for local_tf_index in range(min(number_of_questions - len(questions), tf_target)):
        index = base_offset + local_tf_index
        tf_options = _true_false_options(language)
        statement = _mock_true_false_statement(language, normalized_subject, normalized_topic, difficulty_label, index)
        questions.append(
            {
                'question_text': statement['question_text'],
                'question_type': 'true_false',
                'type': 'true_false',
                'options': tf_options,
                'correct_answer': tf_options[0] if statement['is_true'] else tf_options[1],
                'explanation': _mock_explanation(language, normalized_topic, normalized_subject),
            }
        )
    return questions


def _mock_explanation(language, topic, subject):
    if language == 'uz':
        return f'To‘g‘ri javob {topic} mavzusining {subject} fanidagi asosiy mazmuni va amaliy qo‘llanishiga mos keladi.'
    if language == 'ru':
        return f'Верный ответ отражает основную идею и корректное применение темы "{topic}" в предмете {subject}.'
    return f'The correct answer reflects the main idea and proper application of {topic} within {subject}.'


def _mock_mcq_question_text(language, base_stem, index):
    prefixes = MOCK_MCQ_PREFIXES.get(language, MOCK_MCQ_PREFIXES['en'])
    contexts = MOCK_MCQ_CONTEXTS.get(language, MOCK_MCQ_CONTEXTS['en'])
    frames = MOCK_MCQ_FRAMES.get(language, MOCK_MCQ_FRAMES['en'])
    prefix = prefixes[index % len(prefixes)]
    context = contexts[index % len(contexts)]
    stem = base_stem[:-1] if base_stem.endswith('?') else base_stem
    frame = frames[(index // max(1, len(prefixes))) % len(frames)]
    return frame.format(prefix=prefix, number=index + 1, stem=stem, context=context)


def _mock_mcq_options(language, options, index):
    if language == 'uz':
        replacements = [
            ('Chunki u ', 'U '),
            ('Chunki u ', 'Bu yondashuv '),
            ('Chunki u ', 'Mazkur yondashuv '),
            ('Chunki u ', 'Ushbu holat '),
        ]
    elif language == 'ru':
        replacements = [
            ('Потому что она ', 'Она '),
            ('Потому что она ', 'Эта тема '),
            ('Потому что она ', 'Данный подход '),
            ('Потому что она ', 'Такой вариант '),
        ]
    else:
        replacements = [
            ('Because it ', 'It '),
            ('Because it ', 'This approach '),
            ('Because it ', 'That choice '),
            ('Because it ', 'This idea '),
        ]

    diversified = []
    for option_index, option in enumerate(options):
        next_option = option
        source, target = replacements[option_index % len(replacements)]
        if next_option.startswith(source):
            next_option = f'{target}{next_option[len(source):]}'
        diversified.append(next_option)
    return diversified


def _mock_dynamic_mcq_style(language, subject, topic, difficulty_label, index):
    templates = {
        'en': [
            {
                'question': f'Which classroom observation best shows accurate understanding of {topic} in {subject} at a {difficulty_label} level?',
                'options': [
                    'A response that links the concept to evidence and justified reasoning',
                    'A response that ignores the conditions given in the question',
                    'A response that picks the most technical-sounding term without analysis',
                    'A response that memorizes isolated facts without applying the concept',
                ],
            },
            {
                'question': f'When teaching {topic} in {subject}, what should a well-prepared student do first?',
                'options': [
                    'Identify the core principle being assessed before choosing an answer',
                    'Assume the longest option is automatically correct',
                    'Select the first familiar phrase without evaluating it',
                    'Treat all related terms as if they have the same meaning',
                ],
            },
            {
                'question': f'What makes an explanation of {topic} academically reliable in {subject}?',
                'options': [
                    'It is precise, relevant, and clearly tied to the concept being tested',
                    'It replaces reasoning with broad personal opinion',
                    'It avoids all subject-specific language even when needed',
                    'It adds unrelated information to sound more advanced',
                ],
            },
            {
                'question': f'In an assessment about {topic}, which approach is strongest for students in {subject}?',
                'options': [
                    'Checking whether the answer matches the exact idea asked in the stem',
                    'Choosing the option with the most absolute wording',
                    'Ignoring context to answer more quickly',
                    'Preferring options that introduce unrelated examples',
                ],
            },
            {
                'question': f'Which action would most likely improve a student’s answer on {topic} in {subject}?',
                'options': [
                    'Using the concept to justify why the selected answer is correct',
                    'Repeating the topic title instead of answering the question',
                    'Guessing based on option length alone',
                    'Skipping the reasoning step completely',
                ],
            },
            {
                'question': f'Why is careful interpretation important when answering questions about {topic} in {subject}?',
                'options': [
                    'Because correct answers depend on the concept and the conditions stated in the item',
                    'Because every difficult question should be answered with the same strategy',
                    'Because complex vocabulary is more important than meaning',
                    'Because evidence is less useful than intuition in assessments',
                ],
            },
            {
                'question': f'Which student response best reflects deep understanding of {topic} within {subject}?',
                'options': [
                    'A response that compares choices and selects the one best supported by the concept',
                    'A response that rejects all alternatives without reviewing them',
                    'A response that relies only on memorized wording',
                    'A response that chooses an answer before reading the full stem',
                ],
            },
            {
                'question': f'In practice questions on {topic}, what usually distinguishes a strong answer in {subject}?',
                'options': [
                    'Clear alignment between the answer, the reasoning, and the tested concept',
                    'Using the most complicated phrase available',
                    'Adding details that are unrelated to the topic',
                    'Assuming one strategy fits every question type',
                ],
            },
        ],
        'uz': [
            {
                'question': f'{subject} fanida {topic} ni {difficulty_label} darajada to‘g‘ri tushunishni qaysi holat eng yaxshi ko‘rsatadi?',
                'options': [
                    'Javobda tushuncha dalil va asosli fikrlash bilan bog‘langan bo‘lsa',
                    'Savoldagi shartlar butunlay e’tiborsiz qoldirilsa',
                    'Tahlilsiz faqat texnikroq eshitilgan atama tanlansa',
                    'Tushunchani qo‘llamasdan alohida faktlar yodlansa',
                ],
            },
            {
                'question': f'{subject} fanida {topic} bo‘yicha savol ishlaganda tayyor talaba eng avvalo nima qilishi kerak?',
                'options': [
                    'Javob tanlashdan oldin sinov qilinayotgan asosiy tamoyilni aniqlashi kerak',
                    'Eng uzun variantni avtomatik to‘g‘ri deb qabul qilishi kerak',
                    'Birinchi tanish iborani tekshirmasdan tanlashi kerak',
                    'Yaqin atamalarning barchasini bir xil ma’noda deb olishi kerak',
                ],
            },
            {
                'question': f'{subject} fanida {topic} ni izohlash qachon akademik jihatdan ishonchli bo‘ladi?',
                'options': [
                    'Izoh aniq bo‘lib, bevosita sinov qilinayotgan tushunchaga bog‘lansa',
                    'Fikrlash o‘rniga umumiy shaxsiy qarashlar ishlatilsa',
                    'Kerak bo‘lsa ham fan terminlari umuman qo‘llanmasa',
                    'Jiddiyroq ko‘rinish uchun mavzuga aloqasiz ma’lumot qo‘shilsa',
                ],
            },
            {
                'question': f'{topic} mavzusi bo‘yicha baholashda {subject} talabalari uchun qaysi yondashuv eng kuchli hisoblanadi?',
                'options': [
                    'Javob savol matnida so‘ralgan g‘oyaga mos kelishini tekshirish',
                    'Eng qat’iy eshitilgan variantni tanlash',
                    'Tezroq javob berish uchun kontekstni chetlab o‘tish',
                    'Mavzuga aloqasiz misollarni afzal ko‘rish',
                ],
            },
            {
                'question': f'{subject} fanida {topic} bo‘yicha talabaning javobini qaysi harakat eng ko‘p yaxshilaydi?',
                'options': [
                    'Tanlangan javob nima uchun to‘g‘ri ekanini tushuncha bilan asoslash',
                    'Savolga javob berish o‘rniga faqat mavzu nomini takrorlash',
                    'Faqat variant uzunligiga qarab taxmin qilish',
                    'Fikrlash bosqichini butunlay tashlab ketish',
                ],
            },
            {
                'question': f'{subject} fanida {topic} ga oid savollarda nega sinchkov talqin muhim?',
                'options': [
                    'Chunki to‘g‘ri javob tushuncha va savoldagi shartlarga bog‘liq bo‘ladi',
                    'Chunki har bir qiyin savol bir xil usulda yechilishi kerak bo‘ladi',
                    'Chunki murakkab so‘zlar ma’nodan ko‘ra muhimroq bo‘ladi',
                    'Chunki baholashda dalildan ko‘ra sezgi foydaliroq bo‘ladi',
                ],
            },
            {
                'question': f'{subject} fanida {topic} ni chuqur bilishni qaysi talaba javobi yaxshiroq ko‘rsatadi?',
                'options': [
                    'Variantlarni solishtirib, tushuncha bilan eng yaxshi asoslangan javobni tanlagan javob',
                    'Barcha muqobil variantlarni ko‘rmasdan rad etgan javob',
                    'Faqat yodlangan iboralarga tayangan javob',
                    'Savolni to‘liq o‘qimasdan javob tanlagan javob',
                ],
            },
            {
                'question': f'{topic} bo‘yicha amaliy savollarda {subject} fanida kuchli javobni nima ajratib turadi?',
                'options': [
                    'Javob, izoh va sinov qilinayotgan tushuncha o‘rtasidagi aniq moslik',
                    'Eng murakkab iborani ishlatish',
                    'Mavzuga aloqasiz tafsilotlarni qo‘shish',
                    'Har bir savol turiga bitta usul mos deb hisoblash',
                ],
            },
        ],
        'ru': [
            {
                'question': f'Какое наблюдение лучше всего показывает корректное понимание темы "{topic}" в {subject} на {difficulty_label} уровне?',
                'options': [
                    'Ответ связывает понятие с доказательствами и обоснованным рассуждением',
                    'Условия вопроса полностью игнорируются',
                    'Термин выбирается только потому, что звучит сложнее',
                    'Запоминаются отдельные факты без применения понятия',
                ],
            },
            {
                'question': f'Что подготовленный студент должен сделать сначала при работе с вопросом по теме "{topic}" в {subject}?',
                'options': [
                    'Сначала определить основной принцип, который проверяется в вопросе',
                    'Считать самый длинный вариант автоматически правильным',
                    'Выбрать первую знакомую формулировку без проверки',
                    'Считать все близкие термины полностью одинаковыми',
                ],
            },
            {
                'question': f'Когда объяснение темы "{topic}" в {subject} можно считать академически надежным?',
                'options': [
                    'Когда оно точное и напрямую связано с проверяемым понятием',
                    'Когда вместо рассуждения используются общие личные мнения',
                    'Когда предметные термины не используются даже при необходимости',
                    'Когда для солидности добавляются не относящиеся к теме детали',
                ],
            },
            {
                'question': f'Какой подход является самым сильным для студентов {subject} в оценивании темы "{topic}"?',
                'options': [
                    'Проверять, соответствует ли ответ идее, сформулированной в вопросе',
                    'Выбирать вариант с самым категоричным звучанием',
                    'Игнорировать контекст ради скорости',
                    'Предпочитать примеры, не связанные с темой',
                ],
            },
            {
                'question': f'Какое действие сильнее всего улучшит ответ студента по теме "{topic}" в {subject}?',
                'options': [
                    'Обосновать, почему выбранный ответ верен с точки зрения понятия',
                    'Повторять только название темы вместо ответа',
                    'Угадывать исключительно по длине варианта',
                    'Полностью пропускать этап рассуждения',
                ],
            },
            {
                'question': f'Почему внимательная интерпретация важна при ответах на вопросы о теме "{topic}" в {subject}?',
                'options': [
                    'Потому что верный ответ зависит от понятия и условий, указанных в задании',
                    'Потому что каждый сложный вопрос решается одинаковым способом',
                    'Потому что сложные слова важнее смысла',
                    'Потому что в оценивании интуиция полезнее доказательств',
                ],
            },
            {
                'question': f'Какой ответ студента лучше всего показывает глубокое знание темы "{topic}" в {subject}?',
                'options': [
                    'Ответ, где варианты сравниваются и выбирается лучше всего обоснованный понятием',
                    'Ответ, в котором все альтернативы отвергаются без просмотра',
                    'Ответ, построенный только на заученных формулировках',
                    'Ответ, выбранный до полного прочтения вопроса',
                ],
            },
            {
                'question': f'Что обычно отличает сильный ответ в практических вопросах по теме "{topic}" в {subject}?',
                'options': [
                    'Ясное соответствие между ответом, рассуждением и проверяемым понятием',
                    'Использование самой сложной формулировки',
                    'Добавление деталей, не относящихся к теме',
                    'Уверенность, что один прием подходит для всех типов вопросов',
                ],
            },
        ],
    }
    language_templates = templates.get(language, templates['en'])
    return language_templates[(index - len(MOCK_STYLE_LIBRARY.get(language, MOCK_STYLE_LIBRARY['en']))) % len(language_templates)]


def _true_false_options(language):
    if language == 'uz':
        return ['True', 'False']
    if language == 'ru':
        return ['True', 'False']
    return ['True', 'False']


def _mock_true_false_statement(language, subject, topic, difficulty_label, index):
    prompts = {
        'en': [
            {
                'question_text': f'Understanding {topic} in {subject} requires applying the core concept rather than guessing. True or False?',
                'is_true': True,
            },
            {
                'question_text': f'A correct response about {topic} in {subject} should be supported by relevant reasoning. True or False?',
                'is_true': True,
            },
            {
                'question_text': f'Memorizing unrelated facts is enough to demonstrate mastery of {topic} in {subject}. True or False?',
                'is_true': False,
            },
            {
                'question_text': f'A strong answer about {topic} in {subject} should match the concept tested by the question. True or False?',
                'is_true': True,
            },
            {
                'question_text': f'When interpreting {topic} in {subject}, the conditions stated in the question still matter. True or False?',
                'is_true': True,
            },
            {
                'question_text': f'For {topic} in {subject}, the longest answer option is always the correct one. True or False?',
                'is_true': False,
            },
        ],
        'uz': [
            {
                'question_text': f'{subject} fanida {topic} ni tushunish taxmin qilish emas, asosiy tushunchani qo‘llashni talab qiladi. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': True,
            },
            {
                'question_text': f'{topic} bo‘yicha to‘g‘ri javob {subject} fanida tegishli izoh bilan asoslanishi kerak. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': True,
            },
            {
                'question_text': f'{subject} fanida {topic} ni tushuntirish uchun mavzuga aloqasiz faktlarni yodlashning o‘zi yetarli. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': False,
            },
            {
                'question_text': f'{topic} bo‘yicha kuchli javob {subject} fanida savol sinayotgan tushunchaga mos bo‘lishi kerak. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': True,
            },
            {
                'question_text': f'{subject} fanidagi {topic} savoldagi shartlarga tayangan holda talqin qilinishi kerak. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': True,
            },
            {
                'question_text': f'{subject} fanida {topic} bo‘yicha eng uzun variant har doim to‘g‘ri javob bo‘ladi. To‘g‘rimi yoki noto‘g‘ri?',
                'is_true': False,
            },
        ],
        'ru': [
            {
                'question_text': f'Понимание темы "{topic}" в {subject} требует применения ключевой идеи, а не угадывания. Верно или неверно?',
                'is_true': True,
            },
            {
                'question_text': f'Корректный ответ по теме "{topic}" в {subject} должен быть обоснован. Верно или неверно?',
                'is_true': True,
            },
            {
                'question_text': f'Для темы "{topic}" в {subject} достаточно просто запомнить несвязанные факты. Верно или неверно?',
                'is_true': False,
            },
            {
                'question_text': f'Сильный ответ по теме "{topic}" в {subject} должен соответствовать проверяемому понятию. Верно или неверно?',
                'is_true': True,
            },
            {
                'question_text': f'Тему "{topic}" в {subject} нужно интерпретировать с учетом условий вопроса. Верно или неверно?',
                'is_true': True,
            },
            {
                'question_text': f'В теме "{topic}" по {subject} самый длинный вариант всегда является правильным. Верно или неверно?',
                'is_true': False,
            },
        ],
    }
    language_prompts = prompts.get(language, prompts['en'])
    return language_prompts[index % len(language_prompts)]
