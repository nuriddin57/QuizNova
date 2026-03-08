import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { bulkImportQuestionBank } from '../api/questionBank'
import { listModules, listSubjects, listTopics } from '../api/subjects'
import BulkImportForm from '../components/BulkImportForm'
import Card from '../components/Card'
import SectionWrapper from '../components/SectionWrapper'

const BulkImportQuestionsPage = () => {
  const { t } = useTranslation()
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [modules, setModules] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listSubjects({ is_active: true }).then(setSubjects).catch(() => setSubjects([]))
    listTopics().then(setTopics).catch(() => setTopics([]))
    listModules().then(setModules).catch(() => setModules([]))
  }, [])

  const onSubmit = async (payload) => {
    setLoading(true)
    try {
      const result = await bulkImportQuestionBank(payload)
      setSummary(result)
      toast.success(payload.preview ? t('academy.previewGenerated') : t('academy.importCompleted'))
    } catch {
      // global handler
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('academy.bulkImportQuestions')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('academy.bulkImportDescription')}</p>
        </Card>
        <BulkImportForm subjects={subjects} topics={topics} modules={modules} loading={loading} onSubmit={onSubmit} />
        {summary ? (
          <Card className="rounded-[34px] bg-white/95 p-6">
            <h2 className="text-2xl font-semibold text-slate-900">{t('academy.importSummary')}</h2>
            <p className="mt-3 text-sm text-slate-600">
              {t('academy.rows')}: {summary.rows_received} | {t('academy.valid')}: {summary.valid_rows} | {t('academy.created')}: {summary.created_count}
            </p>
            <div className="mt-4 space-y-2">
              {(summary.failed_rows || []).map((item) => (
                <div key={item.row} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {t('academy.row')} {item.row}: {JSON.stringify(item.errors)}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </SectionWrapper>
  )
}

export default BulkImportQuestionsPage
