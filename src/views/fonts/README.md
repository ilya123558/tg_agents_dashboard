# Fonts

Поместите ваши шрифты в эту папку.

## Использование

1. Добавьте файлы шрифтов (.woff2, .woff, .ttf)
2. Подключите в `views/styles/_fonts.scss`:

```scss
@font-face {
  font-family: 'YourFont';
  src: url('../fonts/YourFont.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

3. Используйте в CSS/SCSS:

```scss
body {
  font-family: 'YourFont', sans-serif;
}
```
