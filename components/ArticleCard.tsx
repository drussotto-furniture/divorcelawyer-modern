import Link from 'next/link'
import { truncateText, stripHtml } from '@/lib/utils'

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  created_at: string
}

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = article.excerpt
    ? truncateText(stripHtml(article.excerpt), 150)
    : ''

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {article.title}
      </h3>
      {excerpt && (
        <p className="text-gray-600 line-clamp-3">{excerpt}</p>
      )}
      <div className="mt-4 text-blue-600 font-medium text-sm">
        Read more →
      </div>
    </Link>
  )
}

