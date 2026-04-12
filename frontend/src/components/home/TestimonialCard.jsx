import { HiMiniChatBubbleBottomCenterText } from 'react-icons/hi2'

import Card from '../Card'

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

const TestimonialCard = ({ testimonial, roleLabel }) => (
  <Card className="group h-full rounded-[32px] border border-white/70 bg-white/95 transition duration-300 hover:border-primary-100 hover:shadow-[0_28px_80px_rgba(59,130,246,0.14)]">
    <article className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="h-14 w-14 rounded-2xl object-cover ring-4 ring-primary-50"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-blue text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(59,130,246,0.28)]">
              {getInitials(testimonial.name)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{testimonial.name}</h3>
            <p className="text-sm font-semibold text-primary-600">{roleLabel}</p>
            <p className="text-sm text-slate-500">{testimonial.school}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-primary-50 p-3 text-primary-500 transition group-hover:bg-primary-500 group-hover:text-white">
          <HiMiniChatBubbleBottomCenterText className="text-xl" />
        </div>
      </div>
      <blockquote className="mt-6 flex-1 text-base leading-7 text-slate-600">
        "{testimonial.quote}"
      </blockquote>
    </article>
  </Card>
)

export default TestimonialCard

