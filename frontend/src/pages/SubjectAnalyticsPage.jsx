import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getQuestionAccuracy, getSubjectSummary, getTopicPerformance } from '../api/analytics'
import Card from '../components/Card'
import SectionWrapper from '../components/SectionWrapper'
import SubjectPerformanceCard from '../components/SubjectPerformanceCard'

const SubjectAnalyticsPage = () => {
  const { t } = useTranslation()
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    Promise.all([getSubjectSummary(), getTopicPerformance(), getQuestionAccuracy()])
      .then(([subjectData, topicData, questionData]) => {
        setSubjects(subjectData)
        setTopics(topicData)
        setQuestions(questionData)
      })
      .catch(() => {
        setSubjects([])
        setTopics([])
        setQuestions([])
      })
  }, [])

  return (
    <SectionWrapper className="pt-4" disableMotion>
      <div className="space-y-6">
        <Card className="rounded-[34px] bg-white/95 p-6">
          <h1 className="text-3xl font-display font-bold text-slate-900">{t('academy.subjectAnalytics')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('academy.subjectAnalyticsDescription')}</p>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((item) => <SubjectPerformanceCard key={`${item.subject_id}-${item.subject_name}`} item={item} />)}
        </div>
        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.topicPerformance')}</h2>
          <div className="mt-4 space-y-2">
            {topics.map((item) => (
              <div key={`${item.topic_id}-${item.topic_name}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {item.unit_name ? `${item.unit_name} · ` : ''}{item.topic_name} | {t('academy.attempts')}: {item.attempts} | {t('academy.average')}: {Number(item.average_score || 0).toFixed(1)}
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-[34px] bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-slate-900">{t('academy.questionAccuracy')}</h2>
          <div className="mt-4 space-y-2">
            {questions.slice(0, 20).map((item) => (
              <div key={item.question_id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {item.question_text} | {t('academy.accuracy')}: {Number(item.accuracy_rate || 0).toFixed(1)}% | {t('academy.attempts')}: {item.total_attempts}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SectionWrapper>
  )
}

export default SubjectAnalyticsPage
