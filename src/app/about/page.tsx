import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#f3e8ff] via-[#fffbe6] to-[#fff] pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#6A41A1] mb-6">
              About Favorite Things
            </h1>
            <p className="text-lg sm:text-xl text-[#4F4032]/80 max-w-3xl mx-auto leading-relaxed">
              Bold and contemporary fashion that pushes boundaries and celebrates individuality
            </p>
            
            {/* Breadcrumb */}
            <div className="flex items-center justify-center mt-6 text-sm text-[#4F4032]/60">
              <Link href="/" className="hover:text-[#6A41A1] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-[#6A41A1] font-medium">About</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
          <div>
            <h2 className="text-3xl font-bold text-[#6A41A1] mb-8">Our Story</h2>
            <div className="space-y-8 text-[#4F4032]/80">
              <p className="text-lg leading-relaxed">
                Founded with a passion for bold and contemporary fashion, 
                Favorite Things has been pushing boundaries and celebrating individuality since our inception.
              </p>
              <p className="text-lg leading-relaxed">
                We believe that fashion is a form of self-expression. That's why we've 
                dedicated ourselves to creating designs that celebrate individuality, ensuring every piece 
                meets our exacting standards of style and quality.
              </p>
              <p className="text-lg leading-relaxed">
                From our humble beginnings to becoming a trusted name in contemporary fashion, 
                our commitment remains unchanged: to provide you with designs that transform your 
                style into something truly extraordinary.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-[#6A41A1]/20 to-[#FFD84D]/20 rounded-3xl p-12 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#6A41A1] mb-3">Made with Love</h3>
                <p className="text-[#4F4032]/70">Every product crafted with care and attention to detail</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#6A41A1] mb-6">Our Values</h2>
            <p className="text-lg text-[#4F4032]/80 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-10 rounded-2xl bg-white shadow-lg border border-[#6A41A1]/10 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#6A41A1] mb-4">Quality First</h3>
              <p className="text-[#4F4032]/70 leading-relaxed">
                We never compromise on quality. Every product is carefully selected and tested 
                to meet our stringent standards.
              </p>
            </div>
            
            <div className="text-center p-10 rounded-2xl bg-white shadow-lg border border-[#6A41A1]/10 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#6A41A1] mb-4">Customer Focused</h3>
              <p className="text-[#4F4032]/70 leading-relaxed">
                Your satisfaction is our priority. We're here to ensure your shopping 
                experience is seamless and delightful.
              </p>
            </div>
            
            <div className="text-center p-10 rounded-2xl bg-white shadow-lg border border-[#6A41A1]/10 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6A41A1] to-[#FFD84D] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#6A41A1] mb-4">Innovation</h3>
              <p className="text-[#4F4032]/70 leading-relaxed">
                We constantly push boundaries and embrace new ideas to bring you 
                the most innovative and stylish designs.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#6A41A1] mb-6">Why Choose Favorite Things?</h2>
          <p className="text-lg text-[#4F4032]/80 max-w-2xl mx-auto">
            Experience the difference that true quality makes
          </p>
        </div>
      </div>
    </>
  )
} 