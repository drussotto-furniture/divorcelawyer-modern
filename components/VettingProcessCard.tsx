'use client'

interface VettingProcessCardProps {
  bgCondition: string
  textCondition: string
}

export default function VettingProcessCard({ bgCondition, textCondition }: VettingProcessCardProps) {
  return (
    <div className={`flex-1 min-w-0 max-w-[450px] lg:max-w-none w-full mb-3 lawyer-card-pack flex flex-col lg:h-full law-firmscard vetting-process ${bgCondition}`}>
      <div className="flex flex-col lg:flex-row">
        <h2>
          Our Vetting Process: <span>Ensuring Only the Best</span>
        </h2>
        <ul>
          <li className={textCondition}>
            We do the hard work of selecting only the best.
          </li>
          <li className={textCondition}>
            Featured firms are leaders in family law, proven in their field.
          </li>
          <li className={textCondition}>
            These lawyers helped create this educational content library.
          </li>
        </ul>
      </div>
    </div>
  )
}

