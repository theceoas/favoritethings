"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { User, LogIn, UserPlus } from "lucide-react"

export function AuthButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    // Add login logic here
    console.log("Login clicked")
  }

  const handleSignup = () => {
    // Add signup logic here
    console.log("Signup clicked")
  }

  const handleProfile = () => {
    // Add profile logic here
    console.log("Profile clicked")
  }

  return (
    <div className="flex space-x-2">
      {isLoggedIn ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
        >
          <Button
            onClick={handleProfile}
            className="bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg border border-gray-200"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleLogin}
              variant="ghost"
              className="bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg border border-gray-200"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={handleSignup}
              className="bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          </motion.div>
        </>
      )}
    </div>
  )
} 