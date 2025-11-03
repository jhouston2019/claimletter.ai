# TaxLetterHelp Deployment Guide

## 🚀 Production Deployment Checklist

### ✅ Pre-Deployment Requirements

- [ ] All environment variables configured
- [ ] Supabase database set up with migrations
- [ ] Stripe products and webhooks configured
- [ ] OpenAI API key active
- [ ] Domain name registered (optional)

### 🔧 Environment Setup

#### 1. Netlify Configuration

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   Add these in Netlify Dashboard > Site Settings > Environment Variables:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
   STRIPE_PRICE_STANDARD=price_your_standard_price_id
   STRIPE_PRICE_COMPLEX=price_your_complex_price_id
   STRIPE_PRICE_STARTER=price_your_starter_price_id
   STRIPE_PRICE_PRO=price_your_pro_price_id
   STRIPE_PRICE_PROPLUS=price_your_proplus_price_id
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SITE_URL=https://your-domain.netlify.app
   ```

#### 2. Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and keys

2. **Run Migrations**
   Execute these SQL files in Supabase SQL Editor:
   - `supabase/migrations/20251001_create_users_table.sql`
   - `supabase/migrations/20251001_create_documents_table.sql`
   - `supabase/migrations/20251001_create_subscriptions_table.sql`
   - `supabase/migrations/20251001_setup_rls_policies.sql`

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Create bucket named `letters`
   - Set to private
   - RLS policies will be applied automatically

#### 3. Stripe Setup

1. **Create Products**
   - Go to Stripe Dashboard > Products
   - Create products for each plan:
     - Standard Letter Response ($79)
     - Complex Letter Response ($99)
     - Starter Plan ($19/month)
     - Pro Plan ($79/month)
     - Pro+ Plan ($99/month)

2. **Configure Webhooks**
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.netlify.app/.netlify/functions/stripe-webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

#### 4. OpenAI Setup

1. **API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create API key
   - Add to environment variables
   - Ensure sufficient credits

### 🧪 Testing

#### 1. Run Test Suite
```bash
node test-suite.js
```

#### 2. Manual Testing Checklist

- [ ] User registration/login
- [ ] File upload (PDF and images)
- [ ] OCR text extraction
- [ ] AI letter analysis
- [ ] Response generation
- [ ] PDF/DOCX download
- [ ] Payment processing
- [ ] Subscription management
- [ ] Usage tracking
- [ ] Error handling

#### 3. Security Testing

- [ ] Input validation
- [ ] Rate limiting
- [ ] CORS headers
- [ ] XSS protection
- [ ] File upload restrictions
- [ ] Authentication flow

### 🚀 Deployment Steps

#### 1. Deploy to Netlify

1. **Automatic Deployment**
   - Push to GitHub main branch
   - Netlify will automatically build and deploy
   - Check build logs for errors

2. **Manual Deployment**
   ```bash
   npm run build
   # Upload dist folder to Netlify
   ```

#### 2. Domain Configuration

1. **Custom Domain (Optional)**
   - Go to Netlify Dashboard > Domain Settings
   - Add custom domain
   - Configure DNS records
   - Enable HTTPS

2. **SSL Certificate**
   - Automatically provided by Netlify
   - Force HTTPS redirect

#### 3. Post-Deployment

1. **Verify Environment Variables**
   - Check all variables are set correctly
   - Test API connections

2. **Test Complete Flow**
   - Create test account
   - Upload test document
   - Process payment
   - Verify webhook handling

3. **Monitor Logs**
   - Check Netlify function logs
   - Monitor Supabase logs
   - Track Stripe webhook events

### 📊 Monitoring & Analytics

#### 1. Set Up Monitoring

- **Netlify Analytics**: Site performance and usage
- **Supabase Dashboard**: Database monitoring
- **Stripe Dashboard**: Payment analytics
- **OpenAI Usage**: API consumption tracking

#### 2. Error Tracking

- Monitor Netlify function errors
- Track failed payments
- Monitor API rate limits
- Check user feedback

#### 3. Performance Optimization

- Monitor page load times
- Track API response times
- Optimize image uploads
- Cache static assets

### 🔒 Security Checklist

- [ ] All environment variables secured
- [ ] RLS policies active
- [ ] Input validation working
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] File upload restrictions
- [ ] Authentication required
- [ ] Error messages sanitized

### 🆘 Troubleshooting

#### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify all dependencies installed
   - Check for syntax errors

2. **Function Errors**
   - Verify environment variables
   - Check API keys are valid
   - Monitor function logs

3. **Database Issues**
   - Verify RLS policies
   - Check user permissions
   - Monitor connection limits

4. **Payment Issues**
   - Verify Stripe keys
   - Check webhook configuration
   - Test with Stripe test mode

#### Support Resources

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **OpenAI Docs**: [platform.openai.com/docs](https://platform.openai.com/docs)

### 🎉 Go Live!

Once all tests pass and monitoring is set up:

1. **Announce Launch**
   - Update social media
   - Send email to beta users
   - Monitor for issues

2. **Monitor Performance**
   - Track user registrations
   - Monitor payment processing
   - Watch for errors

3. **Gather Feedback**
   - User surveys
   - Support tickets
   - Analytics data

### 📈 Post-Launch Optimization

- **A/B Testing**: Test different pricing pages
- **Feature Usage**: Track most used features
- **Performance**: Optimize slow functions
- **User Experience**: Improve based on feedback

---

**🎯 Your TaxLetterHelp application is now production-ready!**

For support, check the logs and documentation, or contact the development team.
