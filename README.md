# ClaimLetterAI

AI-powered insurance claim denial analysis and appeal letter generation platform.

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase
- 📄 **Document Upload** - Upload insurance denial letters in PDF/image format
- 🤖 **AI Analysis** - Get instant explanations of denial letters
- ✍️ **Appeal Generation** - AI drafts professional appeal letters
- 💳 **One-time Payment** - Stripe-powered payment system ($49)
- 📥 **Download Options** - Export appeals as PDF or DOCX
- 🖥️ **Dashboard** - Manage your letters and account

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Netlify Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **PDF Generation**: pdf-lib

## Setup Instructions

### 1. Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLIC_KEY` - Your Stripe publishable key
- `STRIPE_PRICE_ID` - Your Stripe price ID for the appeal service
- `SITE_URL` - Your production domain (https://www.claimletter.ai)

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in the Supabase SQL Editor:
   - `supabase/migrations/20251001_create_users_table.sql`
   - `supabase/migrations/20251001_create_documents_table.sql`
3. Create a storage bucket named `letters`
4. Set up Row Level Security (RLS) policies

### 3. Stripe Setup

1. Create a Stripe account
2. Create a product for "Claim Letter Generation" at $49
3. Add the price ID to your environment variables

### 4. OpenAI Setup

1. Create an OpenAI account
2. Generate an API key
3. Add it to your environment variables

### 5. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 6. Deployment

Deploy to Netlify:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## File Structure

```
claimletterai/
├── src/
│   ├── components/
│   │   ├── Auth.js              # Authentication functions
│   │   └── UploadForm.js        # File upload utilities
│   └── main.js                  # Main application logic
├── netlify/
│   └── functions/
│       ├── analyze-letter.js    # AI letter analysis
│       ├── generate-response.js # AI appeal generation
│       ├── create-checkout-session.js # Stripe checkout
│       └── generate-pdf.js      # PDF generation
├── supabase/
│   └── migrations/
│       ├── 20251001_create_users_table.sql
│       └── 20251001_create_documents_table.sql
├── examples/
│   ├── claim-denial-sample.pdf
│   └── homeowners-appeal-sample.pdf
├── index.html                   # Homepage
├── examples.html                # Sample letters page
├── resources.html               # Appeal resources page
├── login.html                   # Login page
├── signup.html                  # Signup page
├── upload.html                  # Document upload
├── dashboard.html               # User dashboard
├── pricing.html                 # Pricing page
├── success.html                 # Payment success
├── cancel.html                  # Payment cancelled
├── privacy.html                 # Privacy policy
├── terms.html                   # Terms of service
├── disclaimer.html              # Legal disclaimer
└── styles.css                   # Global styles
```

## API Endpoints

### Netlify Functions

- `/.netlify/functions/analyze-letter` - Analyze uploaded insurance denial letters
- `/.netlify/functions/generate-response` - Generate appeal letters
- `/.netlify/functions/create-checkout-session` - Create Stripe checkout
- `/.netlify/functions/generate-pdf` - Generate PDF documents

## Security Features

- Row Level Security (RLS) in Supabase
- Encrypted file storage
- Secure API key management
- Input validation and sanitization

## Legal Compliance

- Privacy Policy
- Terms of Service
- Legal Disclaimer (Not Legal or Insurance Advice)
- GDPR compliance considerations

## Support

For support, email info@axis-strategic-media.com

## License

All rights reserved. This software is proprietary.