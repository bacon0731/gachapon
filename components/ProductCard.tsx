'use client'

import Link from 'next/link'
import Image from 'next/image'

interface ProductCardProps {
  id: string
  name: string
  image: string
  price: number
  description?: string
  remaining?: number
  isHot?: boolean
}

export default function ProductCard({
  id,
  name,
  image,
  price,
  description,
  remaining,
  isHot = false,
}: ProductCardProps) {
  return (
    <Link href={`/shop/${id}`}>
      <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        <div className="relative w-full aspect-square flex-shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
          {isHot && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              熱賣中
            </div>
          )}
          {remaining !== undefined && remaining < 10 && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              剩餘 {remaining} 件
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-base font-semibold text-neutral-900 mb-2 line-clamp-2 min-h-[2.5rem]">{name}</h3>
          {description && (
            <p className="text-sm text-neutral-500 mb-3 line-clamp-2 flex-grow">{description}</p>
          )}
          <div className="flex justify-between items-center mt-auto">
            <span className="text-xl font-bold text-primary">NT$ {price}</span>
            <button className="px-3 py-1.5 bg-accent text-white rounded-full hover:bg-accent-dark transition-colors text-xs font-medium whitespace-nowrap">
              查看賞項
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

