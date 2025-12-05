'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LawyerImageWithBlur } from './LawyerImageWithBlur'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Award, 
  GraduationCap, 
  Scale, 
  Clock,
  CheckCircle2,
  Star,
  Play,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LawyerProfileClientProps {
  lawyer: any
}

export default function LawyerProfileClient({ lawyer }: LawyerProfileClientProps) {
  const [videoPlaying, setVideoPlaying] = useState(false)
  
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`
  const firm = lawyer.law_firms as any
  const firmName = firm?.name || ''
  const phoneNumber = (lawyer as any).phone_number || firm?.phone_number || lawyer.phone || ''
  const email = lawyer.email || firm?.email || ''
  const website = lawyer.website || firm?.website || ''
  const videoUrl = lawyer.video_url || ''
  const photoUrl = lawyer.photo_url || ''
  const bio = lawyer.bio || ''
  const title = lawyer.title || ''
  const yearsExperience = lawyer.years_experience || 0
  
  // Debug: Log video URL in development
  if (process.env.NODE_ENV === 'development' && videoUrl) {
    console.log('Video URL found:', videoUrl)
  }
  const specializations = Array.isArray(lawyer.specializations) ? lawyer.specializations : []
  const education = Array.isArray(lawyer.education) ? lawyer.education : []
  const barAdmissions = Array.isArray(lawyer.bar_admissions) ? lawyer.bar_admissions : []
  const awards = Array.isArray(lawyer.awards) ? lawyer.awards : []
  const languages = Array.isArray(lawyer.languages) ? lawyer.languages : []
  const professionalMemberships = Array.isArray(lawyer.professional_memberships) ? lawyer.professional_memberships : []
  const certifications = Array.isArray(lawyer.certifications) ? lawyer.certifications : []
  const publications = Array.isArray(lawyer.publications) ? lawyer.publications : []
  const approach = lawyer.approach || ''
  const practiceFocus = lawyer.practice_focus || ''
  const favoriteQuote = lawyer.favorite_quote || ''
  const officeHours = lawyer.office_hours || ''
  const officeAddress = lawyer.office_address || ''
  const consultationFee = lawyer.consultation_fee || ''
  const acceptsNewClients = lawyer.accepts_new_clients !== undefined ? lawyer.accepts_new_clients : true

  // Extract YouTube/Vimeo video ID or use embed URL as-is
  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null
    
    // If already a Vimeo embed URL, use it as-is (preserve all parameters)
    if (url.includes('player.vimeo.com/video/')) {
      return url
    }
    
    // If already a YouTube embed URL, use it as-is
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/embed/')) {
      return url
    }
    
    // Parse regular YouTube URLs
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`
    }
    
    // Parse regular Vimeo URLs
    const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    }
    
    return null
  }

  // Get video thumbnail URL for preview (frame at 1 second)
  const getVideoThumbnail = (url: string) => {
    if (!url) return null
    
    // Extract Vimeo video ID
    const vimeoEmbedMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/)
    const vimeoMatch = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
    if (vimeoEmbedMatch || vimeoMatch) {
      const videoId = vimeoEmbedMatch ? vimeoEmbedMatch[1] : vimeoMatch![1]
      // Use a service that can extract frames at specific times
      // Try vumbnail with time parameter, or use Vimeo's thumbnail CDN
      // For frame at 1 second, we can use: https://vumbnail.com/{video_id}.jpg?time=1
      // Or try: https://i.vimeocdn.com/video/{video_id}_640.jpg (default thumbnail)
      // For now, try vumbnail with time parameter
      return `https://vumbnail.com/${videoId}.jpg?time=1`
    }
    
    // Extract YouTube video ID
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    if (youtubeMatch) {
      const videoId = youtubeMatch[1]
      // YouTube thumbnails don't support time, but maxresdefault is usually a good frame
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
    
    return null
  }

  const videoEmbedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null
  const videoThumbnail = videoUrl ? getVideoThumbnail(videoUrl) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Above the fold */}
      <section className="relative bg-gradient-to-b from-bluish via-bluish/95 to-background pt-24 lg:pt-32 pb-16 lg:pb-24 px-4 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="space-y-6">
            {/* Header Section - Name, Title, Firm */}
            <div className="text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif text-white mb-2 leading-tight">
                    {fullName}
                  </h1>
                  {title && (
                    <p className="text-xl lg:text-2xl text-white/90 font-medium mb-3">
                      {title}
                    </p>
                  )}
                  {firmName && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-white/80 mb-3">
                      <Scale className="h-5 w-5" />
                      <Link 
                        href={firm.slug ? `/law-firms/${firm.slug}` : '#'}
                        className="hover:text-white transition-colors font-medium"
                      >
                        {firmName}
                      </Link>
                    </div>
                  )}
                </div>
                {yearsExperience > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="bg-primary text-primary-foreground text-lg px-4 py-2 h-auto mx-auto lg:mx-0"
                  >
                    {yearsExperience}+ Years
                  </Badge>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {acceptsNewClients && (
                  <div className="flex items-center gap-2 text-white/90">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Accepting New Clients</span>
                  </div>
                )}
                {consultationFee && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Consultation: {consultationFee}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Photo, Bio, and Video Section */}
            {photoUrl && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {/* Left Column - Photo */}
                <div className="w-full">
                  <Card className="overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm h-full">
                    <div className="relative aspect-[3/4] w-full">
                      <LawyerImageWithBlur
                        src={photoUrl}
                        alt={fullName}
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                  </Card>
                </div>

                {/* Right Column - Bio and Video */}
                <div className="flex flex-col h-full">
                  {/* Bio - Top Justified, expands to fill space */}
                  {bio && (
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl mb-4 flex-grow flex flex-col">
                      <CardHeader className="pb-3 flex-shrink-0">
                        <CardTitle className="text-white text-2xl">About {lawyer.first_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 flex-grow">
                        <p className="text-white/90 leading-relaxed text-lg whitespace-pre-line">
                          {bio}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Video - Bottom Aligned with Photo */}
                  {videoEmbedUrl && (
                    <Card className="overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm mt-auto">
                      <div className="relative aspect-video w-full bg-black/50">
                        {!videoPlaying ? (
                          <>
                            {/* Video Preview - Show frame at 1 second using iframe paused */}
                            {(() => {
                              // For Vimeo, create preview URL paused at 1 second
                              if (videoEmbedUrl.includes('player.vimeo.com/video/')) {
                                const separator = videoEmbedUrl.includes('?') ? '&' : '?'
                                const previewUrl = `${videoEmbedUrl}${separator}autopause=1&muted=1&background=1&autoplay=0&loop=0&t=1s`
                                return (
                                  <>
                                    <iframe
                                      src={previewUrl}
                                      className="absolute inset-0 w-full h-full"
                                      allow="autoplay; encrypted-media"
                                      allowFullScreen
                                      style={{ pointerEvents: 'none' }}
                                    />
                                    {/* Overlay to capture clicks */}
                                    <div className="absolute inset-0 z-10" onClick={() => setVideoPlaying(true)} />
                                  </>
                                )
                              }
                              // For YouTube or fallback, use thumbnail
                              return (
                                <>
                                  {videoThumbnail && (
                                    <div 
                                      className="absolute inset-0 bg-cover bg-center"
                                      style={{ backgroundImage: `url(${videoThumbnail})` }}
                                    >
                                      <div className="absolute inset-0 bg-black/20"></div>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                              <Button
                                onClick={() => setVideoPlaying(true)}
                                size="lg"
                                className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 shadow-2xl backdrop-blur-sm pointer-events-auto"
                              >
                                <Play className="h-10 w-10 ml-1" fill="currentColor" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <iframe
                            src={videoEmbedUrl}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* If no photo, show bio and video stacked */}
            {!photoUrl && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {bio && (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-white text-2xl">About {lawyer.first_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/90 leading-relaxed text-lg whitespace-pre-line">
                        {bio}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {videoEmbedUrl && (
                  <Card className="overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm">
                    <div className="relative aspect-video w-full bg-black/50">
                      {!videoPlaying ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            onClick={() => setVideoPlaying(true)}
                            size="lg"
                            className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 shadow-2xl"
                          >
                            <Play className="h-10 w-10 ml-1" fill="currentColor" />
                          </Button>
                        </div>
                      ) : (
                        <iframe
                          src={videoEmbedUrl}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {phoneNumber && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex-1"
                >
                  <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="flex items-center justify-center gap-2">
                    <Phone className="h-5 w-5" />
                    Call Now
                  </a>
                </Button>
              )}
              {email && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex-1"
                >
                  <a href={`mailto:${email}`} className="flex items-center justify-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-12">
              {/* Practice Areas */}
              {specializations.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish flex items-center gap-3">
                      <Scale className="h-8 w-8 text-primary" />
                      Practice Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {specializations.map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-base px-4 py-2">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Practice Focus */}
              {practiceFocus && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish">Practice Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                      {practiceFocus}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Approach */}
              {approach && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish">My Approach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                      {approach}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish flex items-center gap-3">
                      <GraduationCap className="h-8 w-8 text-primary" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {education.map((edu: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                          <span className="text-muted-foreground text-lg">{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Bar Admissions */}
              {barAdmissions.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish flex items-center gap-3">
                      <Scale className="h-8 w-8 text-primary" />
                      Bar Admissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {barAdmissions.map((state: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-base px-4 py-2 border-2">
                          {state}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish flex items-center gap-3">
                      <Award className="h-8 w-8 text-primary" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {certifications.map((cert: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-lg">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Awards */}
              {awards.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish flex items-center gap-3">
                      <Award className="h-8 w-8 text-primary" />
                      Awards & Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {awards.map((award: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Star className="h-6 w-6 text-primary flex-shrink-0 mt-0.5 fill-primary" />
                          <span className="text-muted-foreground text-lg">{award}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Professional Memberships */}
              {professionalMemberships.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish">Professional Memberships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {professionalMemberships.map((membership: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                          <span className="text-muted-foreground text-lg">{membership}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Publications */}
              {publications.length > 0 && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-800">
                  <CardHeader>
                    <CardTitle className="text-3xl font-serif text-bluish">Publications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {publications.map((pub: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                          <span className="text-muted-foreground text-lg">{pub}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Favorite Quote */}
              {favoriteQuote && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-900">
                  <CardContent className="pt-6">
                    <blockquote className="text-2xl font-serif text-bluish italic text-center leading-relaxed">
                      "{favoriteQuote}"
                    </blockquote>
                    <p className="text-center text-muted-foreground mt-4">— {fullName}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Card - Sticky */}
              <div className="lg:sticky lg:top-24">
                <Card className="shadow-2xl border-2 border-primary/20">
                  <CardHeader className="bg-gradient-to-br from-bluish to-bluish/90 text-white">
                    <CardTitle className="text-2xl font-serif">Contact {lawyer.first_name}</CardTitle>
                    <CardDescription className="text-white/90">
                      Get in touch today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {phoneNumber && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <a 
                            href={`tel:${phoneNumber.replace(/\D/g, '')}`}
                            className="text-bluish font-semibold hover:text-primary transition-colors"
                          >
                            {phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}

                    {email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a 
                            href={`mailto:${email}`}
                            className="text-bluish font-semibold hover:text-primary transition-colors break-all"
                          >
                            {email}
                          </a>
                        </div>
                      </div>
                    )}

                    {website && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Website</p>
                          <a 
                            href={website.startsWith('http') ? website : `https://${website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-bluish font-semibold hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {officeAddress && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 mt-1">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Office</p>
                          <p className="text-bluish font-medium whitespace-pre-line">
                            {officeAddress}
                          </p>
                        </div>
                      </div>
                    )}

                    {officeHours && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 mt-1">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Office Hours</p>
                          <p className="text-bluish font-medium whitespace-pre-line">
                            {officeHours}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      {phoneNumber && (
                        <Button
                          asChild
                          className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                          size="lg"
                        >
                          <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="flex items-center justify-center gap-2">
                            <Phone className="h-5 w-5" />
                            Call Now
                          </a>
                        </Button>
                      )}
                      {email && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full rounded-full border-2 hover:bg-accent"
                          size="lg"
                        >
                          <a href={`mailto:${email}`} className="flex items-center justify-center gap-2">
                            <Mail className="h-5 w-5" />
                            Send Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Languages */}
                {languages.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-bluish">Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-sm">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

