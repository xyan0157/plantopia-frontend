# Plantopiaa Frontend

Vue.js frontend for Plantopiaa - Climate-adaptive plant recommendation application for Melbourne suburbs.

## Tech Stack
- Vue 3 + TypeScript
- Vite
- Bootstrap 5
- Vue Router
- Pinia

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env.development` for local development:
```
VITE_API_URL=http://localhost:8000
```

Create `.env.production` for production:
```
VITE_API_URL=http://34.70.141.84
```

## Deployment

This project is deployed on Vercel. Push to main branch triggers automatic deployment.

## Backend API

Production backend is hosted on GCP at http://34.70.141.84

API Documentation available at: http://34.70.141.84/docs

## Project Structure

```
src/
  components/        # Reusable Vue components
  views/             # Page components
    recommendation/  # Recommendation system components
    ...
  services/          # API and utility services
  router/            # Vue Router configuration
  assets/            # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build-prod` - Build for production (Vercel)
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests