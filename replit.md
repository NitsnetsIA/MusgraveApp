# Replit.md

## Overview

This is a full-stack Musgrave grocery ordering application built with React and Express. The application allows store users to browse products, manage shopping carts, and place purchase orders. It features a mobile-first design optimized for grocery store personnel, with offline capabilities using IndexedDB for data storage and synchronization.

The application simulates a B2B grocery ordering system where registered store users can browse product catalogs, add items to cart, and create purchase orders that get processed by the system. It includes comprehensive user management, product catalog browsing, order tracking, and offline-first architecture.

## Recent Changes (January 2025)

✅ **COMPLETED: Bidirectional GraphQL Synchronization for Purchase Orders**
- Added server_send_at timestamp field to purchase orders for tracking server synchronization status
- Implemented sendPurchaseOrderToServer() function with proper GraphQL mutation handling
- Integrated purchase order sync into createPurchaseOrder workflow for immediate server push
- Added syncPendingPurchaseOrders() for batch processing of unsent orders during sync
- Updated database schema to track which orders have been successfully sent to server
- All purchase orders now automatically sync to GraphQL server with error handling and retry logic

✅ **COMPLETED: Full IndexedDB Migration**
- Migrated completely from SQL.js to IndexedDB for better performance with large datasets (10,000+ products)
- All core functionality working: product catalog, cart operations, checkout, purchase orders, order details
- Eliminated duplicate SQL functions and consolidated to unified database service
- Purchase order creation, listing, and detail pages fully functional

✅ **COMPLETED: Complete IndexedDB Migration & Performance Optimization**
- Completely migrated from SQL.js to IndexedDB for all database operations
- Cleaned database-service.ts to only support IndexedDB (removed all SQL functions)
- Added sync_config table to IndexedDB schema for tracking sync timestamps
- Implemented incremental sync with proper timestamp checking
- Fixed GraphQL query errors by simplifying to basic format without optional parameters
- All core functionality working: products, orders, purchase orders, sync operations

✅ **COMPLETED: Critical Performance & Data Persistence Fixes (January 2025)**
- Fixed critical bug where incremental sync was clearing all products when no new products available
- Optimized product sync to use bulk insert (1000 products per batch) instead of individual inserts
- Added automatic detection of empty product database to force full sync when needed
- Prevented unnecessary database clearing during incremental sync operations
- **MAJOR FIX**: Implemented true incremental product updates that preserve existing products
- Fixed incremental sync to only update modified products instead of clearing entire product database
- All user session persistence issues resolved - products now persist correctly across logout/login cycles

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Single-page application using React with TypeScript
- **UI Framework**: Shadcn/ui components with Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom Musgrave brand color scheme and responsive design
- **State Management**: Local React state with custom hooks for database operations
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Data Fetching**: TanStack Query for server state management and caching

### Backend Architecture
- **Express Server**: Node.js with Express framework for API routes
- **Development Setup**: Vite dev server with HMR and middleware integration
- **Static Serving**: Production builds served as static files
- **Error Handling**: Centralized error middleware with structured responses
- **Logging**: Request/response logging with duration tracking

### Deployment Architecture
- **Static Deployment**: Configured for Replit static hosting
- **Build Process**: Vite builds to `dist/public/`, deployment script moves files to `dist/`
- **SPA Routing**: `_redirects` file handles client-side routing for React Router
- **Deployment Script**: `scripts/deploy-prepare.js` automates file preparation for static hosting
- **Build Command**: `npm run build` followed by deployment preparation script

### Data Storage Architecture
- **Client-side Database**: IndexedDB for offline-first data storage with better performance for large datasets
- **Schema Design**: Comprehensive schema including users, stores, products, taxes, delivery centers, purchase orders, order items, and sync tracking
- **Data Persistence**: IndexedDB native persistence across browser sessions
- **Sync Tracking**: sync_config table tracks last sync timestamps for incremental updates
- **Seed Data**: Pre-populated Spanish grocery data with realistic products, stores, and users (1,200+ products)
- **Offline Capabilities**: Full CRUD operations work offline with local database

### Database Schema Design
- **Users**: Store-associated users with authentication
- **Stores**: Physical store locations with delivery center associations
- **Products**: Grocery items with pricing, tax codes, and metadata
- **Purchase Orders**: B2B order management with status tracking
- **Orders**: Customer order processing and fulfillment
- **Taxes**: Spanish IVA tax rate management
- **Delivery Centers**: Regional distribution centers

### Authentication and Authorization
- **Simple Authentication**: Email/password based login stored in local database
- **Session Management**: Client-side user state management
- **Store Association**: Users are tied to specific store locations
- **Role-based Access**: Store-level data isolation

### Mobile-First Design
- **Responsive Layout**: Tailored for mobile devices with touch-friendly interfaces
- **Progressive Web App**: Offline functionality and app-like experience
- **Touch Interactions**: Optimized for grocery store floor usage
- **Cart Management**: Persistent shopping cart with quantity controls

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **TypeScript**: Full TypeScript support across frontend and backend
- **Vite**: Build tool and development server with HMR
- **Express**: Backend web framework

### UI and Styling
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Data Management
- **SQL.js**: SQLite compiled to WebAssembly for browser usage
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation and type safety

### Development Tools
- **Drizzle Kit**: Database migration and schema management (configured for PostgreSQL)
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

### Database Integration
- **Neon Database**: PostgreSQL serverless database provider
- **Drizzle ORM**: Type-safe SQL query builder
- **Connect PG Simple**: PostgreSQL session store

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Variant-based styling utilities
- **CLSX**: Conditional className utility
- **Nanoid**: Unique ID generation

The application is designed to work primarily offline with the SQL.js database, but includes infrastructure for PostgreSQL integration when online connectivity and server synchronization are required.