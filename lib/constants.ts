// Site configuration
export const SITE_NAME = 'DivorceLawyer.com'
export const SITE_DESCRIPTION = 'Connect with top divorce lawyers and access expert resources to navigate your divorce journey with confidence.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://divorcelawyer.com'

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Media
export const MEDIA_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/media`

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const ARTICLES_PER_PAGE = 12
export const LAWYERS_PER_PAGE = 15
export const CITIES_PER_PAGE = 50

// Contact
export const CONTACT_EMAIL = 'info@divorcelawyer.com'
export const CONTACT_PHONE = '' // Add if available

