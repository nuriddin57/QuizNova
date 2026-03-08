import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'

const TIMER_UNIT_SECONDS = 'seconds'
const TIMER_UNIT_MINUTES = 'minutes'
const TIMER_UNIT_HOURS = 'hours'
const MIN_OPTIONS = 2
const DEFAULT_OPTIONS_COUNT = 4
const MAX_OPTIONS = 6
const TRUE_FALSE_KEYS = ['questionForm.optionTrue', 'questionForm.optionFalse']
const ABC_OPTIONS = ['A', 'B', 'C']

const TIMER_FACTORS = {
  [TIMER_UNIT_SECONDS]: 1,
  [TIMER_UNIT_MINUTES]: 60,
  [TIMER_UNIT_HOURS]: 3600,
}

const OPTION_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const normalizeOptionText = (value = '') => value.trim().toLowerCase()

const toOptionLabel = (index) => OPTION_LABELS[index] || String(index + 1)

const clampCorrectIndex = (index, optionsLength) => {
  if (!optionsLength) return 0
  const numericIndex = Number(index)
  if (!Number.isInteger(numericIndex)) return 0
  return Math.min(Math.max(0, numericIndex), optionsLength - 1)
}

const sanitizeInitialOptions = (choices = []) => {
  const options = choices
    .map((choice) => String(choice?.text || '').trim())
    .filter(Boolean)
    .slice(0, MAX_OPTIONS)

  if (options.length >= MIN_OPTIONS) return options

  return Array.from({ length: DEFAULT_OPTIONS_COUNT }, () => '')
}

const getInitialCorrectIndex = (choices = [], optionsLength) =>
  clampCorrectIndex(
    choices.findIndex((choice) => Boolean(choice?.is_correct)),
    optionsLength
  )

const pickTimerUnit = (timerSeconds) => {
  const normalized = Number(timerSeconds) || 20
  if (normalized >= 3600 && normalized % 3600 === 0) return TIMER_UNIT_HOURS
  if (normalized >= 60 && normalized % 60 === 0) return TIMER_UNIT_MINUTES
  return TIMER_UNIT_SECONDS
}

const timerToDisplay = (timerSeconds) => {
  const unit = pickTimerUnit(timerSeconds)
  return {
    value: Math.max(1, Number(timerSeconds) / TIMER_FACTORS[unit]),
    unit,
  }
}

const timerToSeconds = (value, unit) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.round(numeric * (TIMER_FACTORS[unit] || 1))
}

