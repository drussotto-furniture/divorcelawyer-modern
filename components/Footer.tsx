import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="main-footer">
      {/* Logo Bar */}
      <div className="footer-logo-wrapper bg-warmbeige">
        <div className="footer-logo">
          <Link href="/" className="block m-auto text-center w-max">
            <Image 
              src="/images/Footrlogo.png" 
              alt="DivorceLawyer.com" 
              width={285} 
              height={60}
              className="footer-logo-img"
            />
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-inner-content-wrapper bg-bluish">
        <div className="container container-footer">
          <div className="flex flex-col lg:flex-row">
            {/* Newsletter Section */}
            <div className="m-auto lg:mr-2 lg:ml-0 footer-content-box basis-full lg:basis-4/12">
              <h2>
                <div className="component-rich-text">
                  Stay in the <span>Know</span>
                </div>
              </h2>
              <div className="short-description">
                <div className="component-rich-text">
                  Sign up for DivorceLawyer's newsletter and join a network that empowers those navigating divorce. Stay informed with valuable resources to stride forward confidently on your journey.
                </div>
              </div>
              <div className="footer-newsletter">
                <form className="newsletter-form">
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    className="newsletter-input"
                    required
                  />
                  <button type="submit" className="newsletter-submit">
                    Sign Up
                  </button>
                </form>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="m-auto mt-0 lg:ml-2 lg:mt-11 lg:mr-0 basis-full lg:basis-8/12 footer-navigation-widget">
              <div className="flex flex-col justify-center lg:justify-end lg:flex-row lg:gap-16">
                {/* Learn */}
                <div className="single-menu-widget">
                  <h2>Learn</h2>
                  <ul>
                    <li><Link href="/learning-center">Learning Center</Link></li>
                    <li><Link href="/learning-center/categories">Divorce Categories</Link></li>
                    <li><Link href="/learning-center/top-divorce-questions">Top Questions</Link></li>
                    <li><Link href="/learning-center/stages-of-divorce">Stages Of Divorce</Link></li>
                    <li><Link href="/learning-center/emotions">Emotional Path</Link></li>
                    <li><Link href="/learning-center/real-voices">Real Voices</Link></li>
                  </ul>
                </div>

                {/* Connect */}
                <div className="single-menu-widget">
                  <h2>Connect</h2>
                  <ul>
                    <li><Link href="/connect-with-lawyer">Find a Divorce Lawyer</Link></li>
                    <li><Link href="/locations">Search by State</Link></li>
                    <li><Link href="/top-cities">Top Cities</Link></li>
                    <li><Link href="/vetting-process">Vetting Process</Link></li>
                  </ul>
                </div>

                {/* About */}
                <div className="single-menu-widget">
                  <h2>About</h2>
                  <ul>
                    <li><Link href="/about-us">About Us</Link></li>
                    <li><Link href="/about-us/meet-the-team">Meet the Team</Link></li>
                    <li><Link href="/about-us/company-faq">Company FAQ</Link></li>
                    <li><Link href="/about-us/news-and-press">News and Press</Link></li>
                    <li><Link href="/councils">Councils</Link></li>
                    <li><Link href="/for-lawyers" className="font-bold">For Lawyers</Link></li>
                    <li><Link href="/claim-profile" className="font-bold">Claim Your Profile</Link></li>
                    <li><Link href="/contact">Contact Us</Link></li>
                  </ul>
                </div>

                {/* Social */}
                <div className="single-menu-widget socail-widget">
                  <h2>Social</h2>
                  <ul>
                    <li>
                      <a href="https://facebook.com/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">📘</span> Facebook
                      </a>
                    </li>
                    <li>
                      <a href="https://instagram.com/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">📷</span> Instagram
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">🐦</span> Twitter
                      </a>
                    </li>
                    <li>
                      <a href="https://linkedin.com/company/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">💼</span> LinkedIn
                      </a>
                    </li>
                    <li>
                      <a href="https://youtube.com/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">▶️</span> YouTube
                      </a>
                    </li>
                    <li>
                      <a href="https://spotify.com/divorcelawyer" target="_blank" rel="noopener noreferrer">
                        <span className="social-icon">🎵</span> Spotify
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="footer-copyright bg-bluishlight">
        <div className="container">
          <div className="component-rich-text">
            DivorceLawyer.com @ {currentYear}. All Rights Reserved.
          </div>
          <div className="single-menu-widget">
            <ul className="copyright-nav">
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/cookies-policy">Cookies Policy</Link></li>
              <li><Link href="/terms-conditions">Terms & Conditions</Link></li>
              <li><Link href="/accessibility">Accessibility Statement</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
