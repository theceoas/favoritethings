'use client';

import { useState, useEffect } from 'react';
import { Plus, Store, Search, Filter } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
}

interface Promotion {
  id: string;
  brand_id: string;
  code: string;
  description: string;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  usage_limit: number;
  times_used: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingPromo, setIsSendingPromo] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newPromo, setNewPromo] = useState({
    brand_id: '',
    code: '',
    description: '',
    discount_percent: 0,
    valid_from: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
    valid_until: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    usage_limit: 1,
    is_active: true
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        console.log('Starting auth and data load...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Session found, attempting to load promotions...');
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const queryPromise = supabase
          .from('promotions')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: promos, error: promosError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any;

        if (promosError) {
          console.error('Error loading promotions:', promosError);
          toast.error(`Failed to load promotions: ${promosError.message}`);
          setIsLoading(false);
          return;
        }

        console.log('Promotions loaded successfully:', promos);
        setPromotions(promos || []);
        
        // Load brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name, slug, primary_color, secondary_color')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!brandsError) {
          setBrands(brandsData || []);
          if (brandsData && brandsData.length > 0) {
            setNewPromo(prev => ({ ...prev, brand_id: brandsData[0].id }));
          }
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error in checkAuthAndLoadData:', error);
        toast.error(`Error: ${error.message || 'An error occurred while loading data'}`);
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router, supabase]);

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = 
      promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = brandFilter === 'all' || promo.brand_id === brandFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && promo.is_active) ||
      (statusFilter === 'inactive' && !promo.is_active);

    return matchesSearch && matchesBrand && matchesStatus;
  });

  const handleCreatePromo = async () => {
    if (!newPromo.code || !newPromo.description || !newPromo.brand_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const promotionData = {
        ...newPromo,
        created_by: user?.id,
        is_active: true,
        times_used: 0
      };

      const { data, error } = await supabase
        .from('promotions')
        .insert([promotionData])
        .select();

      if (error) {
        toast.error(`Failed to create promotion: ${error.message}`);
        return;
      }

      toast.success('Promotion created successfully!');
      setPromotions(prev => [data[0], ...prev]);
      setIsDialogOpen(false);
      setNewPromo({
        brand_id: brands.length > 0 ? brands[0].id : '',
        code: '',
        description: '',
        discount_percent: 0,
        valid_from: formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"),
        valid_until: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        usage_limit: 1
      });
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendPromo = async (promo: Promotion) => {
    setIsSendingPromo(true);
    try {
      // Get brand information for the promotion
      const brand = brands.find(b => b.id === promo.brand_id);
      
      // Prepare promotion data for webhook
      const promotionData = {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discount_percent: promo.discount_percent,
        valid_from: promo.valid_from,
        valid_until: promo.valid_until,
        is_active: promo.is_active,
        usage_limit: promo.usage_limit,
        times_used: promo.times_used,
        created_at: promo.created_at,
        updated_at: promo.updated_at,
        brand: brand ? {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          primary_color: brand.primary_color,
          secondary_color: brand.secondary_color
        } : null,
        // Additional metadata
        sent_at: new Date().toISOString(),
        sent_by: 'admin_panel',
        webhook_url: 'https://n8n.srv942568.hstgr.cloud/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a'
      };

      console.log('🚀 Sending promotion to webhook:', promotionData);

      // Send to n8n webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://n8n.srv942568.hstgr.cloud/webhook-test/7c39c404-0fd6-4e17-8f09-c791402fe02a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      const webhookResponse = await response.json();
      console.log('✅ Webhook response:', webhookResponse);

      toast.success(`Promotion ${promo.code} sent successfully to webhook!`);
    } catch (error: any) {
      console.error('❌ Error sending promotion to webhook:', error);
      
      let errorMessage = 'Failed to send promotion';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('webhook')) {
        errorMessage = `Webhook error: ${error.message}`;
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingPromo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
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
          className="absolute top-20 right-20 w-32 h-32 bg-green-400/10 rounded-full blur-xl"
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
          className="absolute bottom-32 left-32 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg"
                >
                  <Plus className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Promotions</h1>
                  <p className="text-gray-600 text-lg">Manage brand-specific promotions for Kiowa, Omogebyify, and MiniMe</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg font-medium">
                      <Plus className="w-4 h-4" />
                      Add Promotion
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Promotion</DialogTitle>
                    <DialogDescription>
                      Create a new promotion code for your customers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Brand</Label>
                      <select
                        id="brand"
                        value={newPromo.brand_id}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, brand_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select a brand</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="code">Promotion Code</Label>
                      <Input
                        id="code"
                        value={newPromo.code}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="SUMMER20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newPromo.description}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Summer sale promotion"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="discount">Discount Percentage</Label>
                      <Input
                        id="discount"
                        type="number"
                        value={newPromo.discount_percent}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, discount_percent: parseInt(e.target.value) || 0 }))}
                        placeholder="20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="usage_limit">Usage Limit</Label>
                      <Input
                        id="usage_limit"
                        type="number"
                        value={newPromo.usage_limit}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, usage_limit: parseInt(e.target.value) || 1 }))}
                        placeholder="100"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valid_from">Valid From</Label>
                      <Input
                        id="valid_from"
                        type="datetime-local"
                        value={newPromo.valid_from}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, valid_from: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valid_until">Valid Until</Label>
                      <Input
                        id="valid_until"
                        type="datetime-local"
                        value={newPromo.valid_until}
                        onChange={(e) => setNewPromo(prev => ({ ...prev, valid_until: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePromo} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Promotion'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Promotions",
                value: promotions.length,
                icon: Plus,
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-500"
              },
              {
                title: "Active Promotions",
                value: promotions.filter(p => p.is_active).length,
                icon: Store,
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-500"
              },
              {
                title: "Total Usage",
                value: promotions.reduce((sum, p) => sum + p.times_used, 0),
                icon: Plus,
                color: "from-purple-500 to-pink-600",
                bgColor: "bg-purple-500"
              },
              {
                title: "Brands",
                value: brands.length,
                icon: Store,
                color: "from-yellow-500 to-orange-600",
                bgColor: "bg-yellow-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`${stat.bgColor} rounded-2xl p-4 shadow-lg`}
                      >
                        <stat.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} opacity-10 rounded-full`} />
                    </div>
                    <div className="space-y-2">
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-3xl font-bold text-gray-800">
                        {stat.value}
                      </dd>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search promotions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-4">
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promotions Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promo, index) => (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium">{promo.code}</TableCell>
                    <TableCell>
                      {(() => {
                        const brand = brands.find(b => b.id === promo.brand_id);
                        return brand ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: brand.primary_color }}
                            />
                            <span className="text-sm font-medium">{brand.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unknown Brand</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{promo.description}</TableCell>
                    <TableCell>{promo.discount_percent}%</TableCell>
                    <TableCell>{promo.times_used} / {promo.usage_limit === -1 ? '∞' : promo.usage_limit}</TableCell>
                    <TableCell>
                      <Badge className={`${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(new Date(promo.valid_until), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleSendPromo(promo)}
                        disabled={isSendingPromo}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        {isSendingPromo ? 'Sending...' : 'Send to Webhook'}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 