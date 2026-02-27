const cardGradients = [
  'from-[#7BD8FF] via-[#6C9CFF] to-[#5B6CFF]',
  'from-[#FFB347] via-[#FF889A] to-[#FF6B9C]',
  'from-[#7BF6D9] via-[#45E0FF] to-[#5B6CFF]',
  'from-[#FFE066] via-[#FFC857] to-[#FF9E7A]',
  'from-[#FF9DE2] via-[#FF6BD6] to-[#CF63FF]',
]

export const profileStub = {
  username: 'nuriddin2501',
  avatar: '🦊',
  school: 'Quiz Nova',
  streak: 12,
  league: 'Galaxy Gold',
  rank: 'Top 3%',
}

export const featureTiles = [
  {
    id: 'ft-1',
    icon: '🛰️',
    accent: 'from-[#5B6CFF] via-[#7A8BFF] to-[#A9B4FF]',
    titleKey: 'data.landing.featureTiles.live.title',
    bodyKey: 'data.landing.featureTiles.live.body',
  },
  {
    id: 'ft-2',
    icon: '🎯',
    accent: 'from-[#1FA2FF] via-[#38D7FF] to-[#7BF6D9]',
    titleKey: 'data.landing.featureTiles.accuracy.title',
    bodyKey: 'data.landing.featureTiles.accuracy.body',
  },
  {
    id: 'ft-3',
    icon: '🏆',
    accent: 'from-[#FF8A5B] via-[#FF6B9C] to-[#CF63FF]',
    titleKey: 'data.landing.featureTiles.rewards.title',
    bodyKey: 'data.landing.featureTiles.rewards.body',
  },
]

export const heroStats = [
  { id: 'hs-1', value: '120k+', labelKey: 'data.landing.heroStats.players' },
  { id: 'hs-2', value: '4.8/5', labelKey: 'data.landing.heroStats.rating' },
  { id: 'hs-3', value: '38m', labelKey: 'data.landing.heroStats.answers' },
]

export const recentActivity = [
  { id: 'ra-1', icon: '🚀', color: 'bg-white/20', titleKey: 'data.landing.recentActivity.hosted', timeKey: 'data.landing.recentActivity.hostedTime' },
  { id: 'ra-2', icon: '📝', color: 'bg-white/20', titleKey: 'data.landing.recentActivity.assigned', timeKey: 'data.landing.recentActivity.assignedTime' },
  { id: 'ra-3', icon: '📨', color: 'bg-white/20', titleKey: 'data.landing.recentActivity.summary', timeKey: 'data.landing.recentActivity.summaryTime' },
]

export const socialProofStats = [
  { id: 'sp-1', labelKey: 'data.landing.socialProof.classesLabel', value: '24k+', detailKey: 'data.landing.socialProof.classesDetail', icon: '🏫' },
  { id: 'sp-2', labelKey: 'data.landing.socialProof.weeklyLabel', value: '1.2m', detailKey: 'data.landing.socialProof.weeklyDetail', icon: '⚡' },
  { id: 'sp-3', labelKey: 'data.landing.socialProof.accuracyLabel', value: '89%', detailKey: 'data.landing.socialProof.accuracyDetail', icon: '🎯' },
  { id: 'sp-4', labelKey: 'data.landing.socialProof.savedLabel', value: '320k', detailKey: 'data.landing.socialProof.savedDetail', icon: '📚' },
]

export const howItWorksSteps = [
  { id: 'hw-1', badgeKey: 'data.landing.howItWorks.step1.badge', icon: '🧩', titleKey: 'data.landing.howItWorks.step1.title', bodyKey: 'data.landing.howItWorks.step1.body' },
  { id: 'hw-2', badgeKey: 'data.landing.howItWorks.step2.badge', icon: '🎮', titleKey: 'data.landing.howItWorks.step2.title', bodyKey: 'data.landing.howItWorks.step2.body' },
  { id: 'hw-3', badgeKey: 'data.landing.howItWorks.step3.badge', icon: '📈', titleKey: 'data.landing.howItWorks.step3.title', bodyKey: 'data.landing.howItWorks.step3.body' },
]

export const gameModes = [
  {
    id: 'gm-1',
    titleKey: 'data.landing.gameModes.rocketRush.title',
    descriptionKey: 'data.landing.gameModes.rocketRush.desc',
    icon: '🚀',
    players: 60,
    durationKey: 'data.landing.gameModes.duration.12min',
    tagKey: 'data.landing.gameModes.tags.fast',
    accent: 'from-[#6F5BFF] via-[#8C7CFF] to-[#B29DFF]',
  },
  {
    id: 'gm-2',
    titleKey: 'data.landing.gameModes.towerDefense.title',
    descriptionKey: 'data.landing.gameModes.towerDefense.desc',
    icon: '🏰',
    players: 40,
    durationKey: 'data.landing.gameModes.duration.15min',
    tagKey: 'data.landing.gameModes.tags.strategy',
    accent: 'from-[#45E0FF] via-[#1FA2FF] to-[#5B6CFF]',
  },
  {
    id: 'gm-3',
    titleKey: 'data.landing.gameModes.goldQuest.title',
    descriptionKey: 'data.landing.gameModes.goldQuest.desc',
    icon: '💰',
    players: 50,
    durationKey: 'data.landing.gameModes.duration.10min',
    tagKey: 'data.landing.gameModes.tags.classic',
    accent: 'from-[#FFB347] via-[#FF8A5B] to-[#FF6B9C]',
  },
  {
    id: 'gm-4',
    titleKey: 'data.landing.gameModes.homework.title',
    descriptionKey: 'data.landing.gameModes.homework.desc',
    icon: '📘',
    players: 1,
    durationKey: 'data.landing.gameModes.duration.selfPaced',
    tagKey: 'data.landing.gameModes.tags.async',
    accent: 'from-[#7BF6D9] via-[#45E0FF] to-[#5B6CFF]',
  },
]

export const categoryChips = [
  { value: 'Math', labelKey: 'data.subjects.math' },
  { value: 'Science', labelKey: 'data.subjects.science' },
  { value: 'History', labelKey: 'data.subjects.history' },
  { value: 'Coding', labelKey: 'data.subjects.coding' },
  { value: 'Art', labelKey: 'data.subjects.art' },
]

export const weeklyChallenge = {
  gradient: 'from-[#5B6CFF] via-[#45E0FF] to-[#7BF6D9]',
  code: 'NOVA26',
  titleKey: 'data.landing.weeklyChallenge.title',
  descriptionKey: 'data.landing.weeklyChallenge.desc',
  rewardKey: 'data.landing.weeklyChallenge.reward',
  deadlineKey: 'data.landing.weeklyChallenge.deadline',
}

export const testimonials = [
  {
    id: 'ts-1',
    avatar: '👩‍🏫',
    nameKey: 'data.landing.testimonials.t1.name',
    roleKey: 'data.landing.testimonials.t1.role',
    schoolKey: 'data.landing.testimonials.t1.school',
    quoteKey: 'data.landing.testimonials.t1.quote',
  },
  {
    id: 'ts-2',
    avatar: '🧑‍🏫',
    nameKey: 'data.landing.testimonials.t2.name',
    roleKey: 'data.landing.testimonials.t2.role',
    schoolKey: 'data.landing.testimonials.t2.school',
    quoteKey: 'data.landing.testimonials.t2.quote',
  },
  {
    id: 'ts-3',
    avatar: '👨‍👩‍👧',
    nameKey: 'data.landing.testimonials.t3.name',
    roleKey: 'data.landing.testimonials.t3.role',
    schoolKey: 'data.landing.testimonials.t3.school',
    quoteKey: 'data.landing.testimonials.t3.quote',
  },
]

export const faqItems = [
  { id: 'faq-1', questionKey: 'data.landing.faq.q1', answerKey: 'data.landing.faq.a1' },
  { id: 'faq-2', questionKey: 'data.landing.faq.q2', answerKey: 'data.landing.faq.a2' },
  { id: 'faq-3', questionKey: 'data.landing.faq.q3', answerKey: 'data.landing.faq.a3' },
]

export const teacherParentHighlights = [
  {
    id: 'tph-1',
    titleKey: 'data.landing.highlights.teacher.title',
    bulletsKeys: [
      'data.landing.highlights.teacher.b1',
      'data.landing.highlights.teacher.b2',
      'data.landing.highlights.teacher.b3',
    ],
    ctaKey: 'data.landing.highlights.teacher.cta',
  },
  {
    id: 'tph-2',
    titleKey: 'data.landing.highlights.parent.title',
    bulletsKeys: [
      'data.landing.highlights.parent.b1',
      'data.landing.highlights.parent.b2',
      'data.landing.highlights.parent.b3',
    ],
    ctaKey: 'data.landing.highlights.parent.cta',
  },
]

export const newsletterPerks = [
  'data.landing.newsletter.perk1',
  'data.landing.newsletter.perk2',
  'data.landing.newsletter.perk3',
]

export const setFilters = [
  { value: 'All', labelKey: 'data.filters.all' },
  { value: 'Math', labelKey: 'data.subjects.math' },
  { value: 'Science', labelKey: 'data.subjects.science' },
  { value: 'History', labelKey: 'data.subjects.history' },
  { value: 'Coding', labelKey: 'data.subjects.coding' },
  { value: 'SEL', labelKey: 'data.subjects.sel' },
]

export const featuredCollections = [
  { id: 'col-1', titleKey: 'data.discover.collections.stemShowdown', gradient: 'from-[#53E0DF] via-[#44BFFF] to-[#5B6CFF]', sets: 18 },
  { id: 'col-2', titleKey: 'data.discover.collections.earthWeek', gradient: 'from-[#84D6FF] via-[#71B7FF] to-[#5B8BFF]', sets: 12 },
  { id: 'col-3', titleKey: 'data.discover.collections.selMoments', gradient: 'from-[#F7B250] via-[#F59A67] to-[#F6858A]', sets: 9 },
]

export const discoverCategories = [
  {
    id: 'dc-1',
    titleKey: 'data.discover.categories.stem',
    items: [
      { value: 'Math', labelKey: 'data.subjects.math' },
      { value: 'Science', labelKey: 'data.subjects.science' },
      { value: 'Engineering', labelKey: 'data.discover.items.engineering' },
      { value: 'Robotics', labelKey: 'data.discover.items.robotics' },
    ],
  },
  {
    id: 'dc-2',
    titleKey: 'data.discover.categories.humanities',
    items: [
      { value: 'ELA', labelKey: 'data.discover.items.ela' },
      { value: 'History', labelKey: 'data.subjects.history' },
      { value: 'Geography', labelKey: 'data.discover.items.geography' },
      { value: 'Civics', labelKey: 'data.discover.items.civics' },
    ],
  },
  {
    id: 'dc-3',
    titleKey: 'data.discover.categories.extras',
    items: [
      { value: 'Trivia', labelKey: 'data.subjects.trivia' },
      { value: 'SEL', labelKey: 'data.subjects.sel' },
      { value: 'Languages', labelKey: 'data.discover.items.languages' },
      { value: 'Art & Music', labelKey: 'data.discover.items.artMusic' },
    ],
  },
]

const baseSets = [
  { id: 'set-science-basics', titleKey: 'data.sets.scienceBasics', subject: 'Science', questions: 18, plays: '12.4k', creatorKey: 'data.creators.quizNova', rating: 4.7 },
  { id: 'set-math-basics', titleKey: 'data.sets.mathBasics', subject: 'Math', questions: 16, plays: '10.1k', creatorKey: 'data.creators.quizNova', rating: 4.5 },
  { id: 'set-earth-systems', titleKey: 'data.sets.earthSystems', subject: 'Science', questions: 24, plays: '8.9k', creatorKey: 'data.creators.labCrew', rating: 4.8 },
  { id: 'set-fractions', titleKey: 'data.sets.fractions', subject: 'Math', questions: 20, plays: '7.1k', creatorKey: 'data.creators.msAri', rating: 4.4 },
  { id: 'set-space-explorers', titleKey: 'data.sets.spaceExplorers', subject: 'Science', questions: 22, plays: '6.7k', creatorKey: 'data.creators.quizNova', rating: 4.6 },
  { id: 'set-world-history', titleKey: 'data.sets.worldHistory', subject: 'History', questions: 25, plays: '5.5k', creatorKey: 'data.creators.mrKhan', rating: 4.6 },
  { id: 'set-coding-loops', titleKey: 'data.sets.codingLoops', subject: 'Coding', questions: 15, plays: '4.8k', creatorKey: 'data.creators.codeClub', rating: 4.3 },
  { id: 'set-sel-mindful', titleKey: 'data.sets.selMindful', subject: 'SEL', questions: 14, plays: '4.2k', creatorKey: 'data.creators.counselTeam', rating: 4.7 },
  { id: 'set-trivia-mix', titleKey: 'data.sets.triviaMix', subject: 'Trivia', questions: 30, plays: '9.9k', creatorKey: 'data.creators.community', rating: 4.2 },
  { id: 'set-language-boost', titleKey: 'data.sets.languageBoost', subject: 'Languages', questions: 18, plays: '3.7k', creatorKey: 'data.creators.languageLab', rating: 4.4 },
  { id: 'set-art-rhythm', titleKey: 'data.sets.artRhythm', subject: 'Art', questions: 12, plays: '2.9k', creatorKey: 'data.creators.community', rating: 4.1 },
  { id: 'set-rocket-rush-pack', titleKey: 'data.sets.rocketRushPack', subject: 'Science', questions: 26, plays: '11.3k', creatorKey: 'data.creators.quizNova', rating: 4.9 },
]

export const discoverSets = baseSets.map((set, index) => ({
  ...set,
  gradient: cardGradients[index % cardGradients.length],
  updatedAt: `2026-02-${String((index % 20) + 1).padStart(2, '0')}`,
}))

export const trendingSets = discoverSets.slice(0, 6)
export const recommendedSets = discoverSets.slice(2, 8)

