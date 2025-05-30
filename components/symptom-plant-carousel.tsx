"use client"

import type React from "react"
import { useState, Children, isValidElement, cloneElement, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SymptomPlantCarouselProps {
  children: React.ReactNode
}

export function SymptomPlantCarousel({ children }: SymptomPlantCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselContentRef = useRef<HTMLDivElement>(null) // Keep ref if used for other purposes, though not strictly for width calc now
  const items = Children.toArray(children).filter(isValidElement)
  const totalItems = items.length

  useEffect(() => {
    // Reset to first slide if children change and new index is out of bounds
    if (currentIndex >= totalItems && totalItems > 0) {
      setCurrentIndex(0)
    }
  }, [totalItems, currentIndex])

  if (totalItems === 0) {
    return null
  }

  const itemWidthPercentage = 100 // Each item takes full width of its slot

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.max(0, totalItems - 1) : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === totalItems - 1 ? 0 : prevIndex + 1))
  }

  return (
    <div className="relative w-full mt-4">
      <div className="overflow-hidden" ref={carouselContentRef}>
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * itemWidthPercentage}%)` }}
        >
          {items.map((child, index) => (
            <div key={index} className="w-full flex-shrink-0 flex justify-center px-1">
              {/* The child (PlantInfoCard) will have its own max-w-xs */}
              {cloneElement(child as React.ReactElement<any>)}
            </div>
          ))}
        </div>
      </div>
      {totalItems > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 left-[-10px] md:left-[-15px] transform -translate-y-1/2 bg-white/70 hover:bg-white/90 text-earth-700 rounded-full shadow-lg z-10 p-2 h-8 w-8 md:h-10 md:w-10"
            onClick={goToPrevious}
            aria-label="Previous slide"
            disabled={currentIndex === 0} // Disable button at the start
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 right-[-10px] md:right-[-15px] transform -translate-y-1/2 bg-white/70 hover:bg-white/90 text-earth-700 rounded-full shadow-lg z-10 p-2 h-8 w-8 md:h-10 md:w-10"
            onClick={goToNext}
            aria-label="Next slide"
            disabled={currentIndex === totalItems - 1} // Disable button at the end
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </>
      )}
      {totalItems > 1 && (
        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 flex space-x-1.5 p-1 bg-white/50 rounded-full">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full ${
                currentIndex === index ? "bg-earth-600 scale-125" : "bg-earth-300 hover:bg-earth-400"
              } transition-all duration-200`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
