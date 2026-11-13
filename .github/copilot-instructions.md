# Copilot Instructions for windapp

## What is windapp?

**windapp** is a modern, modular web application for displaying wind forecasts and comparing forecasts from multiple weather data sources. It provides:

- **Multi-source forecasting**: Aggregates data from Open-Meteo, SMHI, and MET Norway weather APIs
- **Real-time visualization**: Interactive SVG charts with smooth curves, hover readouts, and forecast tables
- **Location selection**: Fetch forecasts for any geographic location via coordinates
- **User preferences**: Toggle between forecast sources, adjust time horizons, choose units (m/s or knots)
- **Responsive UI**: Works on desktop and mobile with Leaflet-based map integration
- **Multiple solutions**: Supports switching between different forecast implementations/views

Originally a 1,347-line monolithic HTML application, it has been refactored into a **modular React + TypeScript architecture** using:
- **React 19** with functional components and hooks
- **TypeScript 5.3** for strict type safety
- **Vite 5** for fast development and optimized builds
- **React Router 7** for multi-view navigation
- **Zustand 4** for state management with localStorage persistence
- **Leaflet** for interactive mapping

The app is **domain-driven**, separating business logic, API clients, configuration, and UI components into distinct layers.

---

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.3.1 | UI framework |
| `react-dom` | ^19.3.1 | React DOM rendering |
| `react-router-dom` | ^7.18.5 | Client-side routing and navigation |
| `zustand` | ^4.4.0 | Lightweight state management |
| `leaflet` | ^1.9.4 | Interactive maps |
| `react-leaflet` | ^4.2.1 | React bindings for Leaflet |

### Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.0 | Type checking and compilation |
| `vite` | ^5.0.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.1.0 | React Fast Refresh for Vite |
| `eslint` | ^8.50.0 | Code linting |
| `@typescript-eslint/eslint-plugin` | ^6.0.0 | TypeScript ESLint rules |
| `@typescript-eslint/parser` | ^6.0.0 | TypeScript parser for ESLint |
| `eslint-plugin-react` | ^7.33.0 | React-specific lint rules |
| `eslint-plugin-react-hooks` | ^4.6.0 | React hooks lint rules |
| `@stylistic/eslint-plugin` | ^5.10.0 | Code formatting (indent, quotes, spacing) |
| `terser` | ^5.51.2 | JavaScript minification |

---

## TypeScript Configuration

**File**: `tsconfig.json`

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2020",              // Compile to modern JavaScript
    "lib": ["ES2020", "DOM", "DOM.Iterable"],  // DOM APIs available
    "module": "ESNext",              // Use ES modules
    "jsx": "react-jsx",              // React 17+ JSX transform
    "strict": true,                  // Enable all strict type checks
    "noUnusedLocals": true,          // Error if local variables are unused
    "noUnusedParameters": true,      // Error if function parameters are unused
    "noFallthroughCasesInSwitch": true, // Error on fallthrough switch cases
    "noEmit": true,                  // Don't emit compiled files (Vite handles it)
    "moduleResolution": "bundler",   // Modern module resolution for bundler
    "skipLibCheck": true,            // Skip type checking of declaration files
    "esModuleInterop": true,         // CommonJS/ES module interop
    "isolatedModules": true,         // Each file is independently transpilable
    "allowImportingTsExtensions": true, // Allow importing .ts files
    "resolveJsonModule": true        // Allow importing JSON
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Key Rules Enforced

- ✅ **Strict mode enabled** - All types must be explicit; no implicit `any`
- ✅ **No unused locals** - All declared variables must be used
- ✅ **No unused parameters** - Use `_paramName` pattern to intentionally ignore
- ✅ **No fallthrough cases** - Switch statements must break or return
- ✅ **No implicit any** - Always specify types for function parameters and return values

---

## ESLint Configuration

**File**: `.eslintrc.json`

### Extended Configurations

```json
{
  "extends": [
    "eslint:recommended",                    // ESLint core rules
    "plugin:@typescript-eslint/recommended", // TypeScript-specific rules
    "plugin:react/recommended",              // React best practices
    "plugin:react-hooks/recommended"         // React hooks rules
  ]
}
```

### Rule Set

#### React Rules

```json
"react/react-in-jsx-scope": "off",    // Not needed with React 17+ JSX transform
"react/prop-types": "off"             // TypeScript handles prop validation
```

#### TypeScript Rules

```json
"@typescript-eslint/no-unused-vars": [
  "error",
  {
    "argsIgnorePattern": "^_",   // Allow unused params starting with _
    "varsIgnorePattern": "^_"    // Allow unused vars starting with _
  }
]
```

#### Stylistic/Formatting Rules (via @stylistic)

```json
"@stylistic/indent": ["error", 2],
"@stylistic/quotes": ["error", "single"],
"@stylistic/semi": ["error", "always"],
"@stylistic/no-trailing-spaces": "error",
"@stylistic/eol-last": ["error", "always"]
```

### Running Lint

```bash
npm run lint        # Check for linting issues
npm run fix         # Auto-fix formatting and simple issues
```

### VS Code Auto-Fix

Configured in `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

When you save a file, ESLint automatically:
- Fixes formatting (indentation, quotes, semicolons, spacing)
- Reports remaining errors and warnings in the Problems panel

---

## Vite Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],  // Enable React Fast Refresh
  build: {
    outDir: 'dist',           // Output directory
    sourcemap: false,         // No sourcemaps in production
    minify: 'terser',         // Minify with Terser
  },
  server: {
    port: 3000,  // Dev server port
    open: true,  // Auto-open browser
  },
});
```

### Development Server

```bash
npm run dev  # Starts on http://localhost:3000
```

Features:
- Hot Module Replacement (HMR) for instant code updates
- Fast refresh for React components
- Full TypeScript checking

### Production Build

```bash
npm run build  # Runs: tsc && vite build
```

Process:
1. TypeScript compiler (`tsc`) checks types and reports errors (no emit)
2. Vite builds and minifies to `dist/` directory
3. Output is optimized for GitHub Pages deployment

---

## Project Architecture

### Directory Structure

```
windapp/
├── src/
│   ├── components/                  # Global app components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── SettingsDrawer.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── pages/
│   │   ├── WeatherPage.tsx          # Main page container
│   │   ├── hooks/
│   │   └── index.ts
│   ├── features/
│   │   ├── weather/                 # Weather forecast feature
│   │   │   ├── components/
│   │   │   │   ├── ForecastView.tsx
│   │   │   │   └── MapView.tsx
│   │   │   ├── hooks/
│   │   │   ├── interfaces/
│   │   │   ├── styled/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── magnus/                  # Magnus solution feature
│   │       ├── components/
│   │       │   └── MagnusSolution.tsx
│   │       ├── hooks/
│   │       ├── interfaces/
│   │       ├── styled/
│   │       ├── types.ts
│   │       └── index.ts
│   ├── domain/
│   │   └── weather/
│   │       └── models.ts            # Pure domain models
│   ├── api/
│   │   ├── types.ts                 # API response types
│   │   ├── weatherApi.ts            # Public facade
│   │   └── services/
│   │       ├── openMeteoClient.ts
│   │       ├── smhiClient.ts
│   │       ├── metNoClient.ts
│   │       ├── mockWeatherClient.ts
│   │       └── weatherService.ts    # Orchestrator
│   ├── stores/
│   │   └── appStore.ts              # Zustand state
│   ├── config/
│   │   └── index.ts                 # Centralized configuration
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts                     # Re-exports and type definitions
│   └── vite-env.d.ts
├── .eslintrc.json
├── tsconfig.json
├── vite.config.ts
├── package.json
└── .github/
    └── copilot-instructions.md
```

### Architecture Principles

#### Global Components

- **Components** (`src/components/`) - App-level components used across pages
  - Organized by category (e.g., `layout/`, `ui/`, etc.)
  - Truly global components only (Header, Footer, shared UI primitives)
  - Expose public API via `index.ts`

#### Page Organization

- **Pages** (`src/pages/`) - Top-level page containers and utilities
  - Minimal, focused page components
  - Coordinate features and global layout
  - May contain page-specific hooks
  - Expose public API via `index.ts`

#### Feature Organization

- **Features** (`src/features/`) - Self-contained feature modules at root level
  - Each feature is independent and reusable
  - Features are **NOT nested inside pages**
  - Named concisely: `weather`, `magnus` (not `weather-feature`, `initial-weather-feature`)

#### Feature Structure

Each feature is a self-contained module with its own organizational structure:

```
features/weather/
├── components/              # All UI components for this feature
│   ├── ForecastView.tsx
│   └── MapView.tsx
├── hooks/                   # Feature-specific hooks (useWeatherData, etc.)
├── interfaces/              # Feature-specific type definitions/interfaces
├── styled/                  # Feature-specific styled components or CSS
├── types.ts                 # Feature types
└── index.ts                 # Public API (re-exports)
```

**Key principle:** All components, hooks, interfaces, and styles are **feature-scoped**. If a component or hook is used by multiple features, move it to `src/components/` (global) or the domain/api layers.

**Public API via index.ts:**

```typescript
// src/features/weather/index.ts
export { ForecastView } from './components/ForecastView';
export { MapView } from './components/MapView';
```

**Pages import components and features:**

```typescript
// src/pages/WeatherPage.tsx
import { Header, Footer, SettingsDrawer } from '@/components/layout';
import { ForecastView, MapView } from '@/features/weather';
```

### Domain-Driven Design Layers

#### 1. Domain Layer (`src/domain/`)

Contains **pure business logic** independent of APIs or frameworks:

```typescript
// src/domain/weather/models.ts
export interface ForecastPoint {
  time: number;        // Unix timestamp (ms)
  speed: number | null; // Wind speed (m/s)
  gust: number | null;  // Gust speed (m/s)
  dir: number | null;   // Direction (0-360 degrees)
  lull: number | null;  // Minimum wind (m/s)
}

export interface ForecastSeries {
  name: string;
  points: ForecastPoint[];
}

export interface WeatherData {
  series: Record<string, ForecastSeries>;
  errors: Record<string, string>;
  timestamp: number;
}
```

#### 2. Configuration Layer (`src/config/`)

Centralized **constants and environment-specific settings**:

```typescript
// src/config/index.ts
export const config = {
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    models: ['dmi_harmonie_arome_europe', '...'],
  },
  smhi: { baseUrl: '...' },
  metNo: { baseUrl: '...' },
  location: { DEFAULT_LOCATION: { lat: 57.325, lon: 12.105 } },
};
```

#### 3. API Layer (`src/api/`)

**Internal API response types** and **service clients**:

```typescript
// src/api/types.ts - Internal, not exposed
export interface OpenMeteoResponse { /* ... */ }

// src/api/services/openMeteoClient.ts
export class OpenMeteoClient {
  async fetchForecast(lat: number, lon: number): Promise<Record<string, ForecastPoint[]>> {
    // Fetch from API, parse, return domain types
  }
}

// src/api/weatherApi.ts - Public facade
export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const service = new WeatherService();
  return service.fetchWeatherData(lat, lon);
}
```

#### 4. State Layer (`src/stores/`)

**Global state management** with Zustand:

```typescript
// src/stores/appStore.ts
export const useAppStore = create(
  persist(
    (set) => ({
      data: null,
      loading: false,
      settings: { /* ... */ },
      activeView: 'forecast',
      setData: (data) => set({ data }),
      // ...
    }),
    {
      name: 'appStore',
      partialize: (state) => ({ /* ... */ }),  // Serialize
      merge: (persisted, current) => ({ /* ... */ }),  // Deserialize
    }
  )
);
```

#### 5. Component Layer (`src/components/`)

**React components** using domain types and public APIs:

```typescript
// src/components/ForecastView.tsx
import { WeatherData } from '../types';  // Re-exported domain types
import { fetchWeatherData } from '../api/weatherApi';  // Public facade

export function ForecastView({ data, loading }: { data: WeatherData | null; loading: boolean }) {
  // Render using domain types
}
```

---

## Code Style & Best Practices

### TypeScript

#### ✅ Do

```typescript
// Explicit types on function parameters and returns
function formatWind(speed: number, unit: 'kn' | 'm/s'): string {
  return unit === 'kn' ? (speed * 1.94384).toFixed(1) : speed.toFixed(1);
}

// Use type inference for obvious cases
const location = { lat: 57.325, lon: 12.105 };  // inferred as { lat: number; lon: number }

// Use interfaces for domain models
interface ForecastPoint {
  time: number;
  speed: number | null;
}

// Use Record<K, V> for maps
const forecasts: Record<string, ForecastPoint[]> = {};

// Proper type casting
const L = (window as unknown as { L: Leaflet }).L;

// Use const assertions for literal types
const UNITS = ['kn', 'm/s'] as const;
type Unit = typeof UNITS[number];
```

#### ❌ Don't

```typescript
// Implicit any
function formatWind(speed, unit) { }

// Unnecessary any
const data: any = fetchWeatherData();

// Untyped callbacks
.map(p => ({ ...p, speed: p.speed * 1.94 }))  // p is implicitly any

// Bare type casts without unknown
const L = (window as any).L;
```

### React Hooks

#### ✅ Do

```typescript
// Move helper functions inside useEffect to avoid dependency issues
useEffect(() => {
  const convert = (v: number) => v * 1.94384;  // Inside effect
  const data = points.map(p => ({ ...p, speed: convert(p.speed) }));
  // use data
}, [points]);

// Use useCallback for functions in dependencies
const handleClick = useCallback(() => {
  setHidden(prev => new Set([...prev, name]));
}, []);

// Explicitly list dependencies
useEffect(() => {
  loadData();
}, [setData, setLoading]);  // All external values listed

// Early return for conditions
useEffect(() => {
  if (!data || !chartRef.current) return;
  // render chart
}, [data]);
```

#### ❌ Don't

```typescript
// Function defined outside useEffect but used inside
const convert = (v: number) => v * 1.94384;
useEffect(() => {
  const data = points.map(p => ({ ...p, speed: convert(p.speed) }));
}, [points, convert]);  // convert shouldn't be in dependencies

// Missing dependencies
useEffect(() => {
  loadData(id);
}, []);  // Missing id dependency

// Conditional returns in component body (after first render)
if (data) return <div>...</div>;  // Use inside useEffect instead
```

### React Components

#### ✅ Do

```typescript
// Functional components with typed props
interface ForecastViewProps {
  data: WeatherData | null;
  loading: boolean;
}

export function ForecastView({ data, loading }: ForecastViewProps) {
  return <section id="viewForecast">...</section>;
}

// Arrow functions for event handlers
<button onClick={() => handleClick(id)}>Click</button>

// Use CSS variables for theming
<div style={{ '--color': colorOf(name) } as React.CSSProperties}>

// Proper React.CSSProperties typing for inline styles
const buttonStyle: React.CSSProperties = { color: 'blue', padding: '10px' };
<button style={buttonStyle}>Click</button>
```

#### ❌ Don't

```typescript
// Unnamed component props
export function ForecastView(props) {
  const { data, loading } = props;
}

// Function declarations in render
function handleClick() { }
<button onClick={handleClick}>  // Recreated on every render

// Implicit any styles
const style = { '--c': color } as any;

// Prop types in TypeScript (type-checking is enough)
ForecastView.propTypes = { data: PropTypes.object };
```

### Naming Conventions

```typescript
// Components (PascalCase)
export function ForecastView() { }

// Functions and variables (camelCase)
const fetchWeatherData = async () => { };
const isHidden = false;

// Constants (UPPER_SNAKE_CASE for top-level constants)
export const DEFAULT_LOCATION = { lat: 57.325, lon: 12.105 };

// CSS classes (kebab-case)
<div className="chart-wrap">
<button className="mrow">

// Event handlers (on + CamelCase)
<button onClick={handleForecastToggle}>
<input onChange={handleUnitChange} />

// Boolean variables (is/has prefix)
const isLoading = true;
const hasError = false;
const canDelete = permissions.includes('delete');

// Forecast model names (exact match)
const MODELS = ['DMI', 'Nordic', 'ECMWF', 'SMHI SNOW', 'MET Norway'];
```

### Error Handling

```typescript
// Use try-catch in async functions
try {
  const data = await fetchWeatherData(lat, lon);
  setData(data);
} catch (error) {
  console.error('Failed to load weather data:', error);
  setData({ series: {}, errors: { 'Load Error': String(error) } });
}

// Type error objects properly
const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
};
```

### Imports

```typescript
// Always use path aliases for imports (cleaner, more maintainable)
import type { WeatherData, ForecastPoint } from '@/types';
import { fetchWeatherData } from '@/api/weatherApi';
import { useAppStore } from '@/stores/appStore';
import { ForecastView } from '@/features/weather';

// Import types explicitly for clarity
import type { ForecastSeries } from '@/domain/weather/models';
import { WeatherService } from '@/api/services/weatherService';

// Group imports: types, then modules
import type { Props } from './types';
import React, { useEffect } from 'react';

// No unused imports - ESLint will error
// If you need to import but not use, prefix with _:
import type { _UnusedType } from './types';
```

### Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

```
@/* → src/*
```

Use the `@/` prefix for all imports from `src/`, never relative paths:

```typescript
// ✅ Good
import { ForecastView } from '@/features/weather';
import { useAppStore } from '@/stores/appStore';
import type { WeatherData } from '@/types';

// ❌ Avoid
import { ForecastView } from '../../../features/weather';
import { useAppStore } from '../../stores/appStore';
```

### Comments

```typescript
// Only comment non-obvious logic
const conv = (v: number | null | undefined) => {
  // Handle null/undefined and convert m/s to knots if needed
  if (v == null) return null;
  return unit === 'kn' ? v * 1.94384 : v;
};

// Don't comment obvious code
const isHidden = hidden.has(name);  // No comment needed
const color = colorOf(name);         // No comment needed
```

### Formatting

All formatting is handled by ESLint `@stylistic` plugin:

```typescript
// ✅ Correct
const obj = { a: 1, b: 2 };
const arr = [1, 2, 3];
function myFn() { return 'value'; }
const arrow = () => { };

// ❌ Will be auto-fixed
const obj={a:1,b:2}
const arr=[1,2,3]
function myFn(){return'value'}
const arrow=()=>{}
```

Run `npm run fix` to auto-format all files.

---

## Good Coding Practices Checklist

### Before Writing Code

- [ ] Understand the data flow: Domain → API → Store → Components
- [ ] Use existing types from `src/types.ts`
- [ ] Check `src/config/index.ts` for constants
- [ ] Review related components for patterns

### While Writing Code

- [ ] Use explicit types on function parameters and returns
- [ ] No `any` without proper type casting via `unknown`
- [ ] Move helper functions inside `useEffect` to avoid dependency issues
- [ ] List all dependencies explicitly in effect hooks
- [ ] Use `_` prefix for intentionally unused variables
- [ ] Keep components focused on rendering, move logic to custom hooks
- [ ] Use React.CSSProperties for inline styles
- [ ] Follow naming conventions (PascalCase components, camelCase functions)

### After Writing Code

- [ ] Run `npm run lint` and resolve all errors/warnings
- [ ] Run `npm run build` and verify TypeScript compilation succeeds
- [ ] Test in browser: check Console for errors
- [ ] Test API calls: check Network tab for 200 responses
- [ ] Commit code with descriptive messages

### Code Review Checklist

- [ ] All types are explicit (no implicit `any`)
- [ ] No unused imports or variables
- [ ] Function parameters have types
- [ ] React hooks have all dependencies listed
- [ ] Components are pure (same props → same output)
- [ ] Error handling is present for API calls
- [ ] CSS uses semantic class names
- [ ] No commented-out code left behind
- [ ] Follows project naming conventions
- [ ] Lint passes without warnings

---

## Running the App

### Development

```bash
npm install          # Install dependencies
npm run dev         # Start dev server on http://localhost:3000
npm run lint        # Check for linting issues
npm run fix         # Auto-fix formatting
```

### Production Build

```bash
npm run build       # Build for production (dist/)
npm run preview     # Preview production build locally
```

### Environment

- **Node.js**: 16+ (uses ES2020)
- **Package manager**: npm or pnpm
- **Browser**: Modern browsers with ES2020 support
- **Dev server**: Vite (http://localhost:3000)
- **Build tool**: Vite + Terser minification

---

## Debugging Tips

### Console Logging

Use prefixed console logs for easier filtering:

```typescript
console.log('App: Component mounted');
console.log('WeatherContent: Got data:', data);
console.error('SettingsDrawer: Invalid value:', error);
```

Filter in DevTools: `App:`, `WeatherContent:`, etc.

### React DevTools

1. Install [React DevTools](https://react-devtools-tutorial.vercel.app/)
2. Inspect components in browser
3. Check Zustand store state in Console:
   ```javascript
   const state = document.querySelector('body').__reactFiber$;
   console.log(state);
   ```

### Network Debugging

1. Open DevTools → Network tab
2. Check API calls to weather services:
   - Open-Meteo: `api.open-meteo.com` (200 OK)
   - SMHI: `opendata-download-metfcst.smhi.se` (200 OK)
   - MET Norway: `api.met.no` (200 OK)
3. Verify response has correct data structure

### localStorage

```javascript
// Check persisted state
JSON.parse(localStorage.getItem('appStore'));

// Clear state
localStorage.removeItem('appStore');

// Enable mock mode
useAppStore.getState().setMockMode(true);
```

---

## Git & Commit Practices

### Branch Naming

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/change-name` - Code refactoring

### Commit Messages

```
type(scope): description

body (optional)

footer (optional)
```

Example:
```
feat(forecast): add smooth curve interpolation

Implement Fritsch-Carlson monotone cubic interpolation
for wind speed curves in the forecast chart.

Closes #42
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring (no feature change)
- `style:` - Formatting, missing semicolons, etc.
- `docs:` - Documentation
- `test:` - Adding or updating tests
- `chore:` - Build, dependencies, tooling

---

## Performance Considerations

### Code Splitting

Components are lazy-loaded via React Router (see `App.tsx`):

```typescript
// Automatic code splitting per route
<Route path="forecast" Component={ForecastView} />
<Route path="magnus" Component={MagnusSolution} />
```

### Memoization

Only memoize when needed:

```typescript
// Memoize expensive functions in dependencies
const handleClick = useCallback(() => {
  setHidden(prev => new Set([...prev, name]));
}, [name]);  // Only recreated when name changes

// Memoize expensive renders
const MemoizedChart = React.memo(ChartComponent, (prev, next) => {
  return prev.data === next.data;  // Only re-render if data changes
});
```

### Bundle Size

Current build size: ~69KB gzipped

Monitor:
```bash
npm run build  # Check output
# View dist/assets/ for bundle sizes
```

---

## Deployment

### GitHub Pages

Automatic deployment via GitHub Actions (if configured):

1. Push to `main` branch
2. GitHub Actions builds and deploys to `gh-pages`
3. App available at `https://dalbinsson.github.io/windapp/`

### Manual Deployment

```bash
npm run build
# Deploy dist/ directory to hosting provider
```

### Environment Detection

Router basename is automatically detected:

```typescript
// localhost:5173 → basename = "/"
// gh-pages → basename = "/windapp"

const basename = window.location.hostname === 'localhost' ? '/' : '/windapp';
```

---

## Resources & References

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Router v7](https://reactrouter.com/)
- [Leaflet API](https://leafletjs.com/reference.html)

---

## FAQ

### Q: Should I use `any` type?

**A:** Only with proper casting via `unknown`:
```typescript
const L = (window as unknown as { L: Leaflet }).L;
```

Never bare `any`:
```typescript
// ❌ Wrong
const data: any = fetchData();

// ✅ Right
const data: WeatherData | null = fetchData();
```

### Q: How do I add a new weather API source?

**A:** Follow this pattern:
1. Create `src/api/services/newSourceClient.ts`
2. Add response type to `src/api/types.ts`
3. Add config to `src/config/index.ts`
4. Register in `src/api/services/weatherService.ts`
5. Update Settings UI in `src/components/SettingsDrawer.tsx`

### Q: How do I update the UI state?

**A:** Use Zustand store:
```typescript
const { setData, setLoading } = useAppStore();
setData(newData);
setLoading(false);
```

### Q: How do I handle API errors?

**A:** Wrap in try-catch and store errors:
```typescript
try {
  const data = await fetchWeatherData(lat, lon);
  setData(data);
} catch (error) {
  setData({ series: {}, errors: { 'API Error': String(error) } });
}
```

### Q: How do I debug localStorage issues?

**A:** In browser console:
```javascript
// View persisted state
console.log(JSON.parse(localStorage.getItem('appStore')));

// Clear and reload
localStorage.removeItem('appStore');
location.reload();
```

---

**Last updated**: 2026-11-13

For more details, see specific files or open an issue on GitHub.

---

## Named Exports & No Default Exports

**Rule**: Use named `const` exports for components, not default exports or function declarations.

This project enforces `import/no-default-export` rule to ensure:
- Consistent import patterns
- Easier refactoring and renaming
- Better tree-shaking in bundlers
- Reduced confusion about what's exported

### ✅ Correct Pattern

```typescript
// src/components/ForecastView.tsx
export const ForecastView = ({ data, loading }: ForecastViewProps) => {
  return <section id="viewForecast">...</section>;
};
```

```typescript
// src/App.tsx
import { ForecastView } from './components/ForecastView';
```

```typescript
// src/main.tsx
import { App } from './App';
```

### ❌ Wrong Patterns

```typescript
// ❌ Function declaration with default export
function ForecastView() { }
export default ForecastView;

// ❌ Default export arrow function
const ForecastView = () => { };
export default ForecastView;

// ❌ Mixing named and default
export const ForecastView = () => { };
export default ForecastView;
```

### ESLint Rule

Configured in `.eslintrc.json`:

```json
{
  "plugins": ["import"],
  "rules": {
    "import/no-default-export": "error"
  },
  "overrides": [
    {
      "files": ["*.d.ts"],
      "rules": {
        "import/no-default-export": "off"
      }
    }
  ]
}
```

Exception: TypeScript declaration files (`*.d.ts`) are allowed to use default exports.

### Why Named Exports?

1. **Consistency**: All components follow the same pattern
2. **Refactoring**: Rename the component once (in its definition), not in every import statement
3. **Tree-shaking**: Bundlers can better identify unused code
4. **IDE support**: Better autocomplete and refactoring tools support
5. **Clarity**: Explicit about what's being exported

### Migration Example

If adding a new component:

```typescript
// ❌ Start here
function MyComponent() {
  return <div>content</div>;
}

export default MyComponent;
```

```typescript
// ✅ After fix
export const MyComponent = () => {
  return <div>content</div>;
};
```

```typescript
// ✅ Then import as
import { MyComponent } from './components/MyComponent';
```

---

## Application Routing & Navigation

**File**: `src/App.tsx`, configured with **React Router v7**

### Route Structure

The application uses React Router for multi-page navigation:

```typescript
// Main routes
/weather    - Weather forecast page (default, root /)
/magnus     - Magnus solution page
```

### Page Components

#### WeatherPage (`src/pages/WeatherPage.tsx`)
- Main page for weather forecasts
- Contains two toggleable views: **Forecast** and **Map**
- Imports and manages:
  - `<Header />` - Navigation and settings
  - `<ForecastView />` or `<MapView />` - View switching
  - `<SettingsDrawer />` - User preferences
  - `<Footer />` - Credits

#### MagnusSolution (`src/features/magnus/`)
- Separate feature for Magnus solution
- Independent routing path

### Navigation Flow

```
App.tsx (React Router setup)
├── WeatherPage
│   ├── Header (view switcher, settings button)
│   ├── ForecastView (chart + table)
│   │   ├── Forecast chart rendering
│   │   └── Forecast table with data
│   ├── MapView (interactive map)
│   │   └── Leaflet map with forecasts
│   ├── SettingsDrawer (side panel)
│   │   ├── Units toggle (m/s, knots)
│   │   ├── Forecast horizon selector
│   │   ├── Table step selector
│   │   └── Forecast toggles (show/hide sources)
│   └── Footer (static credits)
└── MagnusSolution (separate route)
    └── Magnus-specific content
```

### Component Props & Data Flow

#### Header Component
```typescript
interface HeaderProps {
  onViewChange: (view: 'forecast' | 'map') => void;
  onSettingsClick: () => void;
  activeView: 'forecast' | 'map';
}
```

#### ForecastView Component
```typescript
interface ForecastViewProps {
  data: WeatherData | null;
  loading: boolean;
  settings: AppSettings;
}

export const ForecastView = ({ data, loading, settings }: ForecastViewProps) => {
  return (
    <section id="viewForecast">
      {/* Chart rendering - SVG paths from data.series */}
      {/* Forecast table - rows from data.series[key].points */}
    </section>
  );
};
```

#### MapView Component
```typescript
interface MapViewProps {
  data: WeatherData | null;
  loading: boolean;
}

export const MapView = ({ data, loading }: MapViewProps) => {
  return (
    <section id="viewMap">
      {/* Interactive Leaflet map */}
      {/* Forecast overlays for each location */}
    </section>
  );
};
```

#### SettingsDrawer Component
```typescript
interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
}

export const SettingsDrawer = ({ open, onClose, settings, onSettingsChange }: SettingsDrawerProps) => {
  return (
    <aside>
      {/* Units: select between 'm/s' and 'knots' */}
      {/* Horizon: select forecast window (12h, 24h, 48h, 96h) */}
      {/* Step: select table row intervals (3h, 6h, 12h) */}
      {/* Forecast toggles: show/hide each data source */}
    </aside>
  );
};
```

### View Switching Logic

```typescript
// In WeatherPage
const [activeView, setActiveView] = useState<'forecast' | 'map'>('forecast');

return (
  <>
    <Header activeView={activeView} onViewChange={setActiveView} />
    {activeView === 'forecast' && <ForecastView data={data} loading={loading} />}
    {activeView === 'map' && <MapView data={data} loading={loading} />}
  </>
);
```

### Settings Toggle Implementation

```typescript
// In SettingsDrawer
const handleToggleForecast = (sourceKey: string) => {
  const current = settings.hiddenForecasts || {};
  const updated = {
    ...settings,
    hiddenForecasts: {
      ...current,
      [sourceKey]: !current[sourceKey]
    }
  };
  onSettingsChange(updated);
};

// Filter forecasts based on settings
const visibleForecasts = Object.entries(data?.series || {})
  .filter(([key]) => !settings.hiddenForecasts?.[key])
  .map(([key, series]) => series);
```

---

## Complete Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   REACT COMPONENTS                       │
│  Header | ForecastView | MapView | SettingsDrawer       │
├─────────────────────────────────────────────────────────┤
│                   STATE MANAGEMENT (Zustand)             │
│  appStore: { data, settings, activeView, drawerOpen }   │
├─────────────────────────────────────────────────────────┤
│                   PUBLIC API FACADE                      │
│  fetchWeatherData() | setMockMode()                      │
├─────────────────────────────────────────────────────────┤
│                 WEATHER SERVICE (Orchestrator)           │
│  Coordinates Open-Meteo | SMHI | MET Norway clients     │
├─────────────────────────────────────────────────────────┤
│                   SERVICE CLIENTS                        │
│ OpenMeteoClient | SMHIClient | MetNoClient |MockClient  │
├─────────────────────────────────────────────────────────┤
│                  CONFIGURATION & CONFIG                  │
│  config.openMeteo | config.smhi | config.metNo          │
├─────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                          │
│  ForecastPoint | ForecastSeries | WeatherData           │
├─────────────────────────────────────────────────────────┤
│                EXTERNAL APIs (HTTP)                      │
│ Open-Meteo | SMHI | MET Norway | Leaflet API            │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User opens app** → `App.tsx` mounts
2. **useEffect** triggers on component mount → calls `fetchWeatherData()`
3. **fetchWeatherData()** (facade) creates `WeatherService` instance
4. **WeatherService** in parallel:
   - Calls `openMeteoClient.fetchForecast()`
   - Calls `smhiClient.fetchForecast()`
   - Calls `metNoClient.fetchForecast()`
5. **Each client** fetches its API, parses response → domain types
6. **WeatherService** aggregates all results → single `WeatherData` object
7. **App stores result** in `useAppStore.setData()`
8. **Zustand persists** to localStorage
9. **Components rerender** with new data
10. **ForecastView** renders chart from `data.series`
11. **SettingsDrawer** filters visible forecasts based on `hiddenForecasts`

### File Responsibilities

| File | Responsibility |
|------|-----------------|
| `src/App.tsx` | Route setup, main component, data fetching orchestration |
| `src/pages/WeatherPage.tsx` | Weather page container, view switching |
| `src/components/Header.tsx` | Navigation, view tabs, settings button |
| `src/components/ForecastView.tsx` | SVG chart + table rendering |
| `src/components/MapView.tsx` | Leaflet map wrapper |
| `src/components/SettingsDrawer.tsx` | Settings UI + state updates |
| `src/components/Footer.tsx` | Static credits/links |
| `src/stores/appStore.ts` | Zustand state, localStorage sync |
| `src/api/weatherApi.ts` | Public facade, entry point |
| `src/api/services/weatherService.ts` | Orchestrator, error handling, parallel fetching |
| `src/api/services/openMeteoClient.ts` | Open-Meteo API client |
| `src/api/services/smhiClient.ts` | SMHI API client |
| `src/api/services/metNoClient.ts` | MET Norway API client |
| `src/api/services/mockWeatherClient.ts` | Mock data generator |
| `src/config/index.ts` | Centralized config, baseUrls, defaults |
| `src/domain/weather/models.ts` | Pure domain types |
| `src/types.ts` | App-wide type exports |

### Data Structure Example

```typescript
// What ForecastView receives
const data: WeatherData = {
  series: {
    'dmi_arome': {
      name: 'DMI AROME Europe',
      points: [
        { time: 1698000000000, speed: 5.2, gust: 8.1, dir: 270, lull: 2.3 },
        { time: 1698003600000, speed: 5.5, gust: 8.4, dir: 268, lull: 2.5 },
        // ... more points
      ]
    },
    'smhi_forecast': {
      name: 'SMHI Forecast',
      points: [ /* ... */ ]
    },
    'met_nordic_pp': {
      name: 'MET Nordic Precipitation',
      points: [ /* ... */ ]
    },
    // ... more sources
  },
  errors: {
    // Only populated if a source fails
    'api_error': 'Open-Meteo timeout after 5s'
  },
  timestamp: Date.now()
};

// Component filters based on settings
const visibleSeries = Object.entries(data.series)
  .filter(([key]) => !settings.hiddenForecasts?.[key])
  .reduce((acc, [key, series]) => ({ ...acc, [key]: series }), {});
```

### Settings Structure

```typescript
interface AppSettings {
  units: 'kn' | 'm/s';                    // Display units
  horizon: 12 | 24 | 48 | 96;             // Forecast window (hours)
  tableStep: 3 | 6 | 12;                  // Table row intervals (hours)
  hiddenForecasts: Record<string, boolean>; // Toggle visibility of each source
}
```

---

## React 19 Features Used

The application leverages React 19's improvements:

1. **useActionState** - For form handling and async actions
2. **useFormStatus** - Integrated form submission tracking
3. **useTransition** - Smooth state updates for view switching
4. **useOptimistic** - Optimistic UI updates for settings changes
5. **Server Components compatibility** - Structure ready for future server-side features

---

## Debugging & Development

### React DevTools

1. Install [React DevTools Extension](https://react-devtools-tutorial.vercel.app/)
2. Open DevTools (F12)
3. Go to "Components" tab
4. Inspect component tree, props, hooks state
5. Profiler tab shows render performance

### Zustand DevTools

View and modify store state:
```typescript
// In browser console
useAppStore.getState()  // Current state
useAppStore.setState({ activeView: 'map' })  // Modify state
```

### Network Debugging

1. Open DevTools → Network tab
2. Make API calls
3. Inspect request/response for each weather source
4. Check response times and payloads

### TypeScript Checking

```bash
npm run type-check  # See all type errors
npx tsc --noEmit    # Same thing manually
```

### Common Issues

**Issue**: Weather data not loading
```typescript
// Check: Is fetchWeatherData being called?
// Check: useAppStore.getState().loading is false?
// Check: Network tab - API responses OK?
// Check: localStorage has cachedData?
```

**Issue**: Settings not persisting
```typescript
// Check: localStorage has 'appStore' key
localStorage.getItem('appStore')
// Check: hiddenForecasts structure correct
useAppStore.getState().settings.hiddenForecasts
```

**Issue**: View not switching
```typescript
// Check: Header onClick firing
// Check: setActiveView being called
console.log(useAppStore.getState().activeView)
// Check: Conditional render logic in WeatherPage
```

---

## Performance Considerations

### Code Splitting
- Each feature is independently loadable
- React Router enables lazy loading routes:
```typescript
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const MagnusSolution = lazy(() => import('./features/magnus'));
```

### Memoization
Use `React.memo()` for expensive renders:
```typescript
export const ForecastView = React.memo(({ data, loading, settings }: ForecastViewProps) => {
  // Only rerenders if data, loading, or settings change
});
```

### Virtualization
For long forecast tables (100+ rows), use `react-window`:
```bash
npm install react-window
```

Then use `FixedSizeList` for table rows:
```typescript
import { FixedSizeList as List } from 'react-window';

<List height={600} itemCount={points.length} itemSize={35} width="100%">
  {({ index, style }) => (
    <div style={style}>{/* Table row */}</div>
  )}
</List>
```

### Bundle Analysis
```bash
npm run build
# Check dist/ folder sizes in output
# If JS > 150KB gzipped, consider code splitting
```

---

**Last updated**: 2026-12-19

For more details, see specific files or open an issue on GitHub.

