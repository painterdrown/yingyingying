function show_usage() {
  console.log('usage: node yingyingying.js BLOG_PATH FAVICON_PATH');
  console.log('  BLOG_PATH: path to your local blogs');
  console.log('  FAVICON_PATH: optional, path to your favicon.ico');
}

function get_prefix(count) {
  let prefix = '';
  while (count--) prefix += '../';
  return prefix;
}

// filepath 是相对于 blog_path 的
function markdown2html(filepath, count) {
  console.log('found markdown:', filepath);
  const markdown = fs.readFileSync(path.join(blog_path, filepath)).toString();
  const html_body = md.render(markdown);

  const pos = filepath.lastIndexOf('.');
  const html_filepath = `${filepath.slice(0, pos)}.html`;

  // find title
  const lines = markdown.split('\n');
  let title = null;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2, line.length);
      break;
    }
  }

  let prefix = get_prefix(count);

  let favicon_html = '';
  if (favicon_path) {
    const favicon = favicon_path.slice(favicon_path.lastIndexOf('/') + 1, favicon_path.length);
    favicon_html =
`<link rel="shortcut icon" href="${prefix}assets/img/${favicon}" type="image/x-icon"/>
<link rel="icon" href="${prefix}assets/img/${favicon}" type="image/x-icon"/>`;
  }

  let html =
`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${favicon_html}
<link rel="stylesheet" href="${prefix}assets/css/github-markdown.css">
<link rel="stylesheet" href="${prefix}assets/css/index.css">
</head>
<body class="markdown-body">
${html_body}</body>
</html>`;

  fs.writeFileSync(path.join(blog_path, html_filepath), html);
}

// filepath 是相对于 blog_path 的
function recursively(filepath, count) {
  const filenames = fs.readdirSync(path.join(blog_path, filepath));
  for (const filename of filenames) {
    const sub_path = path.join(filepath, filename);
    if (ignore.includes(sub_path)) continue;
    if (fs.statSync(path.join(blog_path, sub_path)).isDirectory()) recursively(sub_path, count + 1);
    if (filename.endsWith('.md')) markdown2html(sub_path, count);
  }
}

// =========== main ===========

if (process.argv.length < 3) {
  show_usage();
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
});

const blog_path = process.argv[2];
const favicon_path = process.argv.length > 3 ? process.argv[3] : null;

if (!fs.existsSync(blog_path)) {
  console.log(`invalid BLOG_PATH: ${blog_path}`);
  show_usage();
  process.exit(1);
}
if (favicon_path && !fs.existsSync(favicon_path)) {
  console.log(`invalid FAVICON_PATH: ${favicon_path}`);
  show_usage();
  process.exit(1);
}

const ignore = JSON.parse(fs.readFileSync(path.join(__dirname, 'ignore.json')).toString());

const assets_path = path.join(blog_path, 'assets');
if (!fs.existsSync(assets_path)) fs.mkdirSync(assets_path);
const css_path = path.join(assets_path, 'css');
if (!fs.existsSync(css_path)) fs.mkdirSync(css_path);
fs.copyFileSync(
  path.join(__dirname, 'assets/css/github-markdown.css'),
  path.join(css_path, 'github-markdown.css'),
);
fs.copyFileSync(
  path.join(__dirname, 'assets/css/index.css'),
  path.join(css_path, 'index.css'),
);
if (favicon_path) {
  const img_path = path.join(assets_path, 'img');
  if (!fs.existsSync(img_path)) fs.mkdirSync(img_path);
  const favicon = favicon_path.slice(favicon_path.lastIndexOf('/') + 1, favicon_path.length);
  fs.copyFileSync(
    favicon_path,
    path.join(img_path, favicon),
  );
}

recursively('', 0);
