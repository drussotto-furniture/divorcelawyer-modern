import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TagDisplayServer from '@/components/TagDisplayServer'
import DiscoverSlider from '@/components/DiscoverSlider'
import ThreePackComponent from '@/components/ThreePackComponent'
import MostPopularReads from '@/components/MostPopularReads'
import FAQAccordion from '@/components/FAQAccordion'
import RealVoicesCarousel from '@/components/RealVoicesCarousel'
import { 
  getArticles, 
  getStates, 
  getStages, 
  getEmotions, 
  getQuestions, 
  getFeaturedLawyersWithFirmsByCity,
  getHomepageContent,
  getSiteSettings,
  getRealVoicesStories,
  getContentCategories
} from '@/lib/supabase'
import { organizeHomepageContent, getContentItem, getSectionItems } from '@/lib/homepage-helpers'

// SEO Metadata for Homepage
export const metadata: Metadata = {
  title: 'DivorceLawyer.com - The Best Divorce Lawyers and Expert Resources',
  description: 'Connect with vetted divorce lawyers in your area. Access expert resources, articles, and guidance to navigate your divorce journey with confidence. Find top-rated family law attorneys near you.',
  keywords: [
    'divorce lawyer',
    'divorce attorney',
    'family law attorney',
    'divorce lawyer near me',
    'child custody lawyer',
    'divorce resources',
    'divorce process',
    'family law',
    'divorce help',
    'divorce guidance'
  ],
  authors: [{ name: 'DivorceLawyer.com' }],
  creator: 'DivorceLawyer.com',
  publisher: 'DivorceLawyer.com',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://divorcelawyer.com',
    siteName: 'DivorceLawyer.com',
    title: 'DivorceLawyer.com - The Best Divorce Lawyers and Expert Resources',
    description: 'Connect with vetted divorce lawyers in your area. Access expert resources, articles, and guidance to navigate your divorce journey with confidence.',
    images: [
      {
        url: 'https://divorcelawyer.com/media/home-1.webp',
        width: 1200,
        height: 630,
        alt: 'DivorceLawyer.com - Expert Divorce Resources and Vetted Attorneys',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DivorceLawyer.com - The Best Divorce Lawyers and Expert Resources',
    description: 'Connect with vetted divorce lawyers in your area. Access expert resources and guidance.',
    images: ['https://divorcelawyer.com/media/home-1.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://divorcelawyer.com',
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export default async function Home() {
  // Fetch data for homepage - wrap in try/catch for better error handling
  let lawFirms: any[] = []
  let articles: any[] = []
  let states: any[] = []
  let stages: any[] = []
  let emotions: any[] = []
  let questions: any[] = []
  let homepageContent: any[] = []
  let siteSettings: any[] = []
  let realVoicesStories: any[] = []
  let contentCategories: any[] = []
  
  // Get default city from site settings, fallback to Atlanta
  let defaultCity = 'atlanta'
  let defaultCityDisplay = 'Atlanta'
  let defaultStateCode = 'GA'
  
  try {
    const results = await Promise.allSettled([
      getArticles(9),
      getStates(),
      getStages(),
      getEmotions(),
      getQuestions(),
      getFeaturedLawyersWithFirmsByCity(defaultCity),
      getHomepageContent(),
      getSiteSettings(['default_city', 'default_city_display', 'default_state_code']),
      getRealVoicesStories(5),
      getContentCategories(),
    ])
    
    articles = results[0].status === 'fulfilled' ? results[0].value : []
    states = results[1].status === 'fulfilled' ? results[1].value : []
    stages = results[2].status === 'fulfilled' ? results[2].value : []
    emotions = results[3].status === 'fulfilled' ? results[3].value : []
    questions = results[4].status === 'fulfilled' ? results[4].value : []
    lawFirms = results[5].status === 'fulfilled' ? results[5].value : []
    homepageContent = results[6].status === 'fulfilled' ? results[6].value : []
    siteSettings = results[7].status === 'fulfilled' ? results[7].value : []
    realVoicesStories = results[8].status === 'fulfilled' ? results[8].value : []
    contentCategories = results[9].status === 'fulfilled' ? results[9].value : []
    
    // Get default city from settings
    const citySetting = siteSettings.find((s: any) => s.key === 'default_city')
    const cityDisplaySetting = siteSettings.find((s: any) => s.key === 'default_city_display')
    const stateSetting = siteSettings.find((s: any) => s.key === 'default_state_code')
    
    if (citySetting?.value) defaultCity = citySetting.value
    if (cityDisplaySetting?.value) defaultCityDisplay = cityDisplaySetting.value
    if (stateSetting?.value) defaultStateCode = stateSetting.value
    
    // Re-fetch law firms with correct city if needed
    if (citySetting?.value && citySetting.value !== 'atlanta') {
      const firmsResult = await Promise.allSettled([
        getFeaturedLawyersWithFirmsByCity(defaultCity),
      ])
      lawFirms = firmsResult[0].status === 'fulfilled' ? firmsResult[0].value : []
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
  }
  
  // Organize homepage content
  const content = organizeHomepageContent(homepageContent)
  
  // Helper to get content safely
  const get = (section: string, key: string) => getContentItem(content, section, key)
  
  // Build discover slides from database
  const discoverSlidesData = getSectionItems(content, 'discover_slider')
  const discoverSlides = discoverSlidesData.length > 0
    ? discoverSlidesData.map((slide: any) => ({
        image: slide.image_url || '',
        subtitle: slide.subtitle || '',
        description: slide.description || '',
        caption: slide.subtitle?.replace(/<[^>]*>/g, '').toUpperCase() || '',
        link: {
          title: slide.link_text || '',
          url: slide.link_url || ''
        }
      }))
    : [
        // Fallback to hardcoded slides if database is empty
        {
          image: '/media/DL-Site-Tour-Slide-1.png',
          subtitle: '<span>Discover</span> the Site',
          description: "Explore and access all the educational resources we offer, whether you're seeking answers, general information, or a top divorce attorney.",
          caption: 'DISCOVER THE SITE',
          link: { title: 'Learn About Us', url: '/about' }
        },
        {
          image: '/media/pick-a-journey.png',
          subtitle: 'Pick a <span>Journey</span>',
          description: "Choose to explore a journey, such as the Stages of Divorce or the Emotions Throughout the Process. Discover valuable resources for insight into your own process.",
          caption: 'PICK A JOURNEY',
          link: { title: 'Explore Stages of Divorce', url: '/stages' }
        },
        {
          image: '/media/explore-all-content-for-divorce.png',
          subtitle: '<span>Learn</span> And Explore',
          description: "Access the site's learning portal categories for in-depth information, including articles, videos, and more, covering all aspects of divorce.",
          caption: 'LEARN AND EXPLORE',
          link: { title: 'Explore Divorce Resources', url: '/learning-center' }
        },
        {
          image: '/media/connect-with-vetted-lawyer.png',
          subtitle: 'Connect with a <span>Vetted</span> Lawyer',
          description: "Ready to take the next step? We'll help you connect with a top divorce lawyer in your area. It's just an introduction—no pressure.",
          caption: 'CONNECT WITH A VETTED LAWYER',
          link: { title: 'Find a Lawyer', url: '/find-lawyer' }
        }
      ]

  // Generate Structured Data (JSON-LD)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DivorceLawyer.com',
    url: 'https://divorcelawyer.com',
    logo: 'https://divorcelawyer.com/images/HeaderWhte-logo.svg',
    description: 'Connect with vetted divorce lawyers in your area. Access expert resources, articles, and guidance to navigate your divorce journey with confidence.',
    sameAs: [
      // Add social media profiles when available
      // 'https://www.facebook.com/divorcelawyer',
      // 'https://twitter.com/divorcelawyerhq',
      // 'https://www.linkedin.com/company/divorcelawyer',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DivorceLawyer.com',
    url: 'https://divorcelawyer.com',
    description: 'The best divorce lawyers and expert resources to help you navigate your divorce journey.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://divorcelawyer.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  // FAQ Schema if questions exist
  const faqSchema = questions.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.slice(0, 5).map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer || '',
      },
    })),
  } : null

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section - HeroComponentSecondary */}
        <section className="block-hero-component-secondary bg-bluish relative column-layout pt-24 lg:pt-0">
          <div className="mx-auto container-fluid px-4 lg:px-0">
            <div className="flex flex-col h-full mx-auto lg:flex-row block-container container-size-medium content-middle">
              {/* Text Content */}
              <div className="relative z-10 pb-6 lg:pb-0 flex flex-col items-center justify-center text-center lg:items-start lg:justify-start lg:text-left hero-content-wrapper basis-1/2 px-4 lg:px-0">
                <h1 className="title font-proxima text-sm lg:text-base">
                  {get('hero', 'title')?.title || 'The Best Divorce Lawyers and Expert Resources'}
                </h1>
                <h2 className="subtitle text-3xl lg:text-6xl xl:text-7xl">
                  <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('hero', 'subtitle')?.subtitle || 'Go your <span>own</span> way' }} />
                </h2>
                <div className="component-rich-text text-sm lg:text-base mt-4 mb-6 lg:mb-8">
                  {get('hero', 'description')?.description || "We're your go-to source for all things divorce. From a comprehensive learning portal to vetted divorce specialists in your area, we make sure you have everything you need to move forward with confidence."}
                </div>
                
                <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row pb-0 mx-auto text-center lg:gap-5 lg:mx-0 lg:pb-0 lg:text-left hero-menu-list">
                  {get('hero', 'cta_find_lawyer') && (
                    <Link href={get('hero', 'cta_find_lawyer')?.link_url || '/connect-with-lawyer'} className="component-button style-primary w-full sm:w-auto">
                      <span>{get('hero', 'cta_find_lawyer')?.link_text || 'Find a Lawyer'}</span>
                    </Link>
                  )}
                  {get('hero', 'cta_learn') && (
                    <Link href={get('hero', 'cta_learn')?.link_url || '/learning-center'} className="component-button style-secondary w-full sm:w-auto">
                      <span>{get('hero', 'cta_learn')?.link_text || 'Learn'}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Image */}
              <div className="flex dls-home-hero-image-wrapper lg:hidden basis-1/2 mt-4">
                <div className="hero-image w-full">
                  <Image
                    src={get('hero', 'mobile_image')?.image_url || '/media/NewLife-DivorceLawyer.webp'}
                    alt="New Life"
                    width={600}
                    height={600}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Desktop Image */}
              <div className="hidden dls-home-hero-image-wrapper lg:flex basis-1/2">
                <div className="hero-image left-image">
                  <Image
                    src={get('hero', 'desktop_image')?.image_url || '/media/home-1.webp'}
                    alt="New Life"
                    width={960}
                    height={785}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discover Slider */}
        <DiscoverSlider slides={discoverSlides} />

        {/* Top Divorce Lawyers Section - Three Pack Component */}
        <div className="px-4 lg:px-0">
          <ThreePackComponent 
            lawFirms={lawFirms as any}
            city={defaultCityDisplay}
            stateCode={defaultStateCode}
            backgroundColor="bg-bluish"
          />
        </div>

        {/* Most Popular Reads */}
        <MostPopularReads
          featuredArticle={articles[0]}
          subArticles={articles.slice(1, 3)}
          listArticles={articles.slice(3, 9)}
          backgroundColor="bg-white"
        />

        {/* Stages of Divorce */}
        <section id="stages" className="block-stages block-spacing spacing-top-none spacing-bottom-none bg-subtlesand px-4 lg:px-8">
          <div className="bg-subtlesand block-container mx-auto container-size-medium">
            <div className="container flex flex-col justify-between h-auto gap-6 lg:gap-10 px-0 pb-3 items-left lg:items-center xl:gap-12">
              <div className="px-0 lg:px-5 text-center text-container slideup">
                <h2 className="text-2xl lg:text-4xl mb-4">
                  <div className="component-rich-text text-center" dangerouslySetInnerHTML={{ __html: get('stages_section', 'title')?.title || '<span>Stages</span> of Divorce' }} />
                </h2>
                <div className="component-rich-text max-w-screen-lg text-sm lg:text-base text-center mx-auto">
                  {get('stages_section', 'description')?.description || "Divorce can feel like a rollercoaster ride, full of ups and downs. To make it easier, sometimes it's best to break down the process into distinct stages, each with its unique characteristics and challenges. Click on a stage to explore articles and videos that can provide insight and support for your journey."}
                </div>
              </div>

              <div className="mx-0 xl:mx-3 stages-container slideup">
                <div className="flex flex-col sm:flex-row sm:flex-wrap text-left xl:flex-nowrap xl:gap-x-16 gap-4">
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex flex-row items-center w-full gap-4 px-4 py-4 sm:px-5 sm:py-5 xl:w-auto xl:items-start xl:gap-4 xl:py-0 xl:flex-col xl:basis-auto bg-white rounded-lg xl:bg-transparent xl:rounded-none stage-item"
                    >
                      <div className="w-12 min-w-12 flex justify-start flex-shrink-0">
                        {stage.featured_image_url ? (
                          <Link href={`/stages/${stage.slug}`}>
                            <Image
                              src={stage.featured_image_url}
                              alt={stage.name}
                              width={48}
                              height={48}
                              className="img-fluid"
                            />
                          </Link>
                        ) : (
                          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                            {stage.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <h5 className="mb-1 md:mb-4 font-proxima text-base lg:text-lg">
                          <Link
                            href={`/stages/${stage.slug}`}
                            className="italic font-semibold tracking-tight font-proxima"
                          >
                            {stage.name}
                          </Link>
                        </h5>
                        {stage.description && (
                          <div className="component-rich-text text-left text-sm lg:text-base">
                            {stage.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {get('stages_section', 'button') && (
                <div className="flex justify-center slideup px-4">
                  <Link
                    href={get('stages_section', 'button')?.link_url || '/stages'}
                    className="component-button style-primary w-full sm:w-auto text-center"
                  >
                    <span>{get('stages_section', 'button')?.link_text || 'Learn More about the Stages of Divorce'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Emotional Path */}
        <section id="emotions" className="block-emotions block-spacing spacing-top-normal spacing-bottom-normal py-8 lg:py-10 px-4 lg:px-8 bg-seashell section-style-boxed">
          <div className="block-container container-dark slideup mx-auto container-size-medium py-8 md:py-16 lg:py-24">
            <div className="container flex flex-col justify-center text-left align-middle xl:text-center min-h-auto lg:min-h-96">
              <h2 className="text-2xl lg:text-4xl mb-4">
                <div className="component-rich-text text-center" dangerouslySetInnerHTML={{ __html: get('emotions_section', 'title')?.title || 'The <span>Emotional</span> Path Through Divorce' }} />
              </h2>
              <div className="component-rich-text max-w-6xl mx-auto text-sm lg:text-base text-left xl:text-center lg:px-7 mb-6 lg:mb-8">
                {get('emotions_section', 'description')?.description || "A divorce is a major life change, and it's natural to experience a range of intense emotions along the way. Whether you're thinking about divorce or already in the middle of it, we're here to help navigate through it. Click on an emotion to explore and understand the feelings you may be experiencing."}
              </div>

              <div className="mx-0 xl:mx-3 emotions-list slideup">
                <ul className="flex flex-row flex-wrap max-w-screen-lg gap-3 py-8 lg:py-16 mx-auto align-middle justify-center gap-y-3 lg:gap-10 lg:flex-nowrap">
                  {emotions.map((emotion) => (
                    <li key={emotion.id} className="text-center w-full sm:w-auto sm:flex-1 lg:flex-none">
                      <Link
                        href={`/emotions/${emotion.slug}`}
                        className="block px-6 py-3 lg:px-8 lg:py-4 text-white transition-all rounded-full text-sm lg:text-base font-proxima bg-greenShadesLight hover:text-black hover:bg-primary"
                      >
                        {emotion.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {get('emotions_section', 'button') && (
                <div className="flex justify-center slideup px-4">
                  <Link
                    href={get('emotions_section', 'button')?.link_url || '/emotions'}
                    className="component-button style-primary w-full sm:w-auto text-center"
                  >
                    <span>{get('emotions_section', 'button')?.link_text || 'Explore Emotions Along the Process'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Real Voices */}
        <section id="real-voices" className="block-real-voices block-spacing spacing-top-none spacing-bottom-large bg-subtlesand px-4 lg:px-0">
          <div className="block-container mx-auto slideup container-size-small">
            <h2 className="text-2xl lg:text-4xl mb-4">
              <div className="component-rich-text text-center" dangerouslySetInnerHTML={{ __html: get('real_voices_section', 'title')?.title || 'Real Voices:<br/><span>Coffee Talk</span>' }} />
            </h2>
            <div className="component-rich-text max-w-screen-lg mx-auto mb-6 text-center text-sm lg:text-base">
              {get('real_voices_section', 'description')?.description || "A safe space where real people offer comfort and guidance by sharing their very real divorce stories. Whether contemplating divorce or starting your new life, Coffee Talk will remind you that you're not alone."}
            </div>

            <RealVoicesCarousel 
              stories={realVoicesStories.map((story: any) => ({
                title: story.title,
                description: story.description,
                author: story.author_display_name || story.author || 'Anonymous'
              }))}
            />

            {get('real_voices_section', 'button') && (
              <div className="flex justify-center mt-6 lg:mt-10 px-4">
                <Link
                  href={get('real_voices_section', 'button')?.link_url || '/real-voices'}
                  className="component-button style-primary w-full sm:w-auto text-center"
                >
                  <span>{get('real_voices_section', 'button')?.link_text || 'Explore Real Voices'}</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Get Informed Categories */}
        <section id="categories" className="block-categories block-spacing spacing-top-normal spacing-bottom-normal z-10 relative bg-white px-4 py-8 lg:px-8 lg:py-10">
          <div className="relative bg-white block-container mx-auto container-size-medium">
            <div className="slideup">
              <div className="px-0 lg:px-5 text-center slideup mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-4xl mb-4">
                  <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('categories_section', 'title')?.title || 'Get Informed.<br/>Get <span>Empowered.</span>' }} />
                </h2>
                <div className="component-rich-text max-w-screen-lg mx-auto text-center text-sm lg:text-base">
                  {get('categories_section', 'description')?.description || 'Read up on essential divorce topics to learn more about the process and all its different aspects.'}
                </div>
              </div>

              <div className="py-6 lg:py-10 category-block slideup">
                <ul className="flex flex-row flex-wrap justify-center w-full gap-2 sm:gap-3 lg:gap-0 p-0 mx-auto lg:flex-nowrap">
                  {contentCategories.length > 0 ? (
                    contentCategories.map((category: any) => (
                      <li key={category.id}>
                        <Link
                          href={`/category/${category.slug}`}
                          className="flex items-center justify-center cat-block"
                        >
                          <span className="font-normal font-libre">{category.name}</span>
                        </Link>
                      </li>
                    ))
                  ) : (
                    // Fallback to hardcoded categories if none in database
                    [
                      "Child Custody",
                      "Spousal Support",
                      "Finances",
                      "Business Interests",
                      "Separation",
                      "Behavioral Issues",
                      "The Divorce Process"
                    ].map((category) => (
                      <li key={category}>
                        <Link
                          href={`/category/${category.toLowerCase().replace(/ /g, '-')}`}
                          className="flex items-center justify-center cat-block"
                        >
                          <span className="font-normal font-libre">{category}</span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {get('categories_section', 'button') && (
                <div className="flex justify-center slideup px-4 mt-6">
                  <Link
                    href={get('categories_section', 'button')?.link_url || '/learning-center/categories'}
                    className="component-button style-primary w-full sm:w-auto sm:min-w-64 text-center"
                  >
                    <span>{get('categories_section', 'button')?.link_text || 'Browse Categories'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Connect CTA */}
        <section className="block-connect-with-lawyer block-spacing spacing-top-none spacing-bottom-none section-dark px-4 lg:px-10 xl:px-10">
          <div className="pack-component block-container rounded-2xl lg:rounded-3xl slideup container-size-medium bg-bluish overflow-hidden">
            <div className="flex flex-col align-center lg:flex-row">
              <div className="w-full px-5 py-8 lg:py-10 text-center lg:text-left lg:px-20 md:flex-col sm:w-full md:w-full lg:w-8/12 xl:w-8/12 left-pan">
                <h2 className="p-0 m-0 font-medium uppercase text-sm lg:text-base mb-2">
                  {get('connect_cta', 'title')?.title || 'Introductions, no pressure'}
                </h2>
                <h3 className="text-2xl lg:text-4xl mb-4">
                  <div className="component-rich-text">
                    {get('connect_cta', 'subtitle')?.subtitle || 'Connect with a Top Divorce Attorney'}
                  </div>
                </h3>
                <p className="mt-4 lg:mt-10 mb-4 text-sm lg:text-base font-light location-tagline">
                  {get('connect_cta', 'description')?.description || 'Are you in a different location? We can introduce you to the best family lawyers in your area.'}
                </p>
                <div className="w-full max-w-full lg:max-w-xl">
                  <form className="newsletter-form mt-2 flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      className="search-field flex-1"
                      placeholder={get('connect_cta', 'placeholder')?.description || 'Type your city or zipcode.'}
                    />
                    <button
                      type="submit"
                      className="submit-button whitespace-nowrap"
                    >
                      {get('connect_cta', 'button')?.link_text || 'Find a Lawyer'}
                    </button>
                  </form>
                </div>
              </div>
              <div className="w-full sm:w-full md:w-full lg:w-4/12 xl:w-4/12 mt-6 lg:mt-0">
                <div className="w-full h-64 sm:h-80 lg:h-full rounded-b-2xl lg:rounded-2xl image-fit overflow-hidden">
                  <Image
                    src={get('connect_cta', 'image')?.image_url || '/media/connect-with-vetted-lawyer.png'}
                    alt="Connect with lawyer"
                    width={400}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Questions */}
        <section id="faq" className="block-common-questions block-spacing spacing-top-none spacing-bottom-none bg-white px-4 lg:px-8 py-8 lg:py-12">
          <div className="mx-auto block-container bg-white container-size-medium">
            <h2 className="text-2xl lg:text-4xl mb-4 text-center">
              <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('faq_section', 'title')?.title || 'Common <span>Questions</span>' }} />
            </h2>
            <div className="short-description mb-6">
              <div className="component-rich-text text-center max-w-4xl mx-auto text-sm lg:text-base">
                {get('faq_section', 'description')?.description || "Here are some of the most commonly asked questions about divorce. Click on a question to get a quick answer and access more detailed information."}
              </div>
            </div>

            <FAQAccordion questions={questions} />

            {get('faq_section', 'subtitle') && (
              <span className="block text-base font-normal text-center capitalize font-proxima text-dark">
                {get('faq_section', 'subtitle')?.description || 'Seeking More Answers?'}
              </span>
            )}

            {get('faq_section', 'button') && (
              <div className="flex justify-center mt-6 px-4">
                <Link href={get('faq_section', 'button')?.link_url || '/questions'} className="component-button style-primary w-full sm:w-auto text-center">
                  <span>{get('faq_section', 'button')?.link_text || 'Visit Top Questions'}</span>
                </Link>
              </div>
            )}
          </div>
        </section>

      </main>
      <TagDisplayServer contentType="page" contentId="home" />
      <Footer />
    </>
  )
}
