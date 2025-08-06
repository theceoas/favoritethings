"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Percent, Gift } from "lucide-react"

export function DiscountPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 z-30"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-2xl p-6 max-w-sm border border-yellow-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Gift className="w-6 h-6 text-black" />
                <h3 className="font-bold text-black text-lg">Special Offer!</h3>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-black/10 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Percent className="w-5 h-5 text-black" />
                <span className="text-black font-semibold text-2xl">20% OFF</span>
              </div>
              <p className="text-black/80 text-sm">
                Get 20% off your first order when you sign up for our newsletter!
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button className="bg-black text-yellow-400 hover:bg-black/80 flex-1 text-sm font-semibold">
                Sign Up
              </Button>
              <Button 
                variant="outline" 
                className="border-black text-black hover:bg-black/10 text-sm"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 