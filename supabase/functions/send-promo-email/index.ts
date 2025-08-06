import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface EmailPayload {
  to: string;
  firstName: string;
  promoCode: string;
  discountPercent: number;
  description: string;
  validUntil: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { to, firstName, promoCode, discountPercent, description, validUntil } = payload;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Send email using your email service (e.g., Resend, SendGrid)
    const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to,
        subject: `🎉 Exclusive ${discountPercent}% Off Just for You!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6A41A1; text-align: center; margin-bottom: 30px;">
              Special Offer Just for You!
            </h1>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              Dear ${firstName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              We're excited to offer you an exclusive discount on your next purchase at Bedz&Buttunz!
            </p>
            
            <div style="background-color: #f8f8f8; border-radius: 10px; padding: 20px; margin: 30px 0; text-align: center;">
              <h2 style="color: #6A41A1; margin-bottom: 10px;">
                ${discountPercent}% OFF
              </h2>
              
              <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px;">
                Use code: <span style="color: #6A41A1;">${promoCode}</span>
              </p>
              
              <p style="color: #666; font-size: 14px;">
                ${description}
              </p>
              
              <p style="color: #666; font-size: 14px;">
                Valid until: ${new Date(validUntil).toLocaleDateString()}
              </p>
            </div>
            
            <a 
              href="https://bedznbuttunz.com/shop" 
              style="display: inline-block; background-color: #6A41A1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0;"
            >
              Shop Now
            </a>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Terms & Conditions:
              <br>- One-time use per customer
              <br>- Cannot be combined with other offers
              <br>- Valid for online purchases only
            </p>
          </div>
        `,
      },
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ message: 'Promo email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 