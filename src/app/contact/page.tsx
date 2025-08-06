'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import CartButton from '@/components/CartButton'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setShowSuccess(true)
    setIsSubmitting(false)
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })

    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-32 right-32 w-24 h-24 bg-black/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 right-20 w-16 h-16 bg-yellow-400/30 rounded-full blur-lg"
        />
      </div>

      {/* Floating Cart Button */}
      <CartButton variant="floating" size="lg" />

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-8 pb-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex justify-start mb-8"
              >
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Home
                </Link>
              </motion.div>

              {/* Brand Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-full mb-8 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">Favorite Things</span>
                <Sparkles className="w-4 h-4" />
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6"
              >
                Get in Touch
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
        >
          
          {/* Contact Information Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="text-center p-8 rounded-2xl bg-white shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Call Us</h3>
              <p className="text-gray-600 mb-3">+234 (0) 80 1234 5678</p>
              <p className="text-gray-600 mb-3">+234 (0) 70 9876 5432</p>
              <p className="text-sm text-gray-500 mt-3">Mon - Fri, 9AM - 6PM</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="text-center p-8 rounded-2xl bg-white shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Us</h3>
              <p className="text-gray-600 mb-3">hello@bedznbuttunz.com</p>
              <p className="text-gray-600 mb-3">support@bedznbuttunz.com</p>
              <p className="text-sm text-gray-500 mt-3">We reply within 24 hours</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="text-center p-8 rounded-2xl bg-white shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Visit Us</h3>
              <p className="text-gray-600 mb-3">123 Fashion Street</p>
              <p className="text-gray-600 mb-3">Lagos, Nigeria</p>
              <p className="text-sm text-gray-500 mt-3">By appointment only</p>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white rounded-3xl shadow-xl border border-yellow-200 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send us a Message</h2>
              
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
                >
                  <p className="text-green-800 text-center">
                    Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="+234 80 1234 5678"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Status</option>
                      <option value="support">Customer Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-4 px-8 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 