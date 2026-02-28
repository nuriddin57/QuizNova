import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const dummyDataPath = path.join(repoRoot, 'frontend', 'src', 'utils', 'dummyData.js')
const localePaths = {
  en: path.join(repoRoot, 'frontend', 'src', 'locales', 'en', 'translation.json'),
  uz: path.join(repoRoot, 'frontend', 'src', 'locales', 'uz', 'translation.json'),
  ru: path.join(repoRoot, 'frontend', 'src', 'locales', 'ru', 'translation.json'),
}

const manualByLocale = {
  en: {
    'data.landing.featureTiles.live.title': 'Live game sessions',
    'data.landing.featureTiles.live.body': 'Launch live classroom battles with instant feedback.',
    'data.landing.featureTiles.accuracy.title': 'Accuracy training',
    'data.landing.featureTiles.accuracy.body': 'Track mastery and improve weak topics quickly.',
    'data.landing.featureTiles.rewards.title': 'Rewards and streaks',
    'data.landing.featureTiles.rewards.body': 'Keep learners engaged with badges and rewards.',
    'data.landing.socialProof.classesLabel': 'Active classes',
    'data.landing.socialProof.classesDetail': 'Teachers running weekly sessions',
    'data.landing.socialProof.weeklyLabel': 'Weekly answers',
    'data.landing.socialProof.weeklyDetail': 'Submitted in live and homework modes',
    'data.landing.socialProof.accuracyLabel': 'Mastery gain',
    'data.landing.socialProof.accuracyDetail': 'Average score improvement',
    'data.landing.socialProof.savedLabel': 'Saved sets',
    'data.landing.socialProof.savedDetail': 'Ready-to-host quiz collections',
    'setCard.openSet': 'Open set',
    'setCard.defaultSubject': 'General',
    'setCard.defaultCreator': 'Community',
    'landing.discord': 'Discord',
    'landing.youtube': 'YouTube',
    'landing.privacy': 'Privacy',
    'landing.terms': 'Terms',
    'landing.support': 'Support',
  },
  uz: {
    'data.landing.featureTiles.live.title': "Jonli o'yin sessiyalari",
    'data.landing.featureTiles.live.body': "Sinf bilan real vaqtda o'yin o'tkazing va natijani darhol ko'ring.",
    'data.landing.featureTiles.accuracy.title': 'Aniqlik mashqi',
    'data.landing.featureTiles.accuracy.body': "Mavzular bo'yicha o'zlashtirishni kuzating va tez yaxshilang.",
    'data.landing.featureTiles.rewards.title': 'Mukofot va ketma-ketlik',
    'data.landing.featureTiles.rewards.body': "Badge va mukofotlar bilan o'quvchilarni motivatsiya qiling.",
    'data.landing.socialProof.classesLabel': 'Faol sinflar',
    'data.landing.socialProof.classesDetail': "Haftalik sessiya o'tkazayotgan o'qituvchilar",
    'data.landing.socialProof.weeklyLabel': 'Haftalik javoblar',
    'data.landing.socialProof.weeklyDetail': 'Jonli va uyga vazifa rejimlarida yuborilgan',
    'data.landing.socialProof.accuracyLabel': "O'zlashtirish o'sishi",
    'data.landing.socialProof.accuracyDetail': "O'rtacha natija oshishi",
    'data.landing.socialProof.savedLabel': 'Saqlangan toplamlar',
    'data.landing.socialProof.savedDetail': 'Darhol host qilishga tayyor quizlar',
    'setCard.openSet': "Toplamni ochish",
    'setCard.defaultSubject': 'Umumiy',
    'setCard.defaultCreator': 'Hamjamiyat',
    'landing.discord': 'Discord',
    'landing.youtube': 'YouTube',
    'landing.privacy': 'Maxfiylik',
    'landing.terms': 'Shartlar',
    'landing.support': "Qo'llab-quvvatlash",
  },
  ru: {
    'data.landing.featureTiles.live.title': 'Живые игровые сессии',
    'data.landing.featureTiles.live.body': 'Запускайте live-игры в классе с мгновенной обратной связью.',
    'data.landing.featureTiles.accuracy.title': 'Тренировка точности',
    'data.landing.featureTiles.accuracy.body': 'Отслеживайте освоение тем и быстро закрывайте пробелы.',
    'data.landing.featureTiles.rewards.title': 'Награды и серии',
    'data.landing.featureTiles.rewards.body': 'Удерживайте интерес с бейджами и наградами.',
    'data.landing.socialProof.classesLabel': 'Активные классы',
    'data.landing.socialProof.classesDetail': 'Учителя, проводящие еженедельные сессии',
    'data.landing.socialProof.weeklyLabel': 'Ответов за неделю',
    'data.landing.socialProof.weeklyDetail': 'Отправлено в live и домашнем режимах',
    'data.landing.socialProof.accuracyLabel': 'Рост освоения',
    'data.landing.socialProof.accuracyDetail': 'Среднее улучшение результатов',
    'data.landing.socialProof.savedLabel': 'Сохранённые наборы',
    'data.landing.socialProof.savedDetail': 'Коллекции квизов, готовые к запуску',
    'setCard.openSet': 'Открыть набор',
    'setCard.defaultSubject': 'Общее',
    'setCard.defaultCreator': 'Сообщество',
    'landing.discord': 'Discord',
    'landing.youtube': 'YouTube',
    'landing.privacy': 'Конфиденциальность',
    'landing.terms': 'Условия',
    'landing.support': 'Поддержка',
  },
}

const genericTail = new Set(['title', 'desc', 'body', 'label', 'badge', 'detail', 'time', 'name', 'role', 'school', 'quote', 'cta'])

const toHuman = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\d+)([A-Za-z]+)/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const toSentence = (value) => {
  const text = toHuman(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const autoValueFromKey = (fullKey) => {
  const parts = fullKey.split('.')
  const last = parts.at(-1) || ''
  if (/^[abq]\d+$/i.test(last)) {
    const prev = parts.at(-2) || 'item'
    return toSentence(`${prev} ${last.toUpperCase()}`)
  }
  if (genericTail.has(last)) {
    const prev = parts.at(-2) || 'item'
    return toSentence(`${prev} ${last}`)
  }
  return toSentence(last)
}

const getAtPath = (obj, pathParts) => {
  let current = obj
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || !(part in current)) return undefined
    current = current[part]
  }
  return current
}

const setAtPath = (obj, pathParts, value) => {
  let current = obj
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    const key = pathParts[i]
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {}
    }
    current = current[key]
  }
  current[pathParts[pathParts.length - 1]] = value
}

const dummyDataSource = fs.readFileSync(dummyDataPath, 'utf8')
const dataKeys = [...new Set([...dummyDataSource.matchAll(/data\.[A-Za-z0-9_.]+/g)].map((match) => match[0]))].sort()

for (const [locale, filePath] of Object.entries(localePaths)) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const json = JSON.parse(raw)
  const manual = manualByLocale[locale] || {}

  for (const key of dataKeys) {
    const pathParts = key.split('.')
    const currentValue = getAtPath(json, pathParts)
    if (typeof currentValue === 'string' && currentValue.trim()) continue
    const nextValue = manual[key] || autoValueFromKey(key)
    setAtPath(json, pathParts, nextValue)
  }

  for (const [manualKey, manualValue] of Object.entries(manual)) {
    setAtPath(json, manualKey.split('.'), manualValue)
  }

  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
}

console.log(`Added/verified ${dataKeys.length} data translation keys in en/uz/ru.`)
