import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Pagination({page, totalPages, onChange}){
  const { t } = useTranslation()
  const prev = ()=> onChange(Math.max(1, page-1))
  const next = ()=> onChange(Math.min(totalPages, page+1))
  return (
    <div className="pagination">
      <button className="btn-ghost" onClick={prev} disabled={page<=1}>{t('pagination.prev')}</button>
      <div className="small muted">{t('pagination.pageStatus', { page, total: totalPages })}</div>
      <button className="btn-ghost" onClick={next} disabled={page>=totalPages}>{t('pagination.next')}</button>
    </div>
  )
}
