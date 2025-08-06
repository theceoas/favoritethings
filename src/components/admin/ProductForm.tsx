'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/database'

import { useCustomModal } from '@/hooks/useCustomModal'
import CustomModal from '@/components/ui/CustomModal'
import { createClient } from '@/lib/supabase/client'

interface ProductFormProps {
  product?: any
  brands: Tables<'brands'>[]
}

export default function ProductForm({ product, brands }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { modalState, closeModal, error: showError } = useCustomModal()
  const [formData, setFormData] = useState({
    brand_id: product?.brand_id || '',
    title: product?.title || '',
    slug: product?.slug || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    price: product?.price || '',
    compare_at_price: product?.compare_at_price || '',
    cost_price: product?.cost_price || '',
    inventory_quantity: product?.inventory_quantity || 0,
    low_stock_threshold: product?.low_stock_threshold || 5,
    weight: product?.weight || '',
    dimensions: product?.dimensions || '',
    material: product?.material || '',
    care_instructions: product?.care_instructions || '',
    seo_title: product?.seo_title || '',
    seo_description: product?.seo_description || '',
    is_active: product?.is_active !== undefined ? product.is_active : true,
    is_featured: product?.is_featured || false,
    track_inventory: product?.track_inventory !== undefined ? product.track_inventory : true,
    productFilters: [] as Array<{filterId: string, filterOptionId: string, value: string}>,
    // Variant fields
    hasVariants: product?.variants ? product.variants.length > 0 : false,
    variants: product?.variants || []
  })

  // Image handling states
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>(product?.featured_image || '')
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(product?.images || [])
  const [uploadingImages, setUploadingImages] = useState(false)



  // Filter states
  const [filterCategories, setFilterCategories] = useState<any[]>([])
  const [filterOptions, setFilterOptions] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: string[]}>({})

  // Collection states
  const [collections, setCollections] = useState<any[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  // Variant management states
  const [availableSizes] = useState(['Twin', 'Full', 'Queen', 'King', 'California King', 'Standard', 'Euro'])
  const [availableColors] = useState(['White', 'Gray', 'Navy', 'Beige', 'Black', 'Cream', 'Silver'])
  const [newVariant, setNewVariant] = useState({
    title: '',
    sku: '',
    barcode: '',
    price: '',
    compare_at_price: '',
    size: '',
    color: '',
    material: '',
    inventory_quantity: 0,
    dimensions: '',
    is_default: false
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !product) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, product])

  // Auto-generate SKU from title
  useEffect(() => {
    if (formData.title && !product) {
      const sku = formData.title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('') + '-' + Math.random().toString(36).substr(2, 3).toUpperCase()
      setFormData(prev => ({ ...prev, sku }))
    }
  }, [formData.title, product])

  // Fetch collections when brand changes
  useEffect(() => {
    if (formData.brand_id) {
      fetchCollections()
    } else {
      setCollections([])
    }
  }, [formData.brand_id])

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('brand_id', formData.brand_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  // Fetch filter categories and options
  useEffect(() => {
    fetchFilters()
    if (product) {
      fetchProductFilters()
    }
  }, [product])

  const fetchProductFilters = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('product_filters')
        .select(`
          filter_option_id,
          filter_options (
            id,
            name,
            category_id
          )
        `)
        .eq('product_id', product.id)

      if (error) throw error

      // Group selected filters by category
      const filtersByCategory: {[key: string]: string[]} = {}
      data?.forEach(filter => {
        const categoryId = filter.filter_options.category_id
        if (!filtersByCategory[categoryId]) {
          filtersByCategory[categoryId] = []
        }
        filtersByCategory[categoryId].push(filter.filter_option_id)
      })

      setSelectedFilters(filtersByCategory)
    } catch (error) {
      console.error('Error fetching product filters:', error)
    }
  }

  const fetchFilters = async () => {
    try {
      const supabase = createClient()
      
      // Fetch filter categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('filter_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (categoriesError) throw categoriesError
      setFilterCategories(categoriesData || [])

      // Fetch filter options
      const { data: optionsData, error: optionsError } = await supabase
        .from('filter_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (optionsError) throw optionsError
      setFilterOptions(optionsData || [])

    } catch (error) {
      console.error('Error fetching filters:', error)
    }
  }

  const handleFilterChange = (categoryId: string, optionId: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const current = prev[categoryId] || []
      if (checked) {
        return { ...prev, [categoryId]: [...current, optionId] }
      } else {
        return { ...prev, [categoryId]: current.filter(id => id !== optionId) }
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }



  // Image handling functions

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('File Too Large', 'Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        showError('Invalid File Type', 'Please select a valid image file')
        return
      }
      // Set the image directly without editing
      setFeaturedImage(file)
      setFeaturedImagePreview(URL.createObjectURL(file))
    }
    // Clear the input so the same file can be selected again
    e.target.value = ''
  }

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (additionalImages.length + files.length > 10) {
      showError('Too Many Images', 'You can only upload up to 10 additional images')
      return
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', `${file.name} is too large. Maximum size is 5MB`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        showError('Invalid File Type', `${file.name} is not a valid image file`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      // Add all valid files directly without editing
      setAdditionalImages(prev => [...prev, ...validFiles])
      validFiles.forEach(file => {
        setAdditionalImagePreviews(prev => [...prev, URL.createObjectURL(file)])
      })
    }
    
    // Clear the input so the same files can be selected again
    e.target.value = ''
  }



  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImageToSupabase = async (file: File, path: string): Promise<string> => {
    const maxRetries = 3
    const baseTimeout = 45000 // 45 seconds base timeout
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for:`, path, 'Size:', file.size, 'bytes')
        
        // Try direct upload first (fallback approach)
        try {
          const timeout = baseTimeout * attempt
          const uploadPromise = supabase.storage
            .from('product-images')
            .upload(path, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Upload timeout after ${timeout/1000}s - attempt ${attempt}/${maxRetries}`)), timeout)
          )
          
          const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

          if (error) {
            console.error(`Upload error (attempt ${attempt}):`, error)
            
            // If it's a bucket policy error, don't retry
            if (error.message?.includes('policy') || error.message?.includes('permission')) {
              throw new Error(`Upload failed: ${error.message}. Please check storage policies.`)
            }
            
            // If it's the last attempt, throw the error
            if (attempt === maxRetries) {
              throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`)
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
            continue
          }

          console.log('Upload successful:', data?.path)

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(path)

          console.log('Public URL generated:', publicUrl)
          return publicUrl
          
        } catch (directUploadError) {
          console.log('Direct upload failed, trying with bucket check...')
          
          // Fallback: Check if storage bucket exists and is accessible
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
          if (bucketError) {
            console.error('Storage bucket error:', bucketError)
            throw new Error('Storage not accessible. Please check your Supabase configuration.')
          }
          
          console.log('Available buckets:', buckets?.map((b: any) => b.name))
          
          const productImagesBucket = buckets?.find((bucket: any) => bucket.name === 'product-images')
          if (!productImagesBucket) {
            console.error('Available buckets:', buckets?.map((b: any) => b.name))
            throw new Error('Product images bucket not found. Please create the "product-images" bucket in Supabase.')
          }
          
          console.log('Found product-images bucket:', productImagesBucket)
          
          // Try upload again after bucket check
          const timeout = baseTimeout * attempt
          const uploadPromise = supabase.storage
            .from('product-images')
            .upload(path, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Upload timeout after ${timeout/1000}s - attempt ${attempt}/${maxRetries}`)), timeout)
          )
          
          const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

          if (error) {
            console.error(`Upload error (attempt ${attempt}):`, error)
            
            if (error.message?.includes('policy') || error.message?.includes('permission')) {
              throw new Error(`Upload failed: ${error.message}. Please check storage policies.`)
            }
            
            if (attempt === maxRetries) {
              throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`)
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
            continue
          }

          console.log('Upload successful:', data?.path)

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(path)

          console.log('Public URL generated:', publicUrl)
          return publicUrl
        }
        
      } catch (error) {
        console.error(`Image upload error (attempt ${attempt}):`, error)
        
        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
      }
    }
    
    throw new Error('Upload failed after all retry attempts')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate mandatory fields
    if (!formData.brand_id) {
      showError('Missing Brand', 'Please select a brand')
      return
    }
    
    // Product filters are now optional - no validation required
    
    setIsSubmitting(true)

    try {
      let featuredImageUrl = featuredImagePreview
      let additionalImageUrls = [...additionalImagePreviews]

      // Only set uploading state if we actually need to upload images
      const hasNewImages = featuredImage || additionalImages.length > 0
      if (hasNewImages) {
        setUploadingImages(true)
      }

      // Upload featured image if new file selected
      if (featuredImage) {
        console.log('Uploading featured image...')
        const timestamp = Date.now()
        const featuredPath = `${formData.slug || 'product'}-featured-${timestamp}.${featuredImage.name.split('.').pop()}`
        featuredImageUrl = await uploadImageToSupabase(featuredImage, featuredPath)
        console.log('Featured image uploaded:', featuredImageUrl)
      }

      // Upload additional images if any new files selected
      if (additionalImages.length > 0) {
        console.log('Uploading', additionalImages.length, 'additional images...')
        const timestamp = Date.now()
        const uploadPromises = additionalImages.map((file, index) => {
          const imagePath = `${formData.slug || 'product'}-${timestamp}-${index}.${file.name.split('.').pop()}`
          return uploadImageToSupabase(file, imagePath)
        })
        
        const newImageUrls = await Promise.all(uploadPromises)
        console.log('Additional images uploaded:', newImageUrls)
        // Replace the preview URLs with actual uploaded URLs
        const startIndex = additionalImagePreviews.length - additionalImages.length
        additionalImageUrls = [
          ...additionalImagePreviews.slice(0, startIndex),
          ...newImageUrls
        ]
      }

      // Clear upload state immediately after successful upload
      if (hasNewImages) {
        setUploadingImages(false)
        console.log('Image uploads completed successfully')
      }

      // Prepare product data
      const productData = {
        brand_id: formData.brand_id,
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        sku: formData.sku,
        barcode: formData.barcode || null,
        price: parseFloat(formData.price.toString()),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price.toString()) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price.toString()) : null,
        inventory_quantity: formData.hasVariants ? 0 : parseInt(formData.inventory_quantity.toString()), // Set to 0 if using variants
        low_stock_threshold: parseInt(formData.low_stock_threshold.toString()),
        weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
        dimensions: formData.dimensions || null,
        material: formData.material || null,
        care_instructions: formData.care_instructions || null,
        featured_image: featuredImageUrl || null,
        images: additionalImageUrls.filter(url => url && url.trim()),
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        track_inventory: formData.hasVariants ? false : formData.track_inventory, // Disable if using variants
      }

      let productId: string

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (error) throw error
        productId = product.id
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single()

        if (error) throw error
        productId = data.id
      }



      // Update product filter values
      if (product) {
        // Remove existing filter values
        await supabase
          .from('product_filters')
          .delete()
          .eq('product_id', productId)
      }

      // Add new filter values
      const selectedFilterOptions = Object.values(selectedFilters).flat()
      if (selectedFilterOptions.length > 0) {
        const filterInserts = selectedFilterOptions.map(optionId => ({
          product_id: productId,
          filter_option_id: optionId
        }))

        const { error: filterError } = await supabase
          .from('product_filters')
          .insert(filterInserts)

        if (filterError) throw filterError
      }

      // Handle product variants
      if (formData.hasVariants && formData.variants.length > 0) {
        // Remove existing variants if updating
        if (product) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId)
        }

        // Create new variants
        const variantInserts = formData.variants.map((variant: any, index: number) => ({
          product_id: productId,
          title: variant.title,
          sku: variant.sku,
          barcode: variant.barcode || null,
          price: variant.price,
          compare_at_price: variant.compare_at_price || null,
          size: variant.size || null,
          color: variant.color || null,
          material: variant.material || null,
          inventory_quantity: variant.inventory_quantity || 0,
          dimensions: variant.dimensions ? JSON.stringify(variant.dimensions) : null,
          is_default: variant.is_default || false,
          is_active: true,
          sort_order: index + 1
        }))

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantInserts)

        if (variantError) throw variantError
      } else if (product) {
        // Remove all variants if switching from variants to simple product
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId)
      }

      // Handle collection associations
      if (product) {
        // Remove existing collection associations
        await supabase
          .from('product_collections')
          .delete()
          .eq('product_id', productId)
      }

      // Add new collection associations
      if (selectedCollections.length > 0) {
        const collectionInserts = selectedCollections.map(collectionId => ({
          product_id: productId,
          collection_id: collectionId
        }))

        const { error: collectionError } = await supabase
          .from('product_collections')
          .insert(collectionInserts)

        if (collectionError) throw collectionError
      }

      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      
      // Determine if the error was during image upload
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('Upload failed') || errorMessage.includes('timeout')) {
        showError('Upload Failed', 'Image upload failed. Please check your connection and try again.')
      } else if (errorMessage.includes('bucket not found')) {
        showError('Storage Error', 'Product images storage bucket not found. Please create the "product-images" bucket in Supabase.')
      } else if (errorMessage.includes('Storage not accessible')) {
        showError('Storage Error', 'Storage not accessible. Please check your Supabase configuration.')
      } else if (errorMessage.includes('policy') || errorMessage.includes('permission')) {
        showError('Permission Error', 'Upload permission denied. Please check storage policies in Supabase.')
      } else {
        showError('Save Failed', `Error saving product: ${errorMessage}`)
      }
    } finally {
      setIsSubmitting(false)
      setUploadingImages(false) // Always reset upload state
      console.log('Product save operation completed')
    }
  }

  // Variant management functions
  const toggleVariants = () => {
    setFormData(prev => ({
      ...prev,
      hasVariants: !prev.hasVariants,
      variants: !prev.hasVariants ? [] : prev.variants
    }))
  }

  const generateVariantTitle = (size: string, color: string) => {
    const parts = []
    if (size) parts.push(size)
    if (color) parts.push(color)
    return parts.join(' - ') || 'Variant'
  }

  const generateVariantSKU = (size: string, color: string) => {
    const baseSlug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const sizeCode = size ? size.substring(0, 2).toUpperCase() : 'DF'
    const colorCode = color ? color.substring(0, 3).toUpperCase() : 'DEF'
    return `${baseSlug.substring(0, 8).toUpperCase()}-${sizeCode}-${colorCode}`
  }

  const addVariant = () => {
    if (!newVariant.size && !newVariant.color) {
      showError('Missing Variant Details', 'Please select at least a size or color for the variant')
      return
    }

    // Check for duplicate combinations
    const exists = formData.variants.some((v: any) => 
      v.size === newVariant.size && v.color === newVariant.color
    )

    if (exists) {
      showError('Duplicate Variant', 'A variant with this size and color combination already exists')
      return
    }

    const variant = {
      id: `temp-${Date.now()}`, // Temporary ID for new variants
      title: newVariant.title || generateVariantTitle(newVariant.size, newVariant.color),
      sku: newVariant.sku || generateVariantSKU(newVariant.size, newVariant.color),
      barcode: newVariant.barcode || null,
      price: parseFloat(newVariant.price) || parseFloat(formData.price.toString()) || 0,
      compare_at_price: newVariant.compare_at_price ? parseFloat(newVariant.compare_at_price) : null,
      size: newVariant.size || null,
      color: newVariant.color || null,
      material: newVariant.material || formData.material || null,
      inventory_quantity: parseInt(newVariant.inventory_quantity.toString()) || 0,
      dimensions: newVariant.dimensions || null,
      is_default: formData.variants.length === 0 ? true : newVariant.is_default, // First variant is default
      is_active: true,
      sort_order: formData.variants.length + 1
    }

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, variant]
    }))

    // Reset new variant form
    setNewVariant({
      title: '',
      sku: '',
      barcode: '',
      price: '',
      compare_at_price: '',
      size: '',
      color: '',
      material: '',
      inventory_quantity: 0,
      dimensions: '',
      is_default: false
    })
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index)
    }))
  }

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant: any, i: number) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }

  const setDefaultVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant: any, i: number) => ({
        ...variant,
        is_default: i === index
      }))
    }))
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Brand *
            </label>
            <select
              name="brand_id"
              value={formData.brand_id}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            >
              <option value="">Select a brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Collections
              <span className="text-xs text-gray-500 ml-1">(optional)</span>
            </label>
            <select
              multiple
              value={selectedCollections}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setSelectedCollections(values)
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent min-h-[120px]"
            >
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            {collections.length === 0 && formData.brand_id && (
              <p className="text-sm text-gray-500 mt-1">No collections available for this brand</p>
            )}
            {!formData.brand_id && (
              <p className="text-sm text-gray-500 mt-1">Select a brand first to see collections</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Product Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="Enter product title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="product-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              SKU *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="Product SKU"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Store Code/Barcode
              <span className="text-xs text-gray-500 ml-1">(for physical store)</span>
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="e.g., BED001, 123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Material
            </label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="e.g., Egyptian Cotton"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Short Description
          </label>
          <textarea
            name="short_description"
            value={formData.short_description}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            placeholder="Brief product description for listings"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Full Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            placeholder="Detailed product description"
          />
        </div>
      </div>

      {/* Product Filters */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Product Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterCategories.map((category) => {
            const categoryOptions = filterOptions.filter(option => option.category_id === category.id)
            return (
              <div key={category.id} className="space-y-3">
                <label className="block text-sm font-medium text-[#4F4032]">
                  {category.name}
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {categoryOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFilters[category.id]?.includes(option.id) || false}
                        onChange={(e) => handleFilterChange(category.id, option.id, e.target.checked)}
                        className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
                      />
                      <span className="text-sm text-[#4F4032]">{option.name}</span>
                      {category.type === 'color' && (
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: option.value }}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Price (₦) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Compare At Price (₦)
            </label>
            <input
              type="number"
              name="compare_at_price"
              value={formData.compare_at_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Cost Price (₦)
            </label>
            <input
              type="number"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Inventory</h3>
        
        {/* Variants Toggle */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.hasVariants}
              onChange={toggleVariants}
              className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm font-medium text-[#4F4032]">
              This product has multiple variants (sizes, colors, etc.)
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-2">
            Enable this if your product comes in different sizes, colors, or other variations with separate pricing and inventory.
          </p>
        </div>

        {!formData.hasVariants ? (
          /* Single Product Inventory */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4F4032] mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="inventory_quantity"
                  value={formData.inventory_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4F4032] mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-[#4F4032]">Track inventory for this product</span>
              </label>
            </div>
          </>
        ) : (
          /* Variant Management */
          <>
            <div className="space-y-6">
              {/* Add New Variant */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-[#6A41A1] mb-4">Add New Variant</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">Size</label>
                    <select
                      value={newVariant.size}
                      onChange={(e) => setNewVariant(prev => ({ 
                        ...prev, 
                        size: e.target.value,
                        title: generateVariantTitle(e.target.value, prev.color),
                        sku: generateVariantSKU(e.target.value, prev.color)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                    >
                      <option value="">Select Size</option>
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">Color</label>
                    <select
                      value={newVariant.color}
                      onChange={(e) => setNewVariant(prev => ({ 
                        ...prev, 
                        color: e.target.value,
                        title: generateVariantTitle(prev.size, e.target.value),
                        sku: generateVariantSKU(prev.size, e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                    >
                      <option value="">Select Color</option>
                      {availableColors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">Price (₦)</label>
                    <input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                      placeholder={formData.price.toString()}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">Inventory</label>
                    <input
                      type="number"
                      value={newVariant.inventory_quantity}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, inventory_quantity: parseInt(e.target.value) || 0 }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">SKU</label>
                    <input
                      type="text"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                      placeholder="Auto-generated"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4F4032] mb-2">
                      Store Code/Barcode
                      <span className="text-xs text-gray-400 ml-1">(for store)</span>
                    </label>
                    <input
                      type="text"
                      value={newVariant.barcode}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
                      placeholder="e.g., BED001-K, SHEET001-Q"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="w-full px-4 py-2 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors"
                    >
                      Add Variant
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Variants */}
              {formData.variants.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-[#6A41A1]">
                    Variants ({formData.variants.length})
                  </h4>
                  
                  {formData.variants.map((variant: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-medium text-[#4F4032]">{variant.title}</h5>
                          {variant.is_default && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!variant.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefaultVariant(index)}
                              className="text-xs text-[#6A41A1] hover:text-[#6A41A1]/80"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₦)</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#6A41A1] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Inventory</label>
                          <input
                            type="number"
                            value={variant.inventory_quantity}
                            onChange={(e) => updateVariant(index, 'inventory_quantity', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#6A41A1] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                          <span className="block px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">
                            {variant.size || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                          <span className="block px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">
                            {variant.color || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#6A41A1] focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Store Code/Barcode
                            <span className="text-xs text-gray-400 ml-1">(for store)</span>
                          </label>
                          <input
                            type="text"
                            value={variant.barcode || ''}
                            onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                            placeholder="e.g., BED001-K, SHEET001-Q"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#6A41A1] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.variants.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">No variants added yet. Add your first variant above.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Physical Properties */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Physical Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              Dimensions
            </label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="L x W x H (cm)"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Care Instructions
          </label>
          <textarea
            name="care_instructions"
            value={formData.care_instructions}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            placeholder="Care and maintenance instructions"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Product Images</h3>
        
        {/* Featured Image */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Main Product Image (Thumbnail) *
          </label>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
            />
            
            {featuredImagePreview && (
              <div className="relative inline-block group">
                <div className="w-48 h-64 bg-gray-100 rounded-lg border-2 border-[#6A41A1] overflow-hidden flex items-center justify-center">
                  <img 
                    src={featuredImagePreview} 
                    alt="Featured image preview"
                    className="max-w-full max-h-full w-auto h-auto"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div className="absolute -top-2 -right-2 bg-[#6A41A1] text-white text-xs px-2 py-1 rounded-full">
                  Main
                </div>

              </div>
            )}
          </div>
          <p className="text-xs text-[#4F4032]/60 mt-1">
            This will be the main image shown in product listings. The full image is preserved without any cropping or editing. Max size: 5MB.
          </p>
        </div>

        {/* Additional Images */}
        <div>
          <label className="block text-sm font-medium text-[#4F4032] mb-2">
            Additional Images ({additionalImagePreviews.length}/10)
          </label>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAdditionalImagesChange}
              disabled={additionalImagePreviews.length >= 10}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent disabled:opacity-50"
            />
            
            {additionalImagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {additionalImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full h-40 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                      <img 
                        src={preview} 
                        alt={`Additional image ${index + 1}`}
                        className="max-w-full max-h-full w-auto h-auto"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                    >
                      ×
                    </button>

                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[#4F4032]/60 mt-1">
            Upload up to 10 additional product images. Max size: 5MB each. Images are preserved as-is without editing.
          </p>
        </div>

        {uploadingImages && (
          <div className="mt-4 p-4 bg-[#6A41A1]/10 border border-[#6A41A1]/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6A41A1]"></div>
              <span className="text-sm text-[#6A41A1]">Uploading images...</span>
            </div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">SEO</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              SEO Title
            </label>
            <input
              type="text"
              name="seo_title"
              value={formData.seo_title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="SEO optimized title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4F4032] mb-2">
              SEO Description
            </label>
            <textarea
              name="seo_description"
              value={formData.seo_description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6A41A1] focus:border-transparent"
              placeholder="SEO meta description"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="text-lg font-semibold text-[#6A41A1] mb-4">Status</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-[#4F4032]">Product is active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-[#6A41A1] shadow-sm focus:border-[#6A41A1] focus:ring focus:ring-[#6A41A1] focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-[#4F4032]">Featured product</span>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-[#4F4032] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploadingImages}
          className="px-6 py-3 bg-[#6A41A1] text-white rounded-lg hover:bg-[#6A41A1]/90 transition-colors disabled:opacity-50"
        >
          {uploadingImages ? 'Uploading Images...' : isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
    
    {/* Custom Modal */}
    <CustomModal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      onConfirm={modalState.onConfirm}
      onCancel={modalState.onCancel}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
    />
    

    </>
  )
} 