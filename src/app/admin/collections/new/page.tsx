'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Sparkles,
  Star
} from "lucide-react"
import Link from 'next/link'

export default function NewCollectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [brands, setBrands] = useState<Array<{id: string, name: string, slug: string}>>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    brand_id: '',
    is_featured: false,
    is_active: true,
    sort_order: 1
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateSlug = (name: string, brandSlug: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return `${brandSlug}-${baseSlug}`
  }

  const handleNameChange = (name: string) => {
    handleInputChange('name', name)
    if (!formData.slug && formData.brand_id) {
      const brand = brands.find(b => b.id === formData.brand_id)
      if (brand) {
        handleInputChange('slug', generateSlug(name, brand.slug))
      }
    }
  }

  const handleBrandChange = (brandId: string) => {
    handleInputChange('brand_id', brandId)
    if (formData.name && brandId) {
      const brand = brands.find(b => b.id === brandId)
      if (brand) {
        handleInputChange('slug', generateSlug(formData.name, brand.slug))
      }
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setBrands(data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
      setError('Failed to load brands')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `collection-${timestamp}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('collection-images')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('collection-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      let finalImageUrl = formData.image_url
      
      // Upload image if file is selected
      if (imageFile) {
        setUploadingImage(true)
        try {
          finalImageUrl = await uploadImageToSupabase(imageFile)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          setError('Failed to upload image. Please try again.')
          setUploadingImage(false)
          setLoading(false)
          return
        }
        setUploadingImage(false)
      }

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert([{
          ...formData,
          image_url: finalImageUrl
        }])
        .select()
        .single()

      if (insertError) throw insertError

      router.push('/admin/collections')
    } catch (error: any) {
      console.error('Error creating collection:', error)
      setError(error.message || 'Failed to create collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
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
          className="absolute top-20 right-20 w-32 h-32 bg-amber-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-orange-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/collections">
              <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Collections
              </Button>
            </Link>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-amber-200/50">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-amber-800 mb-2">Create New Collection</h1>
                <p className="text-amber-700 text-lg">Add a new product collection to organize your inventory</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-2 text-red-800">❌ Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/90 backdrop-blur-md shadow-xl border border-amber-200/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-amber-800">Collection Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="brand_id" className="text-amber-800 font-medium">Brand *</Label>
                    <select
                      id="brand_id"
                      value={formData.brand_id}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white"
                      required
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-amber-800 font-medium">Collection Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter collection name"
                      className="border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-amber-800 font-medium">Slug *</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="brand-collection-slug"
                    className="border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-amber-800 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your collection..."
                    rows={4}
                    className="border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                                       <div className="space-y-2">
                         <Label htmlFor="image" className="text-amber-800 font-medium">Collection Image</Label>
                         <div className="space-y-4">
                           {/* Image Upload */}
                           <div className="relative">
                             <input
                               id="image"
                               type="file"
                               accept="image/*"
                               onChange={handleImageChange}
                               className="hidden"
                             />
                             <label
                               htmlFor="image"
                               className="flex items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:border-amber-400 transition-colors"
                             >
                               {imagePreview ? (
                                 <div className="relative w-full h-full">
                                   <img
                                     src={imagePreview}
                                     alt="Preview"
                                     className="w-full h-full object-cover rounded-lg"
                                   />
                                   <button
                                     type="button"
                                     onClick={(e) => {
                                       e.preventDefault()
                                       setImageFile(null)
                                       setImagePreview('')
                                     }}
                                     className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                   >
                                     ×
                                   </button>
                                 </div>
                               ) : (
                                 <div className="text-center">
                                   <ImageIcon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                   <p className="text-amber-600">Click to upload image</p>
                                   <p className="text-xs text-amber-500">PNG, JPG, GIF up to 10MB</p>
                                 </div>
                               )}
                             </label>
                           </div>
                           
                           {/* Or URL Input */}
                           <div className="relative">
                             <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
                             <Input
                               type="url"
                               value={formData.image_url}
                               onChange={(e) => handleInputChange('image_url', e.target.value)}
                               placeholder="Or enter image URL"
                               className="pl-10 border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                             />
                           </div>
                         </div>
                       </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order" className="text-amber-800 font-medium">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                      min="1"
                      className="border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active" className="text-amber-800 font-medium">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                    />
                    <Label htmlFor="is_featured" className="text-amber-800 font-medium flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Featured
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6">
                  <Link href="/admin/collections">
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Collection
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 