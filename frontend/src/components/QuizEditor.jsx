import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import QuestionForm from './QuestionForm'

export default function QuizEditor({ quiz, onSaved }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(quiz?.title || '')
  const [description, setDescription] = useState(quiz?.description || '')
  const [category, setCategory] = useState(quiz?.category || '')
  const [questions, setQuestions] = useState(quiz?.questions || [])
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null)

  function buildPayload() {
    const withOrder = questions.map((q, idx) => ({
      ...q,
      order: idx,
      choices: (q.choices || []).map((c) => ({ text: c.text, is_correct: !!c.is_correct })),
    }))
    return { title, description, category, questions: withOrder }
  }

  async function save() {
    const payload = buildPayload()

    try {
      if (quiz?.id) {
        await api.put(`/api/quizzes/${quiz.id}/`, payload)
      } else {
        await api.post('/api/quizzes/', payload)
      }
      onSaved?.()
    } catch (err) {
      alert(t('messages.saveFailed'))
    }
  }

  function addQuestion(q) {
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
    <div>
      <div className="card">
        <div className="row">
          <div className="col">
            <label className="small muted">{t('quizEditor.title')}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('quizEditor.titlePlaceholder')} />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="small muted">{t('quizEditor.description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('quizEditor.descriptionPlaceholder')} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="small muted">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Math, Science, History..." />
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={save}>{t('quizEditor.saveQuiz')}</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 className="small muted">{t('quizEditor.questions')}</h4>
        {questions.map((q, idx) => (
          <div key={idx} className="card" style={{ marginTop: 8 }}>
            <div className="flex space">
              <div>{q.text}</div>
              <div className="small muted">{t('quizEditor.timerSeconds', { seconds: q.timer_seconds })}</div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingQuestionIndex(idx)}>Edit question</button>
              <button onClick={() => removeQuestion(idx)}>Remove</button>
            </div>
            {editingQuestionIndex === idx ? (
              <div style={{ marginTop: 10 }}>
                <QuestionForm
                  initial={q}
                  onSave={(nextQuestion) => updateQuestion(idx, nextQuestion)}
                  submitLabel="Update question"
                  onCancel={() => setEditingQuestionIndex(null)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>{t('quizEditor.addQuestion')}</h4>
        <QuestionForm key={`add-${questions.length}`} onSave={addQuestion} />
      </div>
    </div>
  )
}
