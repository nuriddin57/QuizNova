import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import api from '../api/axios'
import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'
import QuestionForm from './QuestionForm'

const REQUIRED_TOTAL_QUESTIONS = 10
const REQUIRED_TRUE_FALSE = 5
const REQUIRED_ABC = 5
const QUESTION_KIND_TRUE_FALSE = 'true_false'
const QUESTION_KIND_ABC = 'abc'

const normalizeChoiceText = (value = '') => value.trim().toLowerCase()

const detectQuestionKind = (question) => {
  const normalized = (question?.choices || [])
    .map((choice) => normalizeChoiceText(choice?.text || ''))
    .filter(Boolean)

  if (normalized.length === 2 && new Set(normalized).size === 2 && normalized.every((item) => ['true', 'false'].includes(item))) {
    return QUESTION_KIND_TRUE_FALSE
  }
  if (normalized.length === 3 && new Set(normalized).size === 3 && normalized.every((item) => ['a', 'b', 'c'].includes(item))) {
    return QUESTION_KIND_ABC
  }
  return null
}

const hasExactlyOneCorrectChoice = (question) =>
  (question?.choices || []).filter((choice) => Boolean(choice?.is_correct) && (choice?.text || '').trim()).length === 1

const summarizeQuestionKinds = (questions = []) =>
  questions.reduce(
    (acc, question) => {
      const kind = detectQuestionKind(question)
      if (kind === QUESTION_KIND_TRUE_FALSE) acc.trueFalse += 1
      else if (kind === QUESTION_KIND_ABC) acc.abc += 1
      else acc.invalid += 1
      return acc
    },
    { trueFalse: 0, abc: 0, invalid: 0 }
  )

const getCorrectChoiceLabel = (question) => {
  const match = (question?.choices || []).find((choice) => choice?.is_correct)
  return (match?.text || '').trim() || '-'
}

export default function QuizEditor({ quiz, onSaved }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(quiz?.title || '')
  const [description, setDescription] = useState(quiz?.description || '')
  const [category, setCategory] = useState(quiz?.category || '')
  const [questions, setQuestions] = useState(quiz?.questions || [])
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null)
  const questionSummary = useMemo(() => summarizeQuestionKinds(questions), [questions])
  const withInvalidSuffix = questionSummary.invalid ? t('quizEditor.invalidSuffix', { count: questionSummary.invalid }) : ''

  function buildPayload() {
    const withOrder = questions.map((q, idx) => ({
      ...q,
      order: idx,
      choices: (q.choices || []).map((c) => ({ text: c.text, is_correct: !!c.is_correct })),
    }))
    return { title, description, category, strict_structure: true, questions: withOrder }
  }

  function validateBeforeSave() {
    if (!title.trim()) {
      alert(t('quizEditor.titleRequired'))
      return false
    }
    if (questions.length !== REQUIRED_TOTAL_QUESTIONS) {
      alert(t('quizEditor.totalRequired', { count: REQUIRED_TOTAL_QUESTIONS }))
      return false
    }
    if (questionSummary.invalid > 0) {
      alert(t('quizEditor.unsupportedType'))
      return false
    }
    if (questionSummary.trueFalse !== REQUIRED_TRUE_FALSE || questionSummary.abc !== REQUIRED_ABC) {
      alert(t('quizEditor.distributionRequired', { tf: REQUIRED_TRUE_FALSE, abc: REQUIRED_ABC }))
      return false
    }
    const invalidCorrectAnswerIndex = questions.findIndex((question) => !hasExactlyOneCorrectChoice(question))
    if (invalidCorrectAnswerIndex >= 0) {
      alert(t('quizEditor.oneCorrectRequired', { index: invalidCorrectAnswerIndex + 1 }))
      return false
    }
    return true
  }

  async function save() {
    if (!validateBeforeSave()) return

    const payload = buildPayload()

    try {
      if (quiz?.id) {
        await api.put(`/api/quizzes/${quiz.id}/`, payload)
      } else {
        await api.post('/api/quizzes/', payload)
      }
      onSaved?.()
    } catch {
      alert(t('messages.saveFailed'))
    }
  }

  function addQuestion(q) {
    if (questions.length >= REQUIRED_TOTAL_QUESTIONS) {
      alert(t('quizEditor.maxQuestionsReached', { count: REQUIRED_TOTAL_QUESTIONS }))
      return
    }
    const nextKind = detectQuestionKind(q)
    if (!nextKind) {
      alert(t('quizEditor.unsupportedType'))
      return
    }
    if (!hasExactlyOneCorrectChoice(q)) {
      alert(t('quizEditor.oneCorrectRequired', { index: questions.length + 1 }))
      return
    }
    const currentSummary = summarizeQuestionKinds(questions)
    if (nextKind === QUESTION_KIND_TRUE_FALSE && currentSummary.trueFalse >= REQUIRED_TRUE_FALSE) {
      alert(t('quizEditor.maxTrueFalseReached', { count: REQUIRED_TRUE_FALSE }))
      return
    }
    if (nextKind === QUESTION_KIND_ABC && currentSummary.abc >= REQUIRED_ABC) {
      alert(t('quizEditor.maxAbcReached', { count: REQUIRED_ABC }))
      return
    }
    setQuestions([...questions, q])
  }

  function updateQuestion(index, nextQuestion) {
    setQuestions((prev) => prev.map((q, idx) => (idx === index ? nextQuestion : q)))
    setEditingQuestionIndex(null)
  }

  function removeQuestion(index) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index))
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="light-tile rounded-3xl p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>{t('quizEditor.title')}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('quizEditor.titlePlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>{t('quizEditor.category')}</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('quizEditor.categoryPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span>{t('quizEditor.description')}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('quizEditor.descriptionPlaceholder')}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </label>

        <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm text-slate-700 dark:border-primary-300/40 dark:bg-slate-900/80 dark:text-slate-200">
          <p className="font-semibold text-slate-900 dark:text-white">{t('quizEditor.structureTitle')}</p>
          <p className="mt-1">
            {t('quizEditor.structureHint', {
              total: REQUIRED_TOTAL_QUESTIONS,
              tfRequired: REQUIRED_TRUE_FALSE,
              abcRequired: REQUIRED_ABC,
              tfCurrent: questionSummary.trueFalse,
              abcCurrent: questionSummary.abc,
              invalidSuffix: withInvalidSuffix,
            })}
          </p>
        </div>

        <div className="mt-4">
          <PrimaryButton type="button" onClick={save}>
            {t('quizEditor.saveQuiz')}
          </PrimaryButton>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-base font-semibold text-slate-900">{t('quizEditor.createdQuestions')}</p>
        {!questions.length && (
          <div className="light-tile rounded-2xl px-4 py-3 text-sm text-slate-600">
            {t('quizEditor.noQuestionsYet')}
          </div>
        )}
        {questions.map((q, idx) => {
          const kind = detectQuestionKind(q)
          const typeLabel =
            kind === QUESTION_KIND_TRUE_FALSE
              ? t('quizEditor.typeTrueFalse')
              : kind === QUESTION_KIND_ABC
              ? t('quizEditor.typeAbc')
              : t('quizEditor.typeInvalid')

          return (
            <div key={idx} className="light-tile rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-2xl text-base font-semibold text-slate-900">
                {idx + 1}. {q.text}
              </p>
                <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-300/55 dark:bg-primary-500/28 dark:text-primary-100">
                  {typeLabel}
                </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {t('quizEditor.timerSeconds', { seconds: q.timer_seconds })} | {t('quizEditor.correctAnswer')}:{' '}
                {getCorrectChoiceLabel(q)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SecondaryButton type="button" onClick={() => setEditingQuestionIndex(idx)}>
                {t('quizEditor.editQuestion')}
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => removeQuestion(idx)}>
                {t('quizEditor.removeQuestion')}
              </SecondaryButton>
            </div>
            {editingQuestionIndex === idx ? (
              <div className="mt-4">
                <QuestionForm
                  initial={q}
                  onSave={(nextQuestion) => updateQuestion(idx, nextQuestion)}
                  submitLabel={t('quizEditor.updateQuestion')}
                  onCancel={() => setEditingQuestionIndex(null)}
                />
              </div>
            ) : null}
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 dark:border-slate-500/50 dark:bg-slate-900/78">
        <p className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">{t('quizEditor.addQuestion')}</p>
        <QuestionForm key={`add-${questions.length}`} onSave={addQuestion} />
      </div>
    </div>
  )
}
