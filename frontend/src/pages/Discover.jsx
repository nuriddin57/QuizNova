import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { HiMagnifyingGlass, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2'
import SectionWrapper from '../components/SectionWrapper'
import Card from '../components/Card'
import Chip from '../components/Chip'
import Dropdown from '../components/Dropdown'
import SetCard from '../components/SetCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { cn } from '../utils/cn'
import { discoverSets, setFilters, featuredCollections, discoverCategories } from '../utils/dummyData'
import { toastHelpers } from '../utils/toastHelpers'
import { getSets } from '../api/axios'

const sortOptions = ['Popular', 'Newest', 'Rated'] // sort values remain stable
const perPage = 6
const collectionSubjectsMap = {
  'col-1': ['Science', 'Math', 'Coding'],
  'col-2': ['Science', 'History'],
  'col-3': ['SEL'],
}
const categoryAliases = {
  Engineering: ['Coding'],
  Robotics: ['Coding'],
  Geography: ['History'],
  Civics: ['History'],
  'Art & Music': ['Art', 'Music'],
}
const categoryKeywords = {
  Trivia: 'trivia',
}

const resolveText = (t, key, fallback = '') => (key ? t(key) : fallback)

const Discover = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('Popular')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contextSubjects, setContextSubjects] = useState([])
  const [contextKeyword, setContextKeyword] = useState('')
  const [activeCategoryItem, setActiveCategoryItem] = useState('')
  const [activeCollectionId, setActiveCollectionId] = useState('')

  const clearContextFilters = () => {
    setContextSubjects([])
    setContextKeyword('')
    setActiveCategoryItem('')
    setActiveCollectionId('')
  }

  const applyTopFilter = (filter) => {
    setActiveFilter(filter)
    clearContextFilters()
  }

  const filterValues = setFilters.map((filter) => filter.value)

  const handleCategoryClick = (item) => {
    const itemValue = item?.value || item
    const subjects = filterValues.includes(itemValue) ? [itemValue] : categoryAliases[itemValue] || []
    setActiveFilter('All')
    setContextSubjects(subjects)
    setContextKeyword(categoryKeywords[itemValue] || '')
    setActiveCategoryItem(itemValue)
    setActiveCollectionId('')
  }

  const handleCollectionClick = (collection) => {
    setActiveFilter('All')
    setContextSubjects(collectionSubjectsMap[collection.id] || [])
    setContextKeyword('')
    setActiveCollectionId(collection.id)
    setActiveCategoryItem('')
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await getSets()
      if (mounted) {
        if (data.results?.length) {
          setSets(data.results)
        } else if (data.fallback) {
          setSets(discoverSets)
        } else {
          setSets([])
        }
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [activeFilter, contextKeyword, contextSubjects, searchTerm, sortOption])

  const filteredSets = useMemo(() => {
    const getSetTitle = (set) => resolveText(t, set.titleKey, set.title || '')
    const byFilter = sets.filter((set) => {
      const setSubject = set.subject || set.category || 'General'
      const topFilterMatch = activeFilter === 'All' || setSubject === activeFilter
      const contextSubjectMatch = !contextSubjects.length || contextSubjects.includes(setSubject)
      const contextText = `${getSetTitle(set)} ${setSubject || ''}`.toLowerCase()
      const contextKeywordMatch = !contextKeyword || contextText.includes(contextKeyword.toLowerCase())
      return topFilterMatch && contextSubjectMatch && contextKeywordMatch
    })
    const bySearch = byFilter.filter((set) => getSetTitle(set).toLowerCase().includes(searchTerm.toLowerCase()))

    const sorted = [...bySearch].sort((a, b) => {
      if (sortOption === 'Newest') {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      }
      if (sortOption === 'Rated') {
        return (b.rating || 0) - (a.rating || 0)
      }
      const parsePlays = (value) => {
        if (typeof value === 'number') return value
        if (!value) return 0
        return value.toLowerCase().includes('k') ? parseFloat(value) * 1000 : parseFloat(value)
      }
      return parsePlays(b.plays) - parsePlays(a.plays)
    })

    return sorted
  }, [activeFilter, contextKeyword, contextSubjects, searchTerm, sets, sortOption, t])

  const totalPages = Math.max(1, Math.ceil(filteredSets.length / perPage))
  const paginated = filteredSets.slice((page - 1) * perPage, page * perPage)

  const handleSaveSet = (title) => () => toastHelpers.success(t('setCard.savedToLibrary', { title }))
  const handleHostSetLocalized = (set) => () => {
    toastHelpers.info(t('setCard.hostingShareCode', { title: resolveText(t, set.titleKey, set.title) }))
    navigate(`/host?set=${set.id}&mode=rocket-rush`)
  }
  const handleOpenSet = (set) => () => navigate(`/sets/${set.id}`)
  const sortLabels = { Popular: t('discoverPage.sortPopular'), Newest: t('discoverPage.sortNewest'), Rated: t('discoverPage.sortRated') }

  return (
    <SectionWrapper id="discover" className="pt-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <Card className="rounded-[36px] bg-white/95">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-display font-semibold text-slate-900">{t('discoverPage.title')}</h2>
              <p className="text-sm text-slate-500">{t('discoverPage.subtitle')}</p>
            </div>
            <div className="relative w-full max-w-sm">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-primary-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('discoverPage.searchPlaceholder')}
                className="w-full rounded-2xl border border-transparent bg-surface-soft px-5 py-3 pl-12 text-sm font-semibold text-slate-700 focus:border-primary-200 focus:outline-none focus:ring-4 focus:ring-primary-100"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {setFilters.map((filter) => (
              <Chip
                key={filter.value}
                label={resolveText(t, filter.labelKey, filter.value)}
                active={activeFilter === filter.value && !activeCategoryItem && !activeCollectionId}
                onClick={() => applyTopFilter(filter.value)}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Dropdown label={t('discoverPage.sort')} value={sortOption} options={sortOptions} onChange={setSortOption} className="sm:max-w-xs" renderLabel={(value) => sortLabels[value] || value} />
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl border border-surface-soft px-4 py-2 text-sm font-semibold text-slate-600 lg:hidden"
            >
              <HiOutlineAdjustmentsHorizontal />
              {sidebarOpen ? t('discoverPage.hideCategories') : t('discoverPage.showCategories')}
            </button>
          </div>
          {(activeCategoryItem || activeCollectionId) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeCategoryItem ? (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                  {resolveText(
                    t,
                    discoverCategories
                      .flatMap((category) => category.items || [])
                      .find((item) => item.value === activeCategoryItem)?.labelKey,
                    activeCategoryItem
                  )}
                </span>
              ) : null}
              {activeCollectionId ? (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                  {resolveText(
                    t,
                    featuredCollections.find((collection) => collection.id === activeCollectionId)?.titleKey,
                    activeCollectionId
                  )}
                </span>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-surface-soft px-3 py-1 text-xs font-semibold text-slate-600"
                onClick={clearContextFilters}
              >
                {t('discoverPage.resetFilters')}
              </button>
            </div>
          )}
        </Card>

        <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
          <aside className={cn('rounded-[32px] bg-white/95 p-6 shadow-card', sidebarOpen ? 'block' : 'hidden lg:block')}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('discoverPage.categories')}</p>
            <div className="mt-4 space-y-5 text-sm text-slate-600">
              {discoverCategories.map((category) => (
                <div key={category.id}>
                  <p className="text-base font-semibold text-slate-900">{resolveText(t, category.titleKey, category.title)}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {category.items.map((item) => (
                      <li key={item.value || item}>
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(item)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition',
                            activeCategoryItem === (item.value || item) ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-surface-soft'
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', activeCategoryItem === (item.value || item) ? 'bg-primary-500' : 'bg-primary-400')} />
                          {resolveText(t, item.labelKey, item.value || item)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-8">
            <div className="overflow-x-auto rounded-[32px] bg-white/95 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-400">{t('discoverPage.featuredCollections')}</p>
                  <h3 className="text-2xl font-display font-semibold text-slate-900">{t('discoverPage.curatedRows')}</h3>
                </div>
                <span className="text-sm font-semibold text-slate-500">{t('discoverPage.swipeToExplore')}</span>
              </div>
              <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {featuredCollections.map((collection) => (
                  <div key={collection.id} className="min-w-[220px] snap-start">
                    <button
                      type="button"
                      onClick={() => handleCollectionClick(collection)}
                      className={cn(
                        `w-full rounded-[28px] bg-gradient-to-br ${collection.gradient} p-5 text-left text-white shadow-card transition`,
                        activeCollectionId === collection.id ? 'ring-4 ring-primary-300/70' : 'hover:-translate-y-0.5'
                      )}
                      >
                        <p className="text-sm uppercase tracking-[0.3em] text-white/70">{t('discoverPage.collection')}</p>
                      <p className="mt-2 text-xl font-display font-semibold">{resolveText(t, collection.titleKey, collection.title)}</p>
                      <p className="text-sm text-white/80">{collection.sets} {t('discoverPage.setsSuffix')}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => <LoadingSkeleton key={idx} className="h-64 rounded-[32px] bg-white" />)
                : paginated.length > 0
                ? paginated.map((set) => (
                    <SetCard
                      key={set.id}
                      {...set}
                      onOpen={handleOpenSet(set)}
                      onSave={handleSaveSet(resolveText(t, set.titleKey, set.title))}
                      onHost={handleHostSetLocalized(set)}
                    />
                  ))
                : (
                    <Card className="col-span-full text-center">
                      <p className="text-lg font-semibold text-slate-900">{t('discoverPage.noSetsTitle')}</p>
                      <p className="text-sm text-slate-500">{t('discoverPage.noSetsDesc')}</p>
                      <button
                        type="button"
                        className="mt-4 rounded-2xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
                        onClick={() => {
                          setActiveFilter('All')
                          setSearchTerm('')
                          clearContextFilters()
                        }}
                      >
                        {t('discoverPage.resetFilters')}
                      </button>
                    </Card>
                  )}
            </div>

            {!loading && paginated.length > 0 && (
              <div className="flex flex-col gap-4 rounded-[32px] bg-white/95 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  {t('discoverPage.showing', { from: (page - 1) * perPage + 1, to: Math.min(page * perPage, filteredSets.length), total: filteredSets.length })}
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-2xl border border-surface-soft px-4 py-2 disabled:opacity-40"
                  >
                    {t('discoverPage.prev')}
                  </button>
                  <span>
                    {t('discoverPage.pageOf', { page, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="rounded-2xl border border-surface-soft px-4 py-2 disabled:opacity-40"
                  >
                    {t('discoverPage.next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

export default Discover
