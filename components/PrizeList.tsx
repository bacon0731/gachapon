import Image from 'next/image'
import { getPrizeLevelColor } from '@/utils/prizeColors'

interface Prize {
  id: string
  name: string
  image: string
  level: string
  remaining: number
  probability?: number
}

interface PrizeListProps {
  prizes: Prize[]
}

export default function PrizeList({ prizes }: PrizeListProps) {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {prizes.map((prize) => (
        <div
          key={prize.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="relative w-full h-32">
            <Image
              src={prize.image}
              alt={prize.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {(() => {
              const colors = getPrizeLevelColor(prize.level)
              return (
                <div className={`absolute top-0 left-0 ${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold`}>
                  {prize.level}
                </div>
              )
            })()}
            {prize.remaining === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-sm font-bold">已售完</span>
              </div>
            )}
          </div>
          <div className="p-2">
            <h4 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2">{prize.name}</h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">
                剩餘: <span className="font-bold text-primary">{prize.remaining}</span>
              </span>
              {prize.probability && (
                <span className="text-neutral-500">
                  <span className="font-bold">{prize.probability}%</span>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

