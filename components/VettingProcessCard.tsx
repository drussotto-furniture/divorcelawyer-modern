'use client'

interface VettingProcessCardProps {
  bgCondition: string
  textCondition: string
}

export default function VettingProcessCard({ bgCondition, textCondition }: VettingProcessCardProps) {
  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-0 max-w-[450px] lg:max-w-none w-full lawyer-card-pack flex flex-col lg:h-full law-firmscard vetting-process bg-seashell rounded-lg p-6 lg:p-8">
      <div className="flex flex-col h-full">
        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-serif text-bluish mb-2">
          Our Vetting Process:
        </h2>
        <h3 className="text-2xl lg:text-3xl xl:text-4xl font-serif italic text-primary mb-6 lg:mb-8">
          Ensuring Only the Best
        </h3>
        <ul className="space-y-4 flex-1">
          <li className="flex items-start gap-3 text-bluish font-proxima text-base lg:text-lg">
            <span className="text-primary text-xl lg:text-2xl mt-1">•</span>
            <span>We do the hard work of selecting only the best.</span>
          </li>
          <li className="flex items-start gap-3 text-bluish font-proxima text-base lg:text-lg">
            <span className="text-primary text-xl lg:text-2xl mt-1">•</span>
            <span>Featured firms are leaders in family law, proven in their field.</span>
          </li>
          <li className="flex items-start gap-3 text-bluish font-proxima text-base lg:text-lg">
            <span className="text-primary text-xl lg:text-2xl mt-1">•</span>
            <span>These lawyers helped create this educational content library.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

