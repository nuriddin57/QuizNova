import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const MIN_CHOICES = 4

const normalizeChoices = (rawChoices = []) => {
  const mapped = rawChoices.map((choice) => ({
    text: choice?.text || '',
    is_correct: Boolean(choice?.is_correct),
  }))
  while (mapped.length < MIN_CHOICES) {
    mapped.push({ text: '', is_correct: false })
  }
  return mapped
}

export default function QuestionForm({ onSave, initial, submitLabel, onCancel }) {
  const { t } = useTranslation()
  const initialValues = useMemo(
    () => ({
      text: initial?.text || '',
      timer: initial?.timer_seconds || 20,
      choices: normalizeChoices(initial?.choices || []),
    }),
    [initial]
  )

  const [text, setText] = useState(initialValues.text)
  const [timer, setTimer] = useState(initialValues.timer)
  const [choices, setChoices] = useState(initialValues.choices)

  useEffect(() => {
    setText(initialValues.text)
    setTimer(initialValues.timer)
    setChoices(initialValues.choices)
  }, [initialValues])

  function setChoice(i, key, val) {
    const newC = [...choices]
    newC[i][key] = val
    setChoices(newC)
  }

  function validate() {
    if (!text.trim()) return t('questionForm.questionRequired')
    const filled = choices.filter((c) => c.text.trim())
    if (filled.length < 2) return t('questionForm.twoChoicesRequired')
    if (!choices.some((c) => c.is_correct && c.text.trim())) return t('questionForm.selectCorrectChoice')
    return null
  }

  function submit() {
    const err = validate()
    if (err) {
      alert(err)
      return
    }
    const cleanedChoices = choices
      .map((c) => ({ text: c.text.trim(), is_correct: c.is_correct }))
      .filter((c) => c.text)

    onSave({
      text: text.trim(),
      timer_seconds: Number(timer),
      choices: cleanedChoices,
    })
  }

  return (
    <div className="card">
      <div className="form-row">
        <div className="col">
          <label className="small muted">{t('questionForm.question')}</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('questionForm.questionPlaceholder')} />
        </div>
        <div style={{ width: 160 }}>
          <label className="small muted">{t('questionForm.timerSec')}</label>
          <input type="number" min={5} value={timer} onChange={(e) => setTimer(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {choices.map((c, i) => (
          <div key={i} className="row" style={{ marginBottom: 8 }}>
            <input value={c.text} onChange={(e) => setChoice(i, 'text', e.target.value)} placeholder={t('questionForm.choiceN', { n: i + 1 })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="radio" name="correct" checked={c.is_correct} onChange={() => setChoices(choices.map((x, idx) => ({ ...x, is_correct: idx === i })))} /> {t('questionForm.correct')}
            </label>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={submit}>{submitLabel || t('questionForm.saveQuestion')}</button>
        {onCancel ? <button onClick={onCancel}>{t('common.cancel')}</button> : null}
      </div>
    </div>
  )
}
