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
    <div className="px-3 common-questions-wrapper mb-11">
      {questions.slice(0, 5).map((q, index) => (
        <div 
          key={q.id} 
          className={`common-questions-item ${activeIndex === index ? 'active' : ''}`}
        >
          <div 
            className="common-questions"
            onClick={() => toggleQuestion(index)}
          >
            {q.question}
          </div>
          <div className="common-answer">
            {q.answer && (
              <div className="component-rich-text">
                {q.answer.length > 300 ? q.answer.substring(0, 300) + '...' : q.answer}
              </div>
            )}
            <div className="article-link">
              <Link href={`/questions/${q.slug}`}>Full Article</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
