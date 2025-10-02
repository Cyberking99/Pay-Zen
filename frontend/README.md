# StablePay - Blockchain Payment Platform

A modern, full-featured stablecoin payment platform built with Next.js, featuring a sophisticated blockchain/DeFi design theme.

## Features

### 🔐 Authentication & Onboarding
- Privy wallet integration simulation
- Multi-step user profile setup
- Secure authentication flow

### 💰 Payment Management
- **Send Money**: Transfer USDC to usernames or wallet addresses
- **Payment Links**: Generate custom payment links with advanced features
- **Transaction History**: Comprehensive transaction tracking and analytics
- **Link Management**: Monitor and manage payment link performance

### 🎨 Design & UX
- Professional blockchain/DeFi aesthetic
- Deep teal, forest green, and amber gold color scheme
- Responsive design with mobile-first approach
- Glass morphism effects and smooth animations
- Consistent typography using Space Grotesk and Inter fonts

### 🏗️ Architecture
- **Modular Structure**: Separate pages and reusable components
- **TypeScript**: Full type safety throughout the application
- **Next.js App Router**: Modern routing with server components
- **Responsive Layout**: Mobile-optimized with collapsible sidebar
- **Component Library**: Shadcn/ui components with custom styling

## Project Structure

\`\`\`
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── send/              # Send money functionality
│   ├── payment-links/     # Payment link generator
│   ├── history/           # Transaction history
│   ├── manage-links/      # Link management and analytics
│   ├── layout.tsx         # Root layout with fonts
│   ├── globals.css        # Global styles and theme
│   └── page.tsx           # Landing/auth page
├── components/
│   ├── auth/              # Authentication components
│   ├── ui/                # Reusable UI components
│   └── dashboard-layout.tsx # Main layout wrapper
└── middleware.ts          # Route protection
\`\`\`

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Download the project** from v0.app using the "Download Code" button
2. **Install dependencies**:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`
3. **Run the development server**:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`
4. **Open your browser** and navigate to `http://localhost:3000`

### First Time Setup

1. Click "Connect with Privy" on the landing page
2. Complete the 3-step onboarding process:
   - Enter your full name
   - Choose a unique username
   - Confirm you're 18 or older
3. Access the full dashboard and features

## Key Components

### Authentication Flow
- **AuthView**: Landing page with feature highlights
- **OnboardingView**: Multi-step profile setup
- **DashboardLayout**: Protected route wrapper with navigation

### Payment Features
- **Send Money**: Multi-step transaction flow with recipient selection
- **Payment Links**: Advanced link generator with custom fields and expiration types
- **Transaction History**: Searchable transaction list with detailed views
- **Link Management**: Analytics dashboard for payment link performance

### UI Components
- **BalanceCard**: Account balance display with privacy controls
- **ActivityItem**: Transaction activity list items
- **QuickActionCard**: Dashboard action cards
- **StatsCard**: Metric display cards
- **PageHeader**: Consistent page headers with actions

## Customization

### Colors
The app uses a carefully crafted blockchain/DeFi color palette:
- **Primary**: Deep teal (#0D9488)
- **Secondary**: Forest green (#059669) 
- **Accent**: Amber gold (#F59E0B)
- **Background**: Dark slate gradients
- **Text**: Light grays and whites

### Typography
- **Headings**: Space Grotesk (modern, tech-focused)
- **Body**: Inter (clean, readable)

### Styling
Global styles are defined in `app/globals.css` with CSS custom properties for easy theming.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms
The app is a standard Next.js application and can be deployed to any platform that supports Node.js.

## Features in Detail

### Payment Link Generator
- **Expiration Types**: One-time, time-based, or public links
- **Custom Fields**: Add text inputs, dropdowns, and textareas
- **Templates**: Pre-configured templates for common use cases
- **Live Preview**: See exactly how your link will appear

### Transaction Management
- **Search & Filter**: Find transactions by amount, recipient, or hash
- **Detailed Views**: Complete transaction information with blockchain data
- **Export Options**: Download transaction history and receipts
- **Real-time Status**: Live transaction status updates

### Link Analytics
- **Performance Metrics**: Track payments, clicks, and conversion rates
- **Revenue Tracking**: Monitor total received amounts
- **Link Management**: Activate, deactivate, and duplicate links
- **Usage Statistics**: Detailed analytics for each payment link

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: Shadcn/ui with custom modifications
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Space Grotesk, Inter)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

This project was generated with v0.app. To make modifications:

1. Use the built-in v0 editing capabilities
2. Download and modify locally
3. Follow the existing code patterns and component structure

## License

This project is generated by v0.app and follows their terms of service.
