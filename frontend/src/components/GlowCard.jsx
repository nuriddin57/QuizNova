import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function GlowCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay }}
      className={cn('glass-card gradient-border relative overflow-hidden p-6', className)}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-20" />
    </motion.div>
  )
}
