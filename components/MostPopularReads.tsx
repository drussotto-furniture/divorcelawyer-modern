import Image from 'next/image'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  published_at: string | null
}

interface Video {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  video_url: string | null
  published_at: string | null
}

interface MostPopularReadsProps {
  featuredArticle?: Article | Video
  subArticles?: (Article | Video)[]
  listArticles?: (Article | Video)[]
  backgroundColor?: 'bg-white' | 'bg-seashell'
}

export default function MostPopularReads({
  featuredArticle,
  subArticles = [],
  listArticles = [],
  backgroundColor = 'bg-white'
}: MostPopularReadsProps) {
  const bgContrastClass = backgroundColor === 'bg-seashell' ? 'bg-white' : 'bg-seashell'

  const isVideo = (item: any) => item.video_url !== undefined

  const getImageUrl = (item: Article | Video) => {
    if ('featured_image_url' in item) {
      return item.featured_image_url
    }
    if ('thumbnail_url' in item) {
      return item.thumbnail_url
    }
    return null
  }

  const getLink = (item: Article | Video) => {
    if (isVideo(item)) {
      return `/videos/${item.slug}`
    }
    return `/articles/${item.slug}`
  }

  const getLinkText = (item: Article | Video) => {
    return isVideo(item) ? 'Watch Video' : 'Read Article'
  }

  return (
    <section className={`${backgroundColor} block-most-popular-reads block-spacing spacing-top-normal spacing-bottom-normal px-4 lg:px-10 xl:px-10`}>
      <div className={`block-container mx-auto ${backgroundColor} container-size-medium`}>
        <div className="container flex flex-col lg:px-0 gap-x-14 xl:gap-x-10 slideup">
          <h2 className="text-2xl lg:text-4xl mb-4 text-center">
            <div className="component-rich-text">
              Most <span>Popular</span> Reads and Views
            </div>
          </h2>

          <div className="max-w-screen-lg mx-auto text-center component-rich-text text-sm lg:text-base mb-6">
            Explore the most popular articles and videos on divorce-related topics to gain insights into your own process.
          </div>

          <div className="text-left">
            <div className="py-8 mx-auto lg:max-w-none lg:py-12">
              <div className="flex flex-col gap-3 lg:flex-row lg:gap-6 slideup">
                {/* Main/Featured Article Section */}
                {featuredArticle && (
                  <div className={`leading-article relative flex flex-col justify-between flex-1 rounded-b-lg group overflow-hidden ${backgroundColor}`}>
                    <div className="relative flex-1 group">
                      <div className="relative w-full featured-thumbnail overflow-hidden bg-white rounded-t-lg max-h-[360px] sm:aspect-auto lg:aspect-square lg:max-h-[450px]">
                        {getImageUrl(featuredArticle) ? (
                          <Link href={getLink(featuredArticle)}>
                            <Image
                              src={getImageUrl(featuredArticle)!}
                              alt={featuredArticle.title}
                              width={600}
                              height={450}
                              className="object-cover object-center w-full h-full"
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-6xl">📄</span>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-b-lg lg:py-6 lg:px-8 lg:h-full ${bgContrastClass}`}>
                        <Link href={getLink(featuredArticle)}>
                          <h3 className="min-h-[70px] mb-2 text-base font-bold text-black lg:text-2xl font-libre">
                            {featuredArticle.title}
                          </h3>
                        </Link>
                        <p className="text-sm italic underline font-proxima text-secondary">
                          <Link href={getLink(featuredArticle)}>
                            {getLinkText(featuredArticle)}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary Articles Section (2 medium cards) */}
                <div className="relative flex flex-row flex-wrap flex-1 max-w-full md:flex-nowrap second-level-articles gap-x-3 gap-y-3 lg:gap-y-4 lg:flex-col lg:max-w-72 lg:mx-0 group">
                  {subArticles.slice(0, 2).map((article) => (
                    <div
                      key={article.id}
                      className={`second-level-article w-full md:w-1/2 rounded-b-lg min-h-[250px] max-h-full lg:min-h-[300px] lg:w-full ${backgroundColor}`}
                    >
                      <div className="relative w-full overflow-hidden bg-white rounded-t-lg featured-thumbnail article-thumbnail h-30 sm:aspect-auto lg:aspect-square sm:h-40">
                        {getImageUrl(article) ? (
                          <Link href={getLink(article)}>
                            <Image
                              src={getImageUrl(article)!}
                              alt={article.title}
                              width={288}
                              height={160}
                              className="object-cover object-center w-full h-full"
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl">📄</span>
                          </div>
                        )}
                      </div>
                      <div className={`article-body min-h-[125px] p-3 lg:px-5 lg:py-5 rounded-b-lg ${bgContrastClass}`}>
                        <Link href={getLink(article)}>
                          <h3 className="min-h-[70px] mb-2 text-base font-bold text-black lg:text-xl font-libre">
                            {article.title}
                          </h3>
                        </Link>
                        <p className="text-sm italic underline font-proxima text-secondary">
                          <Link href={getLink(article)}>
                            {getLinkText(article)}
                          </Link>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Articles List Section (6 text-only items) */}
                <div className="relative flex flex-col flex-1 group articles-list">
                  {listArticles.slice(0, 6).map((article) => (
                    <div key={article.id} className="items min-h-[103px] align-middle pb-2">
                      <Link href={getLink(article)}>
                        <h3 className="mt-4 text-lg font-bold text-black lg:text-2xl font-libre">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-sm italic underline font-proxima text-secondary">
                        <Link href={getLink(article)}>
                          {getLinkText(article)}
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center slideup px-4 mt-6">
            <Link
              href="/learning-center/categories"
              className="component-button style-primary font-proxima w-full sm:w-auto sm:min-w-64 text-center"
            >
              <span className="button-wrapper">
                <span>Browse Topics</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

