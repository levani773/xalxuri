import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbPaths = [
  path.resolve(rootDir, 'data/db.json'),
  path.resolve(rootDir, 'public/db.json'),
];

let dbData = null;
for (const p of dbPaths) {
  if (fs.existsSync(p)) {
    try {
      dbData = JSON.parse(fs.readFileSync(p, 'utf-8'));
      break;
    } catch (e) {
      // ignore
    }
  }
}

if (!dbData || !dbData.articles) {
  console.log('No articles found to generate share pages.');
  process.exit(0);
}

const articles = dbData.articles;
const publicDir = path.resolve(rootDir, 'public');
const distDir = path.resolve(rootDir, 'dist');
const netlifyBase = 'https://xalxuri.netlify.app';

// Ensure directories
const publicArticlesDir = path.resolve(publicDir, 'article');
const publicAssetsArticlesDir = path.resolve(publicDir, 'assets/articles');
fs.mkdirSync(publicArticlesDir, { recursive: true });
fs.mkdirSync(publicAssetsArticlesDir, { recursive: true });

if (fs.existsSync(distDir)) {
  fs.mkdirSync(path.resolve(distDir, 'article'), { recursive: true });
  fs.mkdirSync(path.resolve(distDir, 'assets/articles'), { recursive: true });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let count = 0;

for (const art of articles) {
  const artId = art.id;
  if (!artId) continue;

  let imageUrl = `${netlifyBase}/og-image.jpg`;

  // Handle base64 image or file image
  if (art.image && art.image.startsWith('data:image/')) {
    const match = art.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const filename = `${artId}.${ext}`;
      const buf = Buffer.from(match[2], 'base64');
      fs.writeFileSync(path.resolve(publicAssetsArticlesDir, filename), buf);
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.resolve(distDir, 'assets/articles', filename), buf);
      }
      imageUrl = `${netlifyBase}/assets/articles/${filename}`;
    }
  } else if (art.image && (art.image.startsWith('http://') || art.image.startsWith('https://'))) {
    imageUrl = art.image;
  } else if (art.image) {
    imageUrl = `${netlifyBase}${art.image.startsWith('/') ? '' : '/'}${art.image}`;
  } else if (fs.existsSync(path.resolve(publicAssetsArticlesDir, `${artId}.jpg`))) {
    imageUrl = `${netlifyBase}/assets/articles/${artId}.jpg`;
  }

  const cleanTitle = escapeHtml(art.title);
  const cleanDesc = escapeHtml(art.summary || (art.answer ? art.answer.slice(0, 160) : art.title));

  const pageHtml = `<!doctype html>
<html lang="ka" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cleanTitle}</title>
  <meta name="description" content="${cleanDesc}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${cleanTitle}" />
  <meta property="og:description" content="${cleanDesc}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />
  <meta property="og:image:alt" content="${cleanTitle}" />
  <meta property="og:url" content="${netlifyBase}/article/${artId}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${cleanTitle}" />
  <meta name="twitter:description" content="${cleanDesc}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${cleanTitle}" />

  <!-- Direct human browser into the interactive app -->
  <script>
    (function() {
      // Do not redirect social bots/crawlers
      var ua = (navigator.userAgent || '').toLowerCase();
      var isBot = /facebookexternalhit|facebot|twitterbot|telegrambot|whatsapp|viber|slackbot|discordbot|googlebot|bingbot|pinterest/i.test(ua);
      if (!isBot && typeof window !== 'undefined') {
        window.location.replace('/?article=${encodeURIComponent(artId)}');
      }
    })();
  </script>
</head>
<body style="background:#020617;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;padding:2rem;text-align:center;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:540px;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
    ${imageUrl ? `<img src="${imageUrl}" alt="${cleanTitle}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:16px;" />` : ''}
    <h1 style="font-size:1.4rem;font-weight:700;color:#f8fafc;margin-bottom:12px;line-height:1.4;">${cleanTitle}</h1>
    <p style="color:#94a3b8;font-size:0.95rem;line-height:1.6;margin-bottom:20px;">${cleanDesc}</p>
    <a href="/?article=${encodeURIComponent(artId)}" style="display:inline-block;background:#10b981;color:#ffffff;font-weight:600;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:0.95rem;">
      სრულად წაკითხვა &rarr;
    </a>
  </div>
</body>
</html>`;

  // Write to public/article/<id>/index.html
  const artDirPublic = path.resolve(publicArticlesDir, artId);
  fs.mkdirSync(artDirPublic, { recursive: true });
  fs.writeFileSync(path.resolve(artDirPublic, 'index.html'), pageHtml, 'utf-8');

  // Also write to dist/article/<id>/index.html if dist exists
  if (fs.existsSync(distDir)) {
    const artDirDist = path.resolve(distDir, 'article', artId);
    fs.mkdirSync(artDirDist, { recursive: true });
    fs.writeFileSync(path.resolve(artDirDist, 'index.html'), pageHtml, 'utf-8');
  }

  count++;
}

console.log(`Generated ${count} static article share pages.`);
