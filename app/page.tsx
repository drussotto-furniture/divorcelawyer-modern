import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section - HeroComponentSecondary */}
        <section className="block-hero-component-secondary bg-bluish relative column-layout">
          <div className="mx-auto container-fluid">
            <div className="flex flex-col h-full mx-auto lg:flex-row block-container container-size-medium content-middle">
              {/* Text Content */}
              <div className="relative z-10 pb-11 lg:pb-0 flex flex-col items-start justify-start text-center lg:text-left hero-content-wrapper basis-1/2">
                <h1 className="title font-proxima">
                  {get('hero', 'title')?.title || 'The Best Divorce Lawyers and Expert Resources'}
                </h1>
                <h2 className="subtitle">
                  <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('hero', 'subtitle')?.subtitle || 'Go your <span>own</span> way' }} />
                </h2>
                <div className="component-rich-text">
                  {get('hero', 'description')?.description || "We're your go-to source for all things divorce. From a comprehensive learning portal to vetted divorce specialists in your area, we make sure you have everything you need to move forward with confidence."}
                </div>
                
                <div className="flex flex-col gap-0 pb-0 mx-auto text-center lg:gap-5 lg:mx-0 lg:pb-0 lg:text-left lg:flex-row hero-menu-list">
                  {get('hero', 'cta_find_lawyer') && (
                    <Link href={get('hero', 'cta_find_lawyer')?.link_url || '/connect-with-lawyer'} className="component-button style-primary mt-6 lg:mt-0">
                      <span>{get('hero', 'cta_find_lawyer')?.link_text || 'Find a Lawyer'}</span>
                    </Link>
                  )}
                  {get('hero', 'cta_learn') && (
                    <Link href={get('hero', 'cta_learn')?.link_url || '/learning-center'} className="component-button style-secondary mt-6 lg:mt-0">
                      <span>{get('hero', 'cta_learn')?.link_text || 'Learn'}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Image */}
              <div className="flex dls-home-hero-image-wrapper lg:hidden basis-1/2">
                <div className="hero-image">
                  <Image
                    src={get('hero', 'mobile_image')?.image_url || '/media/NewLife-DivorceLawyer.webp'}
                    alt="New Life"
                    width={600}
                    height={600}
                    className="w-full h-auto"
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
        <ThreePackComponent 
          lawFirms={lawFirms as any}
          city={defaultCityDisplay}
          stateCode={defaultStateCode}
          backgroundColor="bg-bluish"
        />

        {/* Most Popular Reads */}
        <MostPopularReads
          featuredArticle={articles[0]}
          subArticles={articles.slice(1, 3)}
          listArticles={articles.slice(3, 9)}
          backgroundColor="bg-white"
        />

        {/* Stages of Divorce */}
        <section id="stages" className="block-stages block-spacing spacing-top-none spacing-bottom-none bg-subtlesand px-0 lg:px-8">
          <div className="bg-subtlesand block-container mx-auto container-size-medium">
            <div className="container flex flex-col justify-between h-auto gap-10 px-0 pb-3 items-left lg:items-center xl:gap-12">
              <div className="px-5 text-center text-container slideup">
                <h2>
                  <div className="component-rich-text text-left lg:text-center lg:mx-auto" dangerouslySetInnerHTML={{ __html: get('stages_section', 'title')?.title || '<span>Stages</span> of Divorce' }} />
                </h2>
                <div className="component-rich-text max-w-screen-lg text-left lg:text-center lg:mx-auto">
                  {get('stages_section', 'description')?.description || "Divorce can feel like a rollercoaster ride, full of ups and downs. To make it easier, sometimes it's best to break down the process into distinct stages, each with its unique characteristics and challenges. Click on a stage to explore articles and videos that can provide insight and support for your journey."}
                </div>
              </div>

              <div className="mx-0 xl:mx-3 stages-container slideup">
                <div className="flex flex-row flex-wrap text-left xl:flex-nowrap xl:gap-x-16">
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex flex-row items-center w-full gap-5 px-5 py-5 xl:w-auto xl:items-start xl:gap-4 xl:py-0 xl:flex-col xl:basis-auto md:px-6 stage-item"
                    >
                      <div className="w-12 min-w-12 flex justify-start">
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
                      <div className="text-left">
                        <h5 className="mb-1 md:mb-4 font-proxima">
                          <Link
                            href={`/stages/${stage.slug}`}
                            className="italic font-semibold tracking-tight font-proxima"
                          >
                            {stage.name}
                          </Link>
                        </h5>
                        {stage.description && (
                          <div className="component-rich-text text-left">
                            {stage.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {get('stages_section', 'button') && (
                <div className="hidden md:flex slideup">
                  <Link
                    href={get('stages_section', 'button')?.link_url || '/stages'}
                    className="component-button style-primary"
                  >
                    <span>{get('stages_section', 'button')?.link_text || 'Learn More about the Stages of Divorce'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Emotional Path */}
        <section id="emotions" className="block-emotions block-spacing spacing-top-normal spacing-bottom-normal py-10 px-5 lg:px-8 bg-seashell section-style-boxed">
          <div className="block-container container-dark slideup mx-auto container-size-medium py-16 md:py-24">
            <div className="container flex flex-col justify-center text-left align-middle xl:text-center min-h-96">
              <h2>
                <div className="component-rich-text text-center" dangerouslySetInnerHTML={{ __html: get('emotions_section', 'title')?.title || 'The <span>Emotional</span> Path Through Divorce' }} />
              </h2>
              <div className="component-rich-text max-w-6xl mx-auto text-left xl:text-center lg:px-7">
                {get('emotions_section', 'description')?.description || "A divorce is a major life change, and it's natural to experience a range of intense emotions along the way. Whether you're thinking about divorce or already in the middle of it, we're here to help navigate through it. Click on an emotion to explore and understand the feelings you may be experiencing."}
              </div>

              <div className="mx-0 xl:mx-3 emotions-list slideup">
                <ul className="flex flex-row flex-wrap max-w-screen-lg gap-0 py-16 mx-auto align-middle justify-evenly md:justify-center gap-y-4 lg:gap-10 lg:flex-nowrap">
                  {emotions.map((emotion) => (
                    <li key={emotion.id} className="text-center basis-6/12 md:basis-0">
                      <Link
                        href={`/emotions/${emotion.slug}`}
                        className="px-8 py-4 text-white transition-all rounded-full lg:px-6 lg:py-3 font-proxima bg-greenShadesLight hover:text-black hover:bg-primary"
                      >
                        {emotion.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {get('emotions_section', 'button') && (
                <div className="flex justify-center slideup">
                  <Link
                    href={get('emotions_section', 'button')?.link_url || '/emotions'}
                    className="component-button style-primary"
                  >
                    <span>{get('emotions_section', 'button')?.link_text || 'Explore Emotions Along the Process'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Real Voices */}
        <section id="real-voices" className="block-real-voices block-spacing spacing-top-none spacing-bottom-large bg-subtlesand">
          <div className="block-container mx-auto slideup container-size-small">
            <h2>
              <div className="component-rich-text text-center" dangerouslySetInnerHTML={{ __html: get('real_voices_section', 'title')?.title || 'Real Voices:<br/><span>Coffee Talk</span>' }} />
            </h2>
            <div className="component-rich-text max-w-screen-lg mx-auto mb-6 text-center">
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
              <div className="flex justify-center mt-10">
                <Link
                  href={get('real_voices_section', 'button')?.link_url || '/real-voices'}
                  className="component-button style-primary"
                >
                  <span>{get('real_voices_section', 'button')?.link_text || 'Explore Real Voices'}</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Get Informed Categories */}
        <section id="categories" className="block-categories block-spacing spacing-top-normal spacing-bottom-normal z-10 relative bg-white px-5 py-10 lg:px-8">
          <div className="relative bg-white block-container mx-auto container-size-medium">
            <div className="slideup">
              <div className="px-5 pr-0 text-center slideup">
                <h2>
                  <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('categories_section', 'title')?.title || 'Get Informed.<br/>Get <span>Empowered.</span>' }} />
                </h2>
                <div className="component-rich-text max-w-screen-lg mx-auto text-center">
                  {get('categories_section', 'description')?.description || 'Read up on essential divorce topics to learn more about the process and all its different aspects.'}
                </div>
              </div>

              <div className="py-10 category-block slideup">
                <ul className="flex flex-row flex-wrap justify-center w-full gap-0 p-0 mx-auto lg:flex-nowrap">
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
                <div className="flex justify-center slideup">
                  <Link
                    href={get('categories_section', 'button')?.link_url || '/learning-center/categories'}
                    className="component-button style-primary min-w-64"
                  >
                    <span>{get('categories_section', 'button')?.link_text || 'Browse Categories'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Connect CTA */}
        <section className="block-connect-with-lawyer block-spacing spacing-top-none spacing-bottom-none section-dark lg:px-10 xl:px-10 md:px-4 sm:px-4 px-4">
          <div className="pack-component block-container rounded-3xl slideup container-size-medium bg-bluish">
            <div className="flex flex-col align-center lg:flex-row">
              <div className="w-full px-5 py-10 text-center lg:text-left lg:px-20 md:flex-col sm:w-full md:w-full lg:w-8/12 xl:w-8/12 left-pan">
                <h2 className="p-0 m-0 font-medium uppercase">
                  {get('connect_cta', 'title')?.title || 'Introductions, no pressure'}
                </h2>
                <h3>
                  <div className="component-rich-text">
                    {get('connect_cta', 'subtitle')?.subtitle || 'Connect with a Top Divorce Attorney'}
                  </div>
                </h3>
                <p className="mt-10 mb-4 text-sm font-light location-tagline">
                  {get('connect_cta', 'description')?.description || 'Are you in a different location? We can introduce you to the best family lawyers in your area.'}
                </p>
                <div className="w-full max-w-full lg:max-w-xl">
                  <form className="newsletter-form mt-2">
                    <input 
                      type="text" 
                      className="search-field"
                      placeholder={get('connect_cta', 'placeholder')?.description || 'Type your city or zipcode.'}
                    />
                    <button
                      type="submit"
                      className="submit-button"
                    >
                      {get('connect_cta', 'button')?.link_text || 'Find a Lawyer'}
                    </button>
                  </form>
                </div>
              </div>
              <div className="w-full sm:w-full md:w-full lg:w-4/12 xl:w-4/12">
                <div className="w-full h-full rounded-2xl image-fit">
                  <Image
                    src={get('connect_cta', 'image')?.image_url || '/media/connect-with-vetted-lawyer.png'}
                    alt="Connect with lawyer"
                    width={400}
                    height={500}
                    className="max-w-3xl rounded-3xl h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Common Questions */}
        <section id="faq" className="block-common-questions block-spacing spacing-top-none spacing-bottom-none bg-white px-5 lg:px-8">
          <div className="mx-auto block-container bg-white container-size-medium">
            <h2>
              <div className="component-rich-text" dangerouslySetInnerHTML={{ __html: get('faq_section', 'title')?.title || 'Common <span>Questions</span>' }} />
            </h2>
            <div className="short-description">
              <div className="component-rich-text text-center max-w-4xl mx-auto">
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
              <div className="flex justify-center mt-3.5">
                <Link href={get('faq_section', 'button')?.link_url || '/questions'} className="component-button style-primary">
                  <span>{get('faq_section', 'button')?.link_text || 'Visit Top Questions'}</span>
                </Link>
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
