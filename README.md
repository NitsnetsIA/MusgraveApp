# Musgrave Purchase Order Management System

A mobile-first offline React SPA for Musgrave's purchase order management system, designed to streamline Spanish grocery business workflows with advanced order processing capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm** or **yarn**

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd MusgraveApp

# Install dependencies
npm install
```

### Development
```bash
# Start development server
npm run dev
```

The development server will start on `http://localhost:5555` (or the port specified in the `PORT` environment variable).

### Production Build
```bash
# Build the application
npm run build
```

This creates a production build in the `dist/public/` directory.

### Local Deployment Testing
```bash
# Build the application first
npm run build

# Prepare for static deployment
node scripts/deploy-prepare.js

# Start local server to test the built application
npm start
```

The prepared files will be in the `dist/` directory, ready for deployment.

### Deployment
```bash
# Build the application
npm run build

# Prepare for static deployment
node scripts/deploy-prepare.js
```

**Deployment Output:**
- **Source files**: `dist/public/` (React app built files)
- **Server files**: `dist/index.js` (Express server for local testing)
- **Static files**: `dist/` (ready for hosting platforms like Replit, Vercel, Netlify)

**Note**: The `scripts/deploy-prepare.js` script automatically:
- Moves built files to the correct locations
- Creates SPA routing configuration
- Generates necessary deployment files

## 📱 Features

- **Mobile-First Design**: Optimized for grocery store personnel using mobile devices
- **Offline-First Architecture**: Full functionality with local IndexedDB database
- **Spanish Tax Compliance**: Proper IVA tax handling for grocery products
- **Real-time Order Tracking**: Dynamic status updates and order management
- **Responsive UI**: Tailwind CSS with Shadcn/ui components
- **Image Caching**: Service Worker-based offline image support
- **Progressive Web App**: Full offline functionality with background sync

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** + **Shadcn/ui** for styling
- **React Router** for routing (Switch, Route)
- **React Query** for state management and data fetching
- **IndexedDB** with **Dexie** for offline database
- **Service Worker** for offline image caching

### Backend
- **Express.js** server for development and API
- **GraphQL** endpoint for data synchronization
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

The application uses **IndexedDB** with **Dexie** for offline-first data storage:

- **Products**: Spanish grocery items with tax rates
- **Users**: Store-associated users
- **Purchase Orders**: B2B order management
- **Stores**: Physical store locations
- **Delivery Centers**: Regional distribution
- **Taxes**: IVA tax rates (4%, 10%, 21%)

### Data Synchronization
- **GraphQL API** for server communication
- **Background sync** for offline orders
- **Conflict resolution** for data consistency
- **Image caching** with Service Worker

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes (Drizzle)

## 📱 Mobile Features

- Touch-optimized interfaces
- Full offline functionality
- Progressive Web App capabilities
- Cart persistence across sessions
- Mobile-friendly forms and navigation
- Background image caching
- Offline order creation and sync

## 🇪🇸 Spanish Business Features

- IVA tax rate calculation (4%, 10%, 21%)
- Spanish product catalog
- Regional delivery center support
- Currency formatting in EUR
- Spanish UI text and labels

## 🛠️ Technology Stack

### Core
- **React 18** + **TypeScript**
- **Vite** + **ESBuild**
- **Tailwind CSS** + **Shadcn/ui**

### State Management
- **React Query** for server state
- **React Context** for local state
- **React Hooks** for component logic

### Database & Storage
- **IndexedDB** with **Dexie** for offline storage
- **Drizzle ORM** for database operations
- **Service Worker** for offline caching

### Backend & API
- **Express.js** server
- **GraphQL** for data sync
- **Passport.js** for authentication

### Development Tools
- **TypeScript** for type safety
- **ESLint** + **Prettier** for code quality
- **Drizzle Kit** for database migrations

---

Built with ❤️ for Musgrave's Spanish grocery operations