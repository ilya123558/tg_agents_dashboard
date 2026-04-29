# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

**Next.js 15 + TypeScript** project using **Feature-Sliced Design (FSD)** with **Redux Toolkit + RTK Query** and **Tailwind CSS + SCSS**.

### FSD Layer Hierarchy & Import Rules

```
app      → views, widgets, features, entities, shared  (Next.js routing only)
widgets  → views, features, entities, shared
features → views, entities, shared
entities → views, shared
shared   → (isolated — imports nothing from this project)
views    → (isolated — imports nothing from this project)
```

`app/` contains only Next.js routing files (layout.tsx, page.tsx). No business logic.

`views` is a non-standard but intentional layer: store, providers, styles, fonts, lib, config, hooks. Available to all layers, imports from none.

An empty `pages/` folder at the **project root** is required — prevents Next.js from treating `src/pages/` as Pages Router fallback.

### Path Aliases (tsconfig.json)

`@/app/*`, `@/views/*`, `@/widgets/*`, `@/features/*`, `@/entities/*`, `@/shared/*`

---

## views/ — Global Config Layer

### Store & Hooks

- Store: [src/views/store/store.ts](src/views/store/store.ts) — add reducers here
- Typed hooks: [src/views/store/hooks.ts](src/views/store/hooks.ts) — `useAppDispatch`, `useAppSelector`, `useAppStore`
- Providers: [src/views/providers/index.tsx](src/views/providers/index.tsx) — add new providers here

### Hooks (`@/views/hooks` or `@/views`)

| Hook | Description |
|---|---|
| `useAppDispatch`, `useAppSelector`, `useAppStore` | Typed Redux hooks |
| `useLoading({ initialLoading?, ms_timeout? })` | Loading state with minimum display time. Returns `{ isLoading, setLoading, LoadingWrapper }` |
| `useDebounce(value, delay)` | Debounces a value |
| `useDebouncedCallback(fn, delay)` | Debounces a function |
| `useThrottle(value, limit)` | Throttles a value |
| `useThrottledCallback(fn, limit)` | Throttles a function |
| `useToggle(initial?)` | Returns `[value, toggle, setTrue, setFalse]` |
| `useLocalStorage(key, initial?)` | Syncs state with localStorage. Returns `{ value, setValue, removeValue }` |
| `useClickOutside(ref, callback)` | Fires callback on click outside element |
| `useMediaQuery(query)` | Matches CSS media query. SSR-safe |
| `useBreakpoints()` | Returns `{ isMobile, isTablet, isDesktop }` |
| `usePrevious(value)` | Returns previous value of state/prop |

### Lib (`@/views/lib` or `@/views`)

| Function | Description |
|---|---|
| `cn(...classes)` | Merges class names, filters falsy values |
| `formatPrice(value, { separator?, suffix? })` | `10000` → `'10 000₽'` |
| `formatDate(date)` | Date → Russian locale string |
| `throttle(fn, limit)` | Rate-limit a function (non-React) |
| `pluralize(count, [one, few, many])` | Russian word declension |
| `truncate(text, maxLength, suffix?)` | Truncate string with suffix |
| `capitalize(text)` | First letter uppercase |
| `groupBy(array, key)` | Group array by key |
| `formatBytes(bytes, decimals?)` | `1024` → `'1 KB'` |
| `sleep(ms)` | `await sleep(500)` |
| `getStorage(key, fallback?)` | Read from localStorage |
| `setStorage(key, value)` | Write to localStorage |
| `removeStorage(key)` | Remove from localStorage |
| `hasStorage(key)` | Check key exists in localStorage |

### Styles

- Global styles: [src/views/styles/globals.scss](src/views/styles/globals.scss) — Tailwind + skeleton animation
- SCSS variables: [src/views/styles/_variables.scss](src/views/styles/_variables.scss) — CSS custom properties
- Fonts: [src/views/styles/_fonts.scss](src/views/styles/_fonts.scss) — add `@font-face` here, place font files in [src/views/fonts/](src/views/fonts/)
- App constants/routes: [src/views/config/constants.ts](src/views/config/constants.ts)

---

## shared/ — Reusable UI & API

### UI Components (`@/shared/ui` or `@/shared`)

**Button**
```tsx
<Button onClick={fn} className="...">Click</Button>
```

**Loading** — animated spinner
```tsx
<Loading size={40} trackColor="#DBEAFE" indicatorColor="#2563EB" speed={0.8} />
```

**Modal** — portal-based, closes on Escape + backdrop click, blocks scroll
```tsx
const [isOpen, , open, close] = useToggle();
<Modal isOpen={isOpen} setIsOpen={close} className="...">Content</Modal>
```

**ImageWithSkeleton** — drop-in replacement for `next/image` with auto skeleton
```tsx
// fixed size
<ImageWithSkeleton src="/photo.jpg" alt="..." width={400} height={400} className="rounded-xl" />

// fill mode — parent must be relative with dimensions
<div className="relative w-full aspect-square">
  <ImageWithSkeleton src="/photo.jpg" alt="..." fill className="object-cover" />
</div>
```

**AnimationHeightWrapper** — animate height open/close (accordions, collapses)
```tsx
<AnimationHeightWrapper isOpen={isOpen} maxHeight={300}>content</AnimationHeightWrapper>
```

**AnimationWidthWrapper** — animate width open/close (sidebars, panels)
```tsx
<AnimationWidthWrapper isOpen={isOpen} maxWidth={250}>sidebar</AnimationWidthWrapper>
```

**Slider / Slide** — Swiper-based slider (requires `swiper` package)
```tsx
<Slider slidesPerView={2} spaceBetween={16} prevButton={<Prev />} nextButton={<Next />}>
  <Slide><Card /></Slide>
</Slider>
```

**Responsive components** — Tailwind breakpoints, SSR-safe
```tsx
<Sm>0–639px</Sm>        <SmUp>640px+</SmUp>
<Md>0–767px</Md>        <MdUp>768px+</MdUp>
<Lg>0–1023px</Lg>       <LgUp>1024px+</LgUp>
<Xl>0–1279px</Xl>       <XlUp>1280px+</XlUp>
<XXl>0–1535px</XXl>     <XXlUp>1536px+</XXlUp>
```

### API

- Base RTK Query API: [src/shared/api/baseApi.ts](src/shared/api/baseApi.ts) — reads `NEXT_PUBLIC_API_URL`
- All entity APIs inject endpoints into `baseApi`

### Types

- [src/shared/types/index.ts](src/shared/types/index.ts) — global TypeScript types

---

## Adding New Slices

**Entity:**
```typescript
// entities/Product/model/types.ts
export interface Product { id: string; title: string; price: number; }

// entities/Product/api/productApi.ts
export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({ query: () => '/products' }),
  }),
});

// entities/Product/index.ts — public API only
export { productApi } from './api/productApi';
export type { Product } from './model/types';
```

**Feature:**
```typescript
// features/addToCart/model/slice.ts
const slice = createSlice({ name: 'cart', initialState: { items: [] },
  reducers: { addItem: (state, action) => { state.items.push(action.payload); } },
});

// features/addToCart/ui/AddToCartButton.tsx
const dispatch = useAppDispatch();
<Button onClick={() => dispatch(addItem(id))}>Add to Cart</Button>
```

**Widget (composes entities + features):**
```typescript
// widgets/ProductCard/ui/ProductCard.tsx
import { Product } from '@/entities/Product';
import { AddToCartButton } from '@/features/addToCart';
```

**Adding a reducer to the store:**
```typescript
// src/views/store/store.ts
import { myFeatureReducer } from '@/features/myFeature';
reducer: { [baseApi.reducerPath]: baseApi.reducer, myFeature: myFeatureReducer }
```
