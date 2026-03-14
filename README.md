# To-Do PWA

Прогрессивное веб-приложение «Список задач» с хранением в IndexedDB. Готово к установке на устройство и к сборке в APK.

## Запуск локально

Раздайте папку по HTTP (из-за ES-модулей и Service Worker нужен именно HTTP):

```bash
# Python 3
python3 -m http.server 8080

# или npx
npx serve -l 8080
```

Откройте в браузере: `http://localhost:8080`

## Иконки для PWA и APK

В манифесте указаны `icons/icon-192.png` и `icons/icon-512.png`. Варианты:

- **В браузере:** откройте `gen-icons.html`, по ссылкам скачайте оба файла и сохраните в папку `icons/`.
- **Через Node:** `npm run icons` (нужен пакет `canvas`: `npm install canvas`).
- Либо положите в `icons/` свои PNG 192×192 и 512×512 с именами `icon-192.png` и `icon-512.png`.

## Сборка APK

Приложение подготовлено для упаковки в Android APK.

### Вариант 1: PWABuilder (проще всего)

1. Опубликуйте приложение в интернете (GitHub Pages, Netlify, Vercel или любой хостинг со HTTPS).
2. Зайдите на [pwabuilder.com](https://www.pwabuilder.com/).
3. Введите URL вашего приложения и нажмите «Start».
4. Перейдите в «Package for stores» → выберите «Android» → «Generate» и скачайте APK или AAB.

### Вариант 2: Bubblewrap (TWA, через CLI)

1. Установите [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
2. Опубликуйте PWA по HTTPS.
3. Инициализируйте проект: `bubblewrap init --manifest=https://ВАШ-ДОМЕН/manifest.json`.
4. Соберите: `bubblewrap build`.

### Вариант 3: Локальная сборка без публичного URL

Используйте [Capacitor](https://capacitorjs.com/): добавьте веб-проект в нативное приложение и соберите APK через Android Studio.

---

- **База данных:** IndexedDB (хранилище в браузере на устройстве).
- **Офлайн:** Service Worker кэширует статику; данные уже на устройстве.
- **Язык интерфейса:** русский.
