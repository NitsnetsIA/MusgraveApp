# Musgrave Purchase Order Management System

A mobile-first offline React SPA for Musgrave's purchase order management system, designed to streamline Spanish grocery business workflows with advanced order processing capabilities.

## 🚀 Quick Start

### Development
```bash
npm run dev
```

### Deployment
```bash
# Build the application
npm run build

# Prepare for static deployment
node scripts/deploy-prepare.js
```

## 📱 Features

- **Mobile-First Design**: Optimized for grocery store personnel using mobile devices
- **Offline-First Architecture**: Full functionality with local SQLite database (SQL.js)
- **Spanish Tax Compliance**: Proper IVA tax handling for grocery products
- **Real-time Order Tracking**: Dynamic status updates and order management
- **Responsive UI**: Tailwind CSS with Shadcn/ui components

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** + **Shadcn/ui** for styling
- **Wouter** for routing
- **TanStack Query** for state management
- **SQL.js** for offline database

### Backend
- **Express.js** server for development
- **Static hosting** for production deployment

## 📦 Deployment

This application is configured for **static deployment** on Replit. The deployment process:

1. **Build**: Vite compiles the React app to `dist/public/`
2. **Prepare**: Deployment script moves files to `dist/` and creates SPA routing configuration
3. **Deploy**: Static files are served from `dist/` with proper SPA routing support

### Deployment Files
- `scripts/deploy-prepare.js` - Automated deployment preparation
- `DEPLOYMENT.md` - Detailed deployment guide
- `_redirects` - SPA routing configuration (generated automatically)

## 🗄️ Database

The application uses **SQL.js** (SQLite in the browser) for offline-first data storage:

- **Products**: Spanish grocery items with tax rates
- **Users**: Store-associated users
- **Purchase Orders**: B2B order management
- **Stores**: Physical store locations
- **Delivery Centers**: Regional distribution

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## 📱 Mobile Features

- Touch-optimized interfaces
- Offline functionality
- Progressive Web App capabilities
- Cart persistence across sessions
- Mobile-friendly forms and navigation

## 🇪🇸 Spanish Business Features

- IVA tax rate calculation (4%, 10%, 21%)
- Spanish product catalog
- Regional delivery center support
- Currency formatting in EUR
- Spanish UI text and labels

---

Built with ❤️ for Musgrave's Spanish grocery operations