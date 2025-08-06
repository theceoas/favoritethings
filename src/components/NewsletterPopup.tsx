'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/utils/logger';

const WELCOME_PROMO_CODE = 'WELCOME10';

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Show popup immediately with animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000); // Small delay for better UX after page load

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const timeoutFetch = (url: string, options: RequestInit = {}, timeout = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      ),
    ]) as Promise<Response>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setError('');
    logger.log('[Newsletter] Starting submission process...');

    try {
      // Generate a random password for the user
      const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        logger.error('[Newsletter] Signup error:', error);
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      // Set success immediately after user creation
      logger.log('[Newsletter] User created successfully:', data.user.email);
      setSuccess(true);

      // 3. Ensure promo exists
      logger.log('[Newsletter] Step 3: Checking/creating welcome promo...');
      const { count } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('code', WELCOME_PROMO_CODE);

      logger.log('[Newsletter] Promo check response:', { count });

      if (count === 0) {
        logger.log('[Newsletter] Creating welcome promo...');
        const { error: promoError } = await supabase.from('promotions').insert({
          code: WELCOME_PROMO_CODE,
          description: 'Welcome discount for new customers',
          discount_percent: 10,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          usage_limit: 1,
          times_used: 0,
          created_by: data.user.id
        });

        if (promoError) {
          logger.error('[Newsletter] Promo creation error:', promoError);
          // Don't throw here, as user is already created successfully
          logger.log('[Newsletter] Continuing despite promo creation error');
        }
      }

      // 4. Call webhook to send welcome email
      logger.log('[Newsletter] Step 4: Calling webhook to send welcome email...');
      try {
        const webhookRes = await timeoutFetch(
          'https://primary-production-cea17.up.railway.app/webhook-test/5b0eda00-04c2-4bd0-93a2-e2cdefab1ea5',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer: { 
                email: data.user.email, 
                name: data.user.user_metadata.full_name 
              },
              promotion: { 
                code: WELCOME_PROMO_CODE, 
                discount_percent: 10, 
                description: 'Welcome discount for new customers' 
              },
            }),
          },
          10000 // 10 second timeout
        );

        logger.log('[Newsletter] Webhook response status:', webhookRes.status);

        if (!webhookRes.ok) {
          const text = await webhookRes.text();
          logger.error('[Newsletter] Webhook error:', webhookRes.status, text);
          logger.log('[Newsletter] Continuing despite webhook error');
        } else {
          logger.log('[Newsletter] Welcome email sent successfully');
        }
      } catch (webhookErr) {
        logger.error('[Newsletter] Webhook call failed:', webhookErr);
        logger.log('[Newsletter] Continuing despite webhook error');
      }

      // Clear form fields
      setEmail('');
      setFullName('');

      logger.log('[Newsletter] Setting up popup close timer...');
      // Close popup after showing success
      setTimeout(() => {
        logger.log('[Newsletter] Closing popup...');
        setIsVisible(false);
        setSuccess(false);
      }, 3000);

      logger.log('[Newsletter] All steps completed successfully!');

    } catch (err: any) {
      logger.error('[Newsletter] Submission error:', err);
      setError(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      logger.log('[Newsletter] Submission process finished');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed bottom-0 right-0 z-50 p-4 transition-all duration-500 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#6A41A1] transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          {!success ? (
            <>
              {/* Icon */}
              <div className="mb-4">
                <span className="text-4xl">✨</span>
              </div>

              <h3 className="text-2xl font-bold text-[#6A41A1] mb-2">
                Get 10% Off Your First Order
              </h3>
              
              <p className="text-[#4F4032]/80 mb-6">
                Sign up for our newsletter and receive an exclusive discount code!
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6A41A1] focus:outline-none transition-colors mb-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6A41A1] focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#6A41A1] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#FFD84D] hover:text-[#6A41A1] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Subscribing...
                    </div>
                  ) : (
                    'Get My 10% Off'
                  )}
                </button>

                <p className="text-xs text-[#4F4032]/60">
                  By subscribing, you agree to receive marketing emails from us.
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              
              <h3 className="text-2xl font-bold text-[#6A41A1] mb-2">
                Welcome to the Family!
              </h3>
              
              <p className="text-[#4F4032]/80">
                Check your email for your 10% discount code.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 