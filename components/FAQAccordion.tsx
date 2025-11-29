'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Question {
  id: string
  question: string
  answer: string | null
  slug: string
}

interface FAQAccordionProps {
  questions: Question[]
}

export default function FAQAccordion({ questions }: FAQAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleQuestion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="px-0 sm:px-3 common-questions-wrapper mb-6 lg:mb-11">
      {questions.slice(0, 5).map((q, index) => (
        <div 
          key={q.id} 
          className={`common-questions-item ${activeIndex === index ? 'active' : ''} mb-3 lg:mb-4`}
        >
          <div 
            className="common-questions text-sm sm:text-base lg:text-lg cursor-pointer"
            onClick={() => toggleQuestion(index)}
          >
            {q.question}
          </div>
          <div className="common-answer">
            {q.answer && (
              <div className="component-rich-text text-sm sm:text-base">
                {q.answer.length > 300 ? q.answer.substring(0, 300) + '...' : q.answer}
              </div>
            )}
            <div className="article-link mt-2">
              <Link href={`/questions/${q.slug}`} className="text-sm sm:text-base">Full Article</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