export default function QuestionForm({ onSave, initial, submitLabel, onCancel }) {
  const { t } = useTranslation()

  const initialValues = useMemo(() => {
    const options = sanitizeInitialOptions(initial?.choices || [])
    const timerDisplay = timerToDisplay(initial?.timer_seconds || 20)

    return {
      text: initial?.text || '',
      timer: timerDisplay.value,
      timerUnit: timerDisplay.unit,
      options,
      correctIndex: getInitialCorrectIndex(initial?.choices || [], options.length),
    }
  }, [initial])

  const [text, setText] = useState(initialValues.text)
  const [timer, setTimer] = useState(initialValues.timer)
  const [timerUnit, setTimerUnit] = useState(initialValues.timerUnit)
  const [options, setOptions] = useState(initialValues.options)
  const [correctIndex, setCorrectIndex] = useState(initialValues.correctIndex)
  const isTrueFalseMode =
    options.length === 2 &&
    new Set(options.map((option) => normalizeOptionText(option))).size === 2 &&
    options.every((option) => ['true', 'false'].includes(normalizeOptionText(option)))

  useEffect(() => {
    setText(initialValues.text)
    setTimer(initialValues.timer)
    setTimerUnit(initialValues.timerUnit)
    setOptions(initialValues.options)
    setCorrectIndex(initialValues.correctIndex)
  }, [initialValues])

  useEffect(() => {
    setCorrectIndex((prev) => clampCorrectIndex(prev, options.length))
  }, [options.length])

  function validate() {
    if (!text.trim()) return t('questionForm.questionRequired')
    if (timerToSeconds(timer, timerUnit) < 5) return t('questionForm.timerRequired')
    if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
      return t('questionForm.optionsRangeRequired', { min: MIN_OPTIONS, max: MAX_OPTIONS })
    }
    if (options.some((option) => !option.trim())) {
      return t('questionForm.optionRequired')
    }
    return null
  }

  function submit() {
    const err = validate()
    if (err) {
      alert(err)
      return
    }

    onSave({
      text: text.trim(),
      timer_seconds: timerToSeconds(timer, timerUnit),
      choices: options.map((option, index) => ({
        text: option.trim(),
        is_correct: index === correctIndex,
      })),
    })
  }

  const handleOptionChange = (index, nextValue) => {
    setOptions((prev) => prev.map((option, optionIndex) => (optionIndex === index ? nextValue : option)))
  }

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return
    setOptions((prev) => [...prev, ''])
  }

  const applyPreset = (nextOptions) => {
    setOptions(nextOptions)
    setCorrectIndex(0)
  }

  const removeOption = (index) => {
    if (options.length <= MIN_OPTIONS) return
    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index)
    setOptions(nextOptions)
    setCorrectIndex((prev) => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return clampCorrectIndex(prev, nextOptions.length)
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr,170px]">
        <label className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span>{t('questionForm.question')}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('questionForm.questionPlaceholder')}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </label>

        <label className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span>{t('questionForm.timer')}</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={timerUnit === TIMER_UNIT_SECONDS ? 5 : 1}
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
            <select
              value={timerUnit}
              onChange={(e) => setTimerUnit(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value={TIMER_UNIT_SECONDS}>{t('questionForm.unitSeconds')}</option>
              <option value={TIMER_UNIT_MINUTES}>{t('questionForm.unitMinutes')}</option>
              <option value={TIMER_UNIT_HOURS}>{t('questionForm.unitHours')}</option>
            </select>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset(TRUE_FALSE_KEYS.map((key) => t(key)))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary-300"
          >
            {t('questionForm.typeTrueFalse')}
          </button>
          <button
            type="button"
            onClick={() => applyPreset(ABC_OPTIONS)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary-300"
          >
            {t('questionForm.typeAbc')}
          </button>
        </div>
        {!isTrueFalseMode ? (
          <>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('questionForm.answerOptions')}
            </p>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={`option-${index}`} className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                    {toOptionLabel(index)}
                  </span>
                  <input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={t('questionForm.optionPlaceholder', {
                      index: index + 1,
                    })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= MIN_OPTIONS}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      options.length <= MIN_OPTIONS
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
                    }`}
                  >
                    {t('questionForm.removeOption')}
                  </button>
                </div>
              ))}
            </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= MAX_OPTIONS}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                options.length >= MAX_OPTIONS
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
              }`}
            >
              {t('questionForm.addOption')}
            </button>
            <p className="text-xs text-slate-500">
              {t('questionForm.optionsRangeHint', { min: MIN_OPTIONS, max: MAX_OPTIONS })}
            </p>
          </div>
          </>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('questionForm.correctAnswer')}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((option, index) => {
            const active = correctIndex === index
            const optionText = option.trim() || t('questionForm.optionPlaceholder', { index: index + 1 })
            return (
              <button
                key={`correct-${index}`}
                type="button"
                onClick={() => setCorrectIndex(index)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
                }`}
              >
                <span>{toOptionLabel(index)}</span>
                <span>{optionText}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={submit}>
          {submitLabel || t('questionForm.saveQuestion')}
        </PrimaryButton>
        {onCancel ? (
          <SecondaryButton type="button" onClick={onCancel}>
            {t('common.cancel')}
          </SecondaryButton>
        ) : null}
      </div>
    </div>
  )
}
