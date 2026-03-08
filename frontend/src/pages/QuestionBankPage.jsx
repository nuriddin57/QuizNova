import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { addQuestionBankEntriesToQuiz, listMyQuizzes } from '../api/quizzes'
import {
  createQuestionBankEntry,
  deleteQuestionBankEntry,
  duplicateQuestionBankEntry,
  listQuestionBank,
} from '../api/questionBank'
import { listSubjects, listTopics } from '../api/subjects'
import AddQuestionForm from '../components/AddQuestionForm'
import Card from '../components/Card'
import PrimaryButton from '../components/PrimaryButton'
import QuestionBankTable from '../components/QuestionBankTable'
import SectionWrapper from '../components/SectionWrapper'

const QuestionBankPage = () => {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [quizzes, setQuizzes] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  const load = async () => {
    try {
      const [entryData, subjectData, quizData] = await Promise.all([
        listQuestionBank(),
        listSubjects({ is_active: true }),
        listMyQuizzes(),
      ])
      setRows(entryData)
      setSubjects(subjectData)
      setQuizzes(quizData)
    } catch {
      setRows([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const subjectId = subjects.find((subject) => subject.id === Number(selectedQuizId))?.id
    if (!subjectId) return
    listTopics({ subject_id: subjectId }).then(setTopics).catch(() => setTopics([]))
  }, [selectedQuizId, subjects])

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds])

  const onCreate = async (payload) => {
    try {
      await createQuestionBankEntry(payload)
      toast.success(t('academy.questionSaved'))
      await load()
    } catch {
      // global handler
    }
  }

  const onToggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const onDuplicate = async (row) => {
    try {
      await duplicateQuestionBankEntry(row.id)
      toast.success(t('academy.questionDuplicated'))
      await load()
    } catch {
      // global handler
    }
  }

  const onDelete = async (row) => {
    try {
      await deleteQuestionBankEntry(row.id)
      toast.success(t('academy.questionDeleted'))
      await load()
    } catch {
      // global handler
    }
  }

  const addToQuiz = async () => {
    if (!selectedQuizId || !selectedIds.length) {
      toast.error(t('academy.selectQuizAndQuestion'))
      return
    }
    try {
      await addQuestionBankEntriesToQuiz(selectedQuizId, selectedIds)
      toast.success(t('academy.questionsAddedToQuiz'))
      setSelectedIds([])
    } catch {
      // global handler
    }
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('academy.questionBank')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('academy.questionBankDescription')}</p>
        </Card>
        <AddQuestionForm onSubmit={onCreate} />
        <Card className="rounded-[34px] bg-white/95 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <select value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-2.5">
              <option value="">{t('academy.selectQuizToAppend')}</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
            <PrimaryButton type="button" onClick={addToQuiz}>{t('academy.addSelectedToQuiz', { count: selectedCount })}</PrimaryButton>
          </div>
          <div className="mt-4">
            <QuestionBankTable rows={rows} selectedIds={selectedIds} onToggle={onToggle} onDuplicate={onDuplicate} onDelete={onDelete} />
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default QuestionBankPage
