# Reproductor Duo (Web)

App web para reproducir Musica y Videos en modo separado:

- Modo Musica y modo Videos por separado.
- Fuente Local y fuente YouTube por separado.
- Cola de reproduccion, autoplay, shuffle, repeat.
- Controles completos: play, pause, anterior, siguiente, seek +-10s, volumen, velocidad.
- Media Session API para controles en segundo plano (play/pause/next/prev/seek) en navegadores compatibles.
- PWA basica para experiencia tipo app.

## Fuentes de musica

La app no depende solo de YouTube. Se combinan dos tipos de fuente:

- **Reproducibles**: YouTube, Audius, Jamendo, Openverse (Jamendo/ccMixter/FMA sin clave) y radios en vivo (radio-browser.info).
- **De referencia** (dicen que canciones existen y cuales se parecen): Deezer, iTunes y Last.fm.
  Cada sugerencia de estas plataformas se resuelve a una fuente reproducible antes de mostrarse.
  Spotify no se puede usar desde el navegador: exige OAuth de servidor y no permite streaming sin su SDK.

La busqueda va en dos pasadas: primero pinta YouTube + catalogos libres + radios, y despues
añade las coincidencias de Deezer/iTunes/Last.fm ya resueltas (tardan mas porque hay que
localizar el audio). La etiqueta de cada pista indica de donde suena y que plataforma la sugirio.

En [config.js](config.js):

- `jamendoClientId`: catalogo libre de Jamendo directo (gratis en devportal.jamendo.com).
  Sin esta clave Jamendo sigue llegando de forma parcial a traves de Openverse.
- `lastfmApiKey`: mejora mucho las recomendaciones "canciones similares" (gratis en last.fm/api).
- `useMetadataCatalogs`: activa Deezer/iTunes/Last.fm como catalogo de referencia.
- `useLiveRadio`: activa las emisoras en vivo (solo streams https).

El boton **Actualizar** de Descubrir trae recomendaciones nuevas; ademas rota solo cada 2 minutos
y no repite lo ya mostrado en los ultimos refrescos.

## Importante sobre YouTube

Para que funcione estable en GitHub Pages para todos los usuarios, el dueno del repositorio configura una vez una API key en GitHub Secrets.
Los usuarios finales no configuran nada: solo abren el enlace.

## Publicar (listo para produccion)

1. Sube este proyecto a un repo en GitHub.
2. En GitHub ve a `Settings > Secrets and variables > Actions` y crea el secret `YOUTUBE_API_KEY`.
3. Haz push a `main`.
4. El workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) publica automaticamente en GitHub Pages.
5. Comparte la URL de Pages: tus usuarios solo entran y usan la app.

Si despues de publicar ves mensajes viejos, recarga forzada del navegador una vez (Ctrl+F5) para actualizar cache del service worker.

## Desarrollo local

1. Abre esta carpeta en VS Code.
2. Instala dependencias:

```bash
npm install
```

3. Inicia el servidor:

```bash
npm start
```

4. Abre la URL local mostrada en la terminal (normalmente http://localhost:5173).
5. En movil, instala como app (Add to Home Screen) para mejor soporte en segundo plano.

## GitHub Pages (funcionando en cualquier dispositivo)

No necesitas editar [config.js](config.js) para Pages.
El workflow genera [config.js](config.js) automaticamente usando `YOUTUBE_API_KEY`.

### Modo sin pasos tecnicos para usuarios

- Usuario final: no necesita tocar API key ni configuracion.
- Dueno del proyecto: configura una vez el secret `YOUTUBE_API_KEY`.
- Si quieres abrir ajustes tecnicos desde la UI, usa temporalmente `?config=1` al final de la URL.

### Crear YouTube API key

1. Ve a Google Cloud Console.
2. Crea un proyecto o usa uno existente.
3. Habilita `YouTube Data API v3`.
4. Crea una API key.
5. En restricciones de API key:
   - Tipo: `HTTP referrers`.
   - Agrega tu dominio de Pages, por ejemplo `https://TU-USUARIO.github.io/*`.

Con esto, busqueda y recomendados online funcionan en GitHub Pages sin servidor Node.

## Uso rapido

1. Elige modo: Musica o Videos.
2. Elige fuente: Local o YouTube.
3. Local:
   - Cargar archivos para esa categoria.
   - Filtrar por texto.
4. YouTube:
   - Buscar.
   - Agregar a cola o reproducir directo.
5. Usa controles y toggles de autoplay/shuffle/repeat.
