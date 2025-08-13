"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { DiscountPopup } from "@/components/discount-popup"
import { AuthButtons } from "@/components/auth-buttons"
import CartIcon from "@/components/CartIcon"
import ProductDetailModal from "@/components/ProductDetailModal"
import { useCartStore } from "@/lib/store/cartStore"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Home,
  Heart,
  ArrowRight,
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  Star,
  Sparkles,
  Zap,
  Package,
} from "lucide-react"

const frames = [
  {
    id: "welcome",
    title: "Welcome",
    component: "WelcomeFrame",
    color: "from-yellow-50 to-orange-50",
  },
  {
    id: "kiowa",
    title: "Kiowa",
    component: "KiowaFrame",
    color: "from-amber-50 to-yellow-100",
  },
  {
    id: "omege",
            title: "Omogebyify",
    component: "OmegeFrame",
    color: "from-red-50 to-pink-100",
  },
  {
    id: "minime",
    title: "MiniMe",
    component: "MiniMeFrame",
    color: "from-green-50 to-emerald-100",
  },
  {
    id: "others",
    title: "Others",
    component: "OthersFrame",
    color: "from-purple-50 to-pink-100",
  },
  {
    id: "shop-all",
    title: "Shop All",
    component: "ShopAllFrame",
    color: "from-blue-50 to-indigo-100",
  },
  {
    id: "footer",
    title: "Connect",
    component: "FooterFrame",
    color: "from-gray-50 to-slate-100",
  },
]

function FixedIdentityPanel({
  currentFrame,
  onNavigate,
  onPrev,
  onNext,
}: {
  currentFrame: number
  onNavigate: (index: number) => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <>
      {/* Desktop Fixed Panel */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-24 bg-gradient-to-b from-yellow-400 to-orange-400 z-50 shadow-2xl">
        <div className="flex flex-col items-center h-full py-8">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-transparent relative overflow-hidden mb-8 cursor-pointer shadow-lg flex items-center justify-center"
          >
            {/* Favorite Things Logo */}
            <img 
              src="/favorite-things-logo.svg" 
              alt="Favorite Things Logo" 
              className="w-12 h-12 object-contain"
            />
          </motion.div>

          {/* Navigation Dots */}
          <div className="flex flex-col space-y-4 mb-8">
            {frames.map((frame, index) => (
              <motion.button
                key={frame.id}
                onClick={() => onNavigate(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentFrame === index
                    ? "bg-black scale-125 shadow-lg"
                    : "bg-black/30 hover:bg-black/60"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col space-y-4 mt-auto">
            <Button
              size="sm"
              variant="ghost"
              className="text-black hover:bg-black/10 p-2 rounded-full"
            >
              <Home className="w-5 h-5" />
            </Button>
            <div className="relative">
              <CartIcon size="md" className="text-black hover:text-black/80" />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-black hover:bg-black/10 p-2 rounded-full"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>


    </>
  )
}

function WelcomeFrame() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      
      // Add null check for browser compatibility
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('show_on_homepage', true)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (error) {
        console.error('Supabase error fetching brands:', error)
        // Fallback to default brand data if fetch fails
        setBrands([
          {
            id: '1',
            name: 'Kiowa',
            slug: 'kiowa',
            preview_title: 'Kiowa',
            preview_description: 'Elegant sophistication with timeless pieces',
            preview_image_url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
            primary_color: '#F59E0B',
            is_active: true,
            show_on_homepage: true,
            sort_order: 1
          },
          {
            id: '2',
            name: 'Omogebyify',
            slug: 'omegebyify',
            preview_title: 'Omogebyify',
            preview_description: 'Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.',
            preview_image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80',
            primary_color: '#DC2626',
            is_active: true,
            show_on_homepage: true,
            sort_order: 2
          },
          {
            id: '3',
            name: 'MiniMe',
            slug: 'minime',
            preview_title: 'MiniMe',
            preview_description: 'Playful and vibrant fashion',
            preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
            primary_color: '#10B981',
            is_active: true,
            show_on_homepage: true,
            sort_order: 3
          }
        ])
      } else {
        setBrands(data || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
      // Fallback to default brand data
      setBrands([
        {
          id: '1',
          name: 'Kiowa',
          slug: 'kiowa',
          preview_title: 'Kiowa',
          preview_description: 'Elegant sophistication with timeless pieces',
          preview_image_url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
          primary_color: '#F59E0B',
          is_active: true,
          show_on_homepage: true,
          sort_order: 1
        },
        {
          id: '2',
          name: 'Omogebyify',
          slug: 'omegebyify',
          preview_title: 'Omogebyify',
          preview_description: 'Bold and contemporary fashion that pushes boundaries and celebrates individuality. Modern designs with striking aesthetics.',
          preview_image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80',
          primary_color: '#DC2626',
          is_active: true,
          show_on_homepage: true,
          sort_order: 2
        },
        {
          id: '3',
          name: 'MiniMe',
          slug: 'minime',
          preview_title: 'MiniMe',
          preview_description: 'Playful and vibrant fashion',
          preview_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
          primary_color: '#10B981',
          is_active: true,
          show_on_homepage: true,
          sort_order: 3
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative pt-16 lg:pt-0 pb-32 lg:pb-0 overflow-hidden">
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

      <div className="container mx-auto px-6 py-8 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Brand Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-full mb-8 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">Favorite Things</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-black mb-6 leading-tight">
            Discover Nigeria's
            <br />
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-yellow-500 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            >
              Favorite Fashion
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Trio
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Three distinct brands. One unified vision of contemporary Nigerian fashion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto"
          >
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.2, duration: 0.6 }}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gray-200 animate-pulse">
                    <div className="w-full h-64 bg-gray-300"></div>
                    <div className="absolute top-4 left-4 w-16 h-6 bg-gray-400 rounded"></div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="w-32 h-4 bg-gray-300 rounded mx-auto animate-pulse"></div>
                  </div>
                </motion.div>
              ))
            ) : brands.length > 0 ? (
              brands.map((brand, index) => (
                <Link key={brand.id} href={`/brands/${brand.slug}`} className="relative group cursor-pointer">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.2, duration: 0.6 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={brand.preview_image_url || `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80`}
                        alt={`${brand.preview_title || brand.name} Preview`}
                        className="w-full h-64 object-scale-down transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          // Fallback image on error
                          e.currentTarget.src = `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80`
                        }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <Badge 
                        className="absolute top-4 left-4 text-white shadow-lg"
                        style={{ backgroundColor: brand.primary_color || '#F59E0B' }}
                      >
                        {brand.preview_title || brand.name}
                      </Badge>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {brand.preview_description && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-600">{brand.preview_description}</p>
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))
            ) : (
              // Fallback when no brands available
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="col-span-3 text-center py-12"
              >
                <p className="text-gray-500 text-lg">Our brands will appear here soon!</p>
              </motion.div>
            )}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <Link href="/brands">
              <Button
                size="lg"
                className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Explore Collections
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function KiowaFrame() {
  const products = [
    {
      name: "Structured Blazer",
      price: "₦45,000",
      image: "/placeholder.svg?height=400&width=300&text=Structured+Blazer",
      rating: 4.8,
      reviews: 124,
    },
    {
      name: "Statement Dress",
      price: "₦38,000",
      image: "/placeholder.svg?height=400&width=300&text=Statement+Dress",
      rating: 4.9,
      reviews: 89,
    },
    {
      name: "Designer Bag",
      price: "₦32,000",
      image: "/placeholder.svg?height=400&width=300&text=Designer+Bag",
      rating: 4.7,
      reviews: 156,
    },
  ]

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <Badge className="bg-yellow-400 text-black mb-6 px-4 py-2 text-lg shadow-lg">
              Kiowa Collection
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Elegant
              <br />
              <span className="text-yellow-600">Sophistication</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Timeless pieces that embody grace and refinement. Each garment tells a story of
              craftsmanship and attention to detail.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-600">Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-600">Handcrafted</span>
              </div>
            </div>
            <Link href="/brands/kiowa">
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg">
                Shop Kiowa
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-semibold">
                      New
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-yellow-600">{product.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{product.reviews} reviews</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function OmegeFrame() {
  const products = [
    {
      name: "Bold Statement Dress",
      price: "₦52,000",
      image: "/placeholder.svg?height=400&width=300&text=Bold+Statement+Dress",
      rating: 4.9,
      reviews: 98,
    },
    {
      name: "Creative Blazer",
      price: "₦48,000",
      image: "/placeholder.svg?height=400&width=300&text=Creative+Blazer",
      rating: 4.8,
      reviews: 156,
    },
    {
      name: "Artistic Bag",
      price: "₦35,000",
      image: "/placeholder.svg?height=400&width=300&text=Artistic+Bag",
      rating: 4.7,
      reviews: 203,
    },
  ]

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <Badge className="bg-red-400 text-white mb-6 px-4 py-2 text-lg shadow-lg">
              Omogebyify Collection
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Bold
              <br />
              <span className="text-red-600">Expression</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Contemporary designs that push boundaries and celebrate individuality. 
              Where creativity meets comfort.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-red-400 fill-current" />
                <span className="text-sm text-gray-600">Creative Design</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-600">Express Yourself</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-600">Unique Style</span>
              </div>
            </div>
            <Link href="/brands/omogebyify">
              <Button className="bg-red-400 text-white hover:bg-red-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg">
                                  Shop Omogebyify
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-red-400 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      New
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-red-600">{product.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-red-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{product.reviews} reviews</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function MiniMeFrame() {
  const products = [
    {
      name: "Playful Dress",
      price: "₦28,000",
      image: "/placeholder.svg?height=400&width=300&text=Playful+Dress",
      rating: 4.8,
      reviews: 112,
    },
    {
      name: "Comfortable Tee",
      price: "₦15,000",
      image: "/placeholder.svg?height=400&width=300&text=Comfortable+Tee",
      rating: 4.9,
      reviews: 234,
    },
    {
      name: "Fun Backpack",
      price: "₦22,000",
      image: "/placeholder.svg?height=400&width=300&text=Fun+Backpack",
      rating: 4.7,
      reviews: 89,
    },
  ]

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <Badge className="bg-green-400 text-white mb-6 px-4 py-2 text-lg shadow-lg">
              MiniMe Collection
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Playful
              <br />
              <span className="text-green-600">Personality</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Fun, vibrant designs for the young at heart. Comfortable, stylish, 
              and perfect for everyday adventures.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-green-400 fill-current" />
                <span className="text-sm text-gray-600">Fun & Comfortable</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-600">Everyday Style</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-600">Youthful Spirit</span>
              </div>
            </div>
            <Link href="/brands/minime">
              <Button className="bg-green-400 text-white hover:bg-green-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg">
                Shop MiniMe
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 bg-green-400 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      New
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-green-600">{product.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-green-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{product.reviews} reviews</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function OthersFrame() {
  const [others, setOthers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOthers()
  }, [])

  const fetchOthers = async () => {
    try {
      const supabase = createClient()
      
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('others')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6) // Show only 6 items on the home page
      
      if (error) {
        console.error('Supabase error fetching others:', error)
        // Fallback to default data if fetch fails
        setOthers([
          {
            id: '1',
            name: 'Snacks',
            description: 'Delicious small snacks and treats',
            image_url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80',
            price: 500,
            is_active: true,
            sort_order: 1
          },
          {
            id: '2',
            name: 'Accessories',
            description: 'Fashion accessories and jewelry',
            image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
            price: 1500,
            is_active: true,
            sort_order: 2
          }
        ])
      } else {
        setOthers(data || [])
      }
    } catch (error) {
      console.error('Error fetching others:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <Badge className="bg-purple-400 text-white mb-6 px-4 py-2 text-lg shadow-lg">
            Snacks & Accessories
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Discover
            <br />
            <span className="text-purple-600">More</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our collection of delicious snacks and beautiful accessories. 
            Perfect complements to your fashion journey.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {others.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="h-64 relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                      <p className="text-sm opacity-90">{item.description}</p>
                      <p className="text-lg font-semibold mt-2">₦{item.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-12"
        >
          <Link href="/others">
            <Button className="bg-purple-400 text-white hover:bg-purple-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg">
              View All Items ({others.length} shown)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

function ShopAllFrame() {
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      const supabase = createClient()
      
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands (
            name,
            slug,
            primary_color
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12) // Show first 12 products
      
      if (error) {
        console.error('Supabase error fetching products:', error)
        setAllProducts([])
      } else {
        setAllProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { name: "Dresses", count: 45, color: "from-pink-400 to-rose-400" },
    { name: "Tops", count: 32, color: "from-blue-400 to-indigo-400" },
    { name: "Bottoms", count: 28, color: "from-green-400 to-emerald-400" },
    { name: "Accessories", count: 67, color: "from-purple-400 to-violet-400" },
    { name: "Shoes", count: 23, color: "from-orange-400 to-red-400" },
    { name: "Bags", count: 19, color: "from-yellow-400 to-orange-400" },
  ]

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <Badge className="bg-blue-400 text-white mb-6 px-4 py-2 text-lg shadow-lg">
            Shop All Collections
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Discover
            <br />
            <span className="text-blue-600">Everything</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our complete collection of fashion pieces across all three brands. 
            Find your perfect style match.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          >
            {allProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div 
                  className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative">
                    <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                      {product.featured_image ? (
                        <img
                          src={product.featured_image}
                          alt={product.title}
                          className="w-full h-full"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 space-y-1">
                      {product.is_featured && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                          <Star className="w-2 h-2 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <Badge className="bg-orange-600 text-white text-xs px-2 py-1">
                          -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                        </Badge>
                      )}
                    </div>

                    {/* Brand Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge 
                        className="text-xs px-2 py-1"
                        style={{ backgroundColor: product.brands?.primary_color || '#F97316' }}
                      >
                        {product.brands?.name || 'Unknown Brand'}
                      </Badge>
                    </div>

                    {/* Quick Add Button */}
                    <div className="absolute bottom-2 right-2">
                      {product.inventory_quantity > 0 ? (
                        <Button 
                          size="sm" 
                          className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await addItem({
                                id: product.id,
                                title: product.title,
                                slug: product.slug,
                                price: product.price,
                                featured_image: product.featured_image,
                                sku: product.sku || '',
                                inventory_quantity: product.inventory_quantity,
                                track_inventory: true
                              })
                              toast.success(`${product.title} added to cart!`)
                            } catch (error) {
                              toast.error('Failed to add item to cart')
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 text-orange-500" />
                        </Button>
                      ) : (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-md">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 text-sm">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        ₦{product.price?.toLocaleString()}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₦{product.compare_at_price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-12"
        >
          <Link href="/products">
            <Button className="bg-blue-400 text-white hover:bg-blue-500 px-8 py-4 text-lg font-semibold rounded-full shadow-lg">
              View All Products ({allProducts.length} shown)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

function FooterFrame() {
  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 relative pt-16 lg:pt-0 pb-32 lg:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <Badge className="bg-gray-800 text-white mb-6 px-4 py-2 text-lg shadow-lg">
              Connect With Us
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Stay
              <br />
              <span className="text-gray-800">Connected</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Follow us for the latest updates, exclusive offers, and behind-the-scenes 
              content from your favorite Nigerian fashion brands.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">hello@favoritethings.ng</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">+234 123 456 7890</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button className="bg-gray-800 text-white hover:bg-gray-900 p-3 rounded-full">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button className="bg-gray-800 text-white hover:bg-gray-900 p-3 rounded-full">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button className="bg-gray-800 text-white hover:bg-gray-900 p-3 rounded-full">
                <Facebook className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-6">
                Subscribe to get updates on new collections and exclusive offers.
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 px-6 py-3 rounded-full">
                  Subscribe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedHomePage() {
  const { addItem } = useCartStore()
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const navigateToFrame = (index: number) => {
    if (isTransitioning) return
    setHasInteracted(true)
    setIsTransitioning(true)
    setCurrentFrame(index)
    
    // Scroll to top when changing frames
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
    
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const nextFrame = () => {
    if (currentFrame < frames.length - 1) {
      setHasInteracted(true)
      navigateToFrame(currentFrame + 1)
    }
  }

  const prevFrame = () => {
    if (currentFrame > 0) {
      setHasInteracted(true)
      navigateToFrame(currentFrame - 1)
    }
  }

  const handleSwipe = (event: any, info: PanInfo) => {
    // More sensitive swipe detection for better mobile UX
    if (Math.abs(info.offset.y) > 50) {
      setHasInteracted(true)
      if (info.offset.y > 0) {
        prevFrame()
      } else {
        nextFrame()
      }
    }
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const renderCurrentFrame = () => {
    switch (currentFrame) {
      case 0:
        return <WelcomeFrame />
      case 1:
        return <KiowaFrame />
      case 2:
        return <OmegeFrame />
      case 3:
        return <MiniMeFrame />
      case 4:
        return <OthersFrame />
      case 5:
        return <ShopAllFrame />
      case 6:
        return <FooterFrame />
      default:
        return <WelcomeFrame />
    }
  }

  return (
    <div className="relative">
      <FixedIdentityPanel currentFrame={currentFrame} onNavigate={navigateToFrame} onPrev={prevFrame} onNext={nextFrame} />
      
      {/* Navigation Arrows */}
      <div className="hidden lg:block fixed right-8 top-1/2 transform -translate-y-1/2 z-40 space-y-4">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={prevFrame}
            disabled={currentFrame === 0}
            className="bg-white/80 backdrop-blur-sm text-orange-500 hover:text-orange-600 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-50"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        </motion.div>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={nextFrame}
            disabled={currentFrame === frames.length - 1}
            className="bg-white/80 backdrop-blur-sm text-orange-500 hover:text-orange-600 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-50"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      {/* Mobile Navigation Arrows */}
      <div className="lg:hidden fixed bottom-20 right-4 z-20 flex flex-col space-y-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, y: [0, -3, 0] }}
          transition={{ delay: 0.5, y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
        >
          <Button
            onClick={prevFrame}
            disabled={currentFrame === 0}
            className="bg-white/90 backdrop-blur-sm text-orange-500 hover:text-orange-600 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, y: [0, 3, 0] }}
          transition={{ delay: 0.6, y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
        >
          <Button
            onClick={nextFrame}
            disabled={currentFrame === frames.length - 1}
            className="bg-white/90 backdrop-blur-sm text-orange-500 hover:text-orange-600 hover:bg-white p-3 rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Mobile Navigation Dots with Swipe Indicator */}
      <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-full px-4 py-3 shadow-2xl border border-gray-200/50">
          <div className="flex items-center justify-center space-x-3">
            {/* Swipe Indicator - Hide after user interaction */}
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.6, 1, 0.6], 
                  scale: [1, 1.1, 1],
                  y: [0, -2, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
                className="flex items-center space-x-1 text-xs text-gray-600 mr-2 bg-yellow-100 px-2 py-1 rounded-full"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronUp className="w-3 h-3 text-orange-500" />
                </motion.div>
                <span className="text-[10px] font-bold whitespace-nowrap text-gray-700">Swipe</span>
                <motion.div
                  animate={{ y: [0, 2, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-3 h-3 text-orange-500" />
                </motion.div>
              </motion.div>
            )}
            
            {/* Dots */}
            <div className="flex items-center space-x-2">
              {frames.map((frame, index) => (
                <motion.button
                  key={frame.id}
                  onClick={() => navigateToFrame(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 touch-manipulation ${
                    currentFrame === index
                      ? "bg-yellow-400 scale-110 shadow-sm"
                      : "bg-gray-300 hover:bg-gray-400 active:bg-gray-500"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
            
            {/* Cart Icon */}
            <div className="w-px h-4 bg-gray-300 ml-3 mr-2"></div>
            <div className="touch-manipulation">
              <CartIcon size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={currentFrame}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleSwipe}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        {renderCurrentFrame()}
      </motion.div>

      {/* Discount Popup */}
      <DiscountPopup />
      
      {/* Auth Buttons */}
      <div className="fixed top-4 right-4 z-50">
        <AuthButtons />
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        brandColor={selectedProduct?.brands?.primary_color || '#F97316'}
        brandName={selectedProduct?.brands?.name || 'Unknown Brand'}
      />
    </div>
  )
}
