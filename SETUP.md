# TaxLetterHelp Setup Guide

This guide will help you set up the TaxLetterHelp application for production use.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- An OpenAI account
- A Stripe account
- A Netlify account (for deployment)

## 1. Environment Setup

### Create Environment File

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

### Required Environment Variables

Fill in your `.env` file with the following values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_PRICE_STANDARD=price_your_standard_price_id
STRIPE_PRICE_COMPLEX=price_your_complex_price_id
STRIPE_PRICE_STARTER=price_your_starter_price_id
STRIPE_PRICE_PRO=price_your_pro_price_id
STRIPE_PRICE_PROPLUS=price_your_proplus_price_id

# Site Configuration
SITE_URL=https://your-domain.com
```

## 2. Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from the project settings

### Run Database Migrations

Execute the SQL migrations in your Supabase SQL Editor:

1. **Create Users Table** (`supabase/migrations/20251001_create_users_table.sql`)
2. **Create Documents Table** (`supabase/migrations/20251001_create_documents_table.sql`)

### Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `letters`
3. Set the bucket to private
4. Configure RLS policies (see below)

### Row Level Security (RLS) Policies

Execute these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 3. Stripe Setup

### Create Products and Prices

1. Go to your Stripe dashboard
2. Create products for each plan:
   - **Standard Letter Response** - $79 one-time
   - **Complex Letter Response** - $99 one-time
   - **Starter Plan** - $19/month
   - **Pro Plan** - $79/month
   - **Pro+ Plan** - $99/month

3. Note the price IDs and add them to your environment variables

### Configure Webhooks (Optional)

For production, set up webhooks to handle subscription events:

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/.netlify/functions/stripe-webhook`
3. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## 4. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add it to your environment variables
4. Ensure you have sufficient credits for API usage

## 5. Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 6. Deployment

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add all environment variables in Netlify dashboard
5. Deploy

### Environment Variables in Netlify

Add all your environment variables in the Netlify dashboard under Site Settings > Environment Variables.

## 7. Testing

### Test the Complete Flow

1. **User Registration**: Create an account
2. **File Upload**: Upload a test IRS letter (image or PDF)
3. **AI Analysis**: Verify text extraction and analysis work
4. **Response Generation**: Generate a response letter
5. **Download**: Test PDF and DOCX downloads
6. **Payment**: Test subscription flow (use Stripe test mode)

### Test Files

Create test files to verify functionality:
- Sample IRS letter images
- PDF documents
- Various file formats

## 8. Security Checklist

- [ ] All environment variables are set
- [ ] Supabase RLS policies are configured
- [ ] Storage bucket is private
- [ ] API keys are secure
- [ ] HTTPS is enabled in production
- [ ] Input validation is working
- [ ] Error handling is comprehensive

## 9. Monitoring

### Set up monitoring for:
- API usage (OpenAI, Supabase)
- Error rates
- User activity
- Payment processing

### Recommended tools:
- Supabase dashboard for database monitoring
- Stripe dashboard for payment monitoring
- Netlify analytics for site performance

## 10. Support

For issues or questions:
- Check the logs in Netlify Functions
- Review Supabase logs
- Monitor Stripe webhook events
- Test with different file types and sizes

## Common Issues

### OCR Not Working
- Ensure OpenAI API key is valid
- Check image file size limits
- Verify image format support

### Payment Issues
- Verify Stripe keys are correct
- Check price IDs match your Stripe dashboard
- Test with Stripe test mode first

### Database Errors
- Verify RLS policies are set correctly
- Check user authentication
- Ensure proper table relationships

### File Upload Issues
- Check Supabase storage configuration
- Verify file size limits
- Test with different file types

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Payment flow tested
- [ ] File upload/download tested
- [ ] OCR functionality verified
- [ ] Legal pages completed
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Analytics set up
- [ ] Support contact information updated
