# FSD Next.js Template

Шаблон проекта на основе архитектуры Feature-Sliced Design (FSD) с Next.js, TypeScript, Redux Toolkit, RTK Query и Tailwind CSS.

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev      # Development сервер
npm run build    # Production сборка
npm start        # Production сервер
npm run lint     # Линтинг
```

## Структура проекта

```
src/
├── app/                    # Next.js App Router (только роутинг)
│   ├── layout.tsx
│   └── page.tsx
│
├── views/                  # Глобальные настройки (FSD app-layer)
│   ├── store/             # Redux Store + типизированные хуки
│   ├── providers/         # React провайдеры
│   ├── hooks/             # Переиспользуемые хуки
│   ├── lib/               # Утилитарные функции
│   ├── styles/            # Tailwind + SCSS
│   ├── fonts/             # Шрифты
│   └── config/            # Константы и конфигурация
│
├── widgets/                # Композитные блоки UI
├── features/               # Бизнес-логика
├── entities/               # Бизнес-модели
│
└── shared/                 # Переиспользуемые модули
    ├── api/               # Базовая настройка RTK Query
    ├── ui/                # UI-компоненты
    └── types/             # Общие TypeScript типы
```

> `pages/` в корне проекта — пустая папка, обязательна для корректной работы Next.js App Router.

## Правила импортов

```
app      → views, widgets, features, entities, shared
widgets  → views, features, entities, shared
features → views, entities, shared
entities → views, shared
shared   → ничего (изолирован)
views    → ничего (изолирован)
```

## TypeScript Path Aliases

```
@/app/*      → src/app/
@/views/*    → src/views/
@/widgets/*  → src/widgets/
@/features/* → src/features/
@/entities/* → src/entities/
@/shared/*   → src/shared/
```

---

## views/ — Глобальные настройки

### Redux Store

```typescript
// src/views/store/store.ts — добавляй редьюсеры сюда
import { myReducer } from '@/features/myFeature';

reducer: {
  [baseApi.reducerPath]: baseApi.reducer,
  myFeature: myReducer,
}
```

Типизированные хуки: `useAppDispatch`, `useAppSelector`, `useAppStore` из `@/views`.

### Хуки (`@/views`)

| Хук | Описание |
|---|---|
| `useLoading({ initialLoading?, ms_timeout? })` | Состояние загрузки с минимальным временем показа |
| `useDebounce(value, delay)` | Дебаунс значения |
| `useDebouncedCallback(fn, delay)` | Дебаунс функции |
| `useThrottle(value, limit)` | Throttle значения |
| `useThrottledCallback(fn, limit)` | Throttle функции |
| `useToggle(initial?)` | `[value, toggle, setTrue, setFalse]` |
| `useLocalStorage(key, initial?)` | Синхронизация с localStorage |
| `useClickOutside(ref, callback)` | Клик вне элемента |
| `useMediaQuery(query)` | CSS media query, SSR-safe |
| `useBreakpoints()` | `{ isMobile, isTablet, isDesktop }` |
| `usePrevious(value)` | Предыдущее значение |

### Утилиты (`@/views/lib` или `@/views`)

| Функция | Пример |
|---|---|
| `cn(...classes)` | `cn('btn', isActive && 'active')` |
| `formatPrice(value, options?)` | `formatPrice(10000, { suffix: '₽' })` → `'10 000₽'` |
| `formatDate(date)` | → `'15 января 2024 г.'` |
| `throttle(fn, limit)` | Вне React-компонентов |
| `pluralize(count, forms)` | `pluralize(3, ['товар', 'товара', 'товаров'])` → `'3 товара'` |
| `truncate(text, max, suffix?)` | `truncate('Длинный текст', 7)` → `'Длинный...'` |
| `capitalize(text)` | `'привет'` → `'Привет'` |
| `groupBy(array, key)` | Группировка массива по ключу |
| `formatBytes(bytes)` | `1024` → `'1 KB'` |
| `sleep(ms)` | `await sleep(500)` |
| `getStorage / setStorage / removeStorage / hasStorage` | Утилиты localStorage |

### Стили

- `src/views/styles/globals.scss` — Tailwind + анимация skeleton-shimmer
- `src/views/styles/_variables.scss` — CSS-переменные (цвета, отступы, радиусы, тени)
- `src/views/styles/_fonts.scss` — подключение шрифтов через `@font-face`
- `src/views/fonts/` — файлы шрифтов (`.woff2`, `.woff`, `.ttf`)
- `src/views/config/constants.ts` — `API_BASE_URL`, `ROUTES`, `BREAKPOINTS`

---

## shared/ — Переиспользуемые модули

### UI-компоненты (`@/shared/ui` или `@/shared`)

#### Button
```tsx
<Button onClick={fn} className="bg-blue-500 text-white px-4 py-2">
  Нажми
</Button>
```

#### Loading — анимированный спиннер
```tsx
<Loading size={40} indicatorColor="#2563EB" speed={0.8} />
```

#### Modal — портал, закрывается по Escape и клику на backdrop
```tsx
const [isOpen, , open, close] = useToggle();

<button onClick={open}>Открыть</button>
<Modal isOpen={isOpen} setIsOpen={close}>
  <h2>Заголовок</h2>
  <p>Контент модалки</p>
</Modal>
```

#### ImageWithSkeleton — замена `next/image` с автоматическим скелетоном
```tsx
// фиксированный размер
<ImageWithSkeleton src="/photo.jpg" alt="фото" width={400} height={400} className="rounded-xl" />

// fill режим
<div className="relative w-full aspect-square">
  <ImageWithSkeleton src="/photo.jpg" alt="фото" fill className="object-cover rounded-xl" />
</div>
```

#### AnimationHeightWrapper / AnimationWidthWrapper
```tsx
const [isOpen, toggle] = useToggle();

// аккордеон
<button onClick={toggle}>Toggle</button>
<AnimationHeightWrapper isOpen={isOpen} maxHeight={300}>
  <p>Скрытый контент</p>
</AnimationHeightWrapper>

// сайдбар
<AnimationWidthWrapper isOpen={isOpen} maxWidth={250}>
  <Sidebar />
</AnimationWidthWrapper>
```

#### Slider / Slide — слайдер на Swiper
```tsx
<Slider slidesPerView={2} spaceBetween={16} prevButton={<button>←</button>} nextButton={<button>→</button>}>
  <Slide><Card /></Slide>
  <Slide><Card /></Slide>
</Slider>
```

#### Responsive-компоненты — брейкпоинты Tailwind, SSR-safe
```tsx
<Sm>только до 640px</Sm>          <SmUp>от 640px</SmUp>
<Md>только до 768px</Md>          <MdUp>от 768px</MdUp>
<Lg>только до 1024px</Lg>         <LgUp>от 1024px</LgUp>
<Xl>только до 1280px</Xl>         <XlUp>от 1280px</XlUp>
<XXl>только до 1536px</XXl>        <XXlUp>от 1536px</XXlUp>
```

### RTK Query

```typescript
// entities/Product/api/productApi.ts
import { baseApi } from '@/shared/api';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({ query: () => '/products' }),
    getProduct: builder.query<Product, string>({ query: (id) => `/products/${id}` }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery } = productApi;
```

---

## Создание новых слоёв

### Entity
```
entities/Product/
  model/
    types.ts        # TypeScript интерфейсы (обязательно)
    slice.ts        # Redux slice (опционально)
    selectors.ts    # Селекторы (если есть slice)
    constants.ts    # Константы (статусы, роли)
  api/
    productApi.ts   # RTK Query endpoints
  ui/               # Компоненты отображения (опционально)
  index.ts          # Публичный API — только через него
```

### Feature
```
features/addToCart/
  model/
    slice.ts
    selectors.ts
    types.ts
  ui/
    AddToCartButton.tsx
  api/              # Специфичные запросы (опционально)
  index.ts
```

### Widget
```
widgets/ProductCard/
  ui/
    ProductCard.tsx  # Компонует entities + features
  model/             # Локальный стейт (опционально)
  index.ts
```

---

## Полезные ссылки

[Feature-Sliced Design](https://feature-sliced.design/) • [Next.js Docs](https://nextjs.org/docs) • [Redux Toolkit](https://redux-toolkit.js.org/) • [Tailwind CSS](https://tailwindcss.com/) • [Swiper](https://swiperjs.com/)