export const dashboardHighlights = [
  { id: 'dh-1', labelKey: 'data.dashboard.highlights.avgMastery.label', value: '86%', badgeKey: 'data.dashboard.highlights.avgMastery.badge' },
  { id: 'dh-2', labelKey: 'data.dashboard.highlights.activeStudents.label', value: '128', badgeKey: 'data.dashboard.highlights.activeStudents.badge' },
  { id: 'dh-3', labelKey: 'data.dashboard.highlights.liveSessions.label', value: '9', badgeKey: 'data.dashboard.highlights.liveSessions.badge' },
  { id: 'dh-4', labelKey: 'data.dashboard.highlights.homework.label', value: '24', badgeKey: 'data.dashboard.highlights.homework.badge' },
]

export const dashboardQuickActions = [
  { id: 'qa-host', actionId: 'host_game', labelKey: 'data.dashboard.quick.host.label', descriptionKey: 'data.dashboard.quick.host.desc', icon: '🚀' },
  { id: 'qa-join', actionId: 'join_game', labelKey: 'data.dashboard.quick.join.label', descriptionKey: 'data.dashboard.quick.join.desc', icon: '🎟️' },
  { id: 'qa-create', actionId: 'create_set', labelKey: 'data.dashboard.quick.create.label', descriptionKey: 'data.dashboard.quick.create.desc', icon: '🧠' },
  { id: 'qa-assign', actionId: 'assign_hw', labelKey: 'data.dashboard.quick.assign.label', descriptionKey: 'data.dashboard.quick.assign.desc', icon: '📤' },
]

export const dashboardTimeline = [
  { id: 'tl-1', icon: '🛡️', titleKey: 'data.dashboard.timeline.t1.title', detailKey: 'data.dashboard.timeline.t1.detail', timestampKey: 'data.dashboard.timeline.t1.time' },
  { id: 'tl-2', icon: '📣', titleKey: 'data.dashboard.timeline.t2.title', detailKey: 'data.dashboard.timeline.t2.detail', timestampKey: 'data.dashboard.timeline.t2.time' },
  { id: 'tl-3', icon: '✉️', titleKey: 'data.dashboard.timeline.t3.title', detailKey: 'data.dashboard.timeline.t3.detail', timestampKey: 'data.dashboard.timeline.t3.time' },
  { id: 'tl-4', icon: '🚀', titleKey: 'data.dashboard.timeline.t4.title', detailKey: 'data.dashboard.timeline.t4.detail', timestampKey: 'data.dashboard.timeline.t4.time' },
]

export const continuePlayingSets = [
  { id: 'cp-1', titleKey: 'data.sets.scienceBasics', progress: 72, modeKey: 'data.dashboard.modes.rocketRush', color: 'from-[#45E0FF] to-[#5B6CFF]' },
  { id: 'cp-2', titleKey: 'data.sets.fractions', progress: 54, modeKey: 'data.dashboard.modes.classic', color: 'from-[#FFB347] to-[#FF6B9C]' },
  { id: 'cp-3', titleKey: 'data.sets.worldHistory', progress: 33, modeKey: 'data.dashboard.modes.factoryLite', color: 'from-[#7BF6D9] to-[#45E0FF]' },
]

export const achievementBadges = [
  { id: 'ab-1', icon: '🔥', titleKey: 'data.dashboard.badges.streak.title', detailKey: 'data.dashboard.badges.streak.desc' },
  { id: 'ab-2', icon: '🎯', titleKey: 'data.dashboard.badges.accuracy.title', detailKey: 'data.dashboard.badges.accuracy.desc' },
  { id: 'ab-3', icon: '🏅', titleKey: 'data.dashboard.badges.host.title', detailKey: 'data.dashboard.badges.host.desc' },
  { id: 'ab-4', icon: '🧠', titleKey: 'data.dashboard.badges.builder.title', detailKey: 'data.dashboard.badges.builder.desc' },
]

export const leaderboardEntries = [
  { id: 'lb-1', teacher: 'Ms. Reed', points: 12840 },
  { id: 'lb-2', teacher: 'Mr. Khan', points: 12100 },
  { id: 'lb-3', teacher: 'Ms. Ari', points: 11820 },
  { id: 'lb-4', teacher: 'Coach Lee', points: 11090 },
]

export const announcementsFeed = [
  { id: 'ann-1', titleKey: 'data.dashboard.announcements.a1.title', detailKey: 'data.dashboard.announcements.a1.detail', timeKey: 'data.dashboard.announcements.a1.time' },
  { id: 'ann-2', titleKey: 'data.dashboard.announcements.a2.title', detailKey: 'data.dashboard.announcements.a2.detail', timeKey: 'data.dashboard.announcements.a2.time' },
  { id: 'ann-3', titleKey: 'data.dashboard.announcements.a3.title', detailKey: 'data.dashboard.announcements.a3.detail', timeKey: 'data.dashboard.announcements.a3.time' },
]

