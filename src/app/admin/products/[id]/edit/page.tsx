import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get the product with its categories and collections
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      ),
      product_collections (
        collection_id,
        collections (
          id,
          name,
          slug
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Get product variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('sort_order')

  // Add variants to product object
  const productWithVariants = {
    ...product,
    variants: variants || []
  }

  // Get all categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // Get all collections for the form  
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#6A41A1]">Edit Product</h1>
        <p className="text-[#4F4032]/80 mt-1">Update product details</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8">
        <ProductForm 
          product={productWithVariants}
          categories={categories || []} 
          collections={collections || []}
        />
      </div>
    </div>
  )
} 