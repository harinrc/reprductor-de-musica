# Reproductor Duo (Web)

App web para reproducir Musica y Videos en modo separado:

- Modo Musica y modo Videos por separado.
- Fuente Local y fuente YouTube por separado.
- Cola de reproduccion, autoplay, shuffle, repeat.
- Controles completos: play, pause, anterior, siguiente, seek +-10s, volumen, velocidad.
- Media Session API para controles en segundo plano (play/pause/next/prev/seek) en navegadores compatibles.
- PWA basica para experiencia tipo app.

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
