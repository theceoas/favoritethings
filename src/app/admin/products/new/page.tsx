import { createClient } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const supabase = await createClient()

  // Get all brands for the form
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#6A41A1]">Add New Product</h1>
        <p className="text-[#4F4032]/80 mt-1">Create a new product for your catalog</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8">
        <ProductForm 
          brands={brands || []}
        />
      </div>
    </div>
  )
} 