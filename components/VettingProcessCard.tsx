'use client'

interface VettingProcessCardProps {
  bgCondition: string
  textCondition: string
}

export default function VettingProcessCard({ bgCondition, textCondition }: VettingProcessCardProps) {
  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-0 max-w-[450px] lg:max-w-none w-full lawyer-card-pack flex flex-col h-full law-firmscard vetting-process bg-white rounded-lg p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col h-full">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-serif text-bluish mb-2 font-normal">
            Our Vetting Process:
          </h2>
          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-serif italic text-primary font-normal">
            Ensuring Only the Best
          </h3>
        </div>
        <ul className="space-y-3 lg:space-y-4 flex-1 list-disc pl-6 lg:pl-8 text-left">
          <li className="text-black font-proxima text-sm lg:text-base">
            We do the hard work of selecting only the best.
          </li>
          <li className="text-black font-proxima text-sm lg:text-base">
            Featured firms are leaders in family law, proven in their field.
          </li>
          <li className="text-black font-proxima text-sm lg:text-base">
            These lawyers helped create this educational content library.
          </li>
        </ul>
      </div>
    </div>
  )
}

