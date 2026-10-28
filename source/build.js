#!/usr/bin/env node
// Builds ../index.html from source/template.html (the prototype) plus the standalone extras
// (draft banner, feedback form). Run: node source/build.js
const fs = require('fs');
const path = require('path');

const src = __dirname;
const root = path.join(src, '..');
const read = (f) => fs.readFileSync(path.join(src, f), 'utf8');

let t = read('template.html');
const items = read('items.json').replace(/<\//g, '<\\/');
if (!t.includes('__ITEMS__')) throw new Error('template is missing the __ITEMS__ placeholder');
t = t.replace('__ITEMS__', () => items);
const timeline = read('timeline.json').replace(/<\//g, '<\\/');
if (!t.includes('__TIMELINE__')) throw new Error('template is missing the __TIMELINE__ placeholder');
t = t.replace('__TIMELINE__', () => timeline);
const tlWeeks = read('timeline-weeks.json').replace(/<\//g, '<\\/');
if (!t.includes('__TLWEEKS__')) throw new Error('template is missing the __TLWEEKS__ placeholder');
t = t.replace('__TLWEEKS__', () => tlWeeks);
const mockImg = read('mock-images.json').replace(/<\//g, '<\\/');
if (!t.includes('__MOCKIMG__')) throw new Error('template is missing the __MOCKIMG__ placeholder');
t = t.replace('__MOCKIMG__', () => mockImg);
// A copy without the standalone extras, for previewing as a Claude artifact.
fs.writeFileSync(path.join(root, 'artifact.html'), t);
t = t.replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');

const styleEnd = t.indexOf('</style>');
if (styleEnd < 0) throw new Error('no </style> in template');
const head = (t.slice(0, styleEnd) + '\n' + read('extras.css') + '\n</style>')
  .replace('<title>Plainly Prototype</title>', '<title>Plainly: Baby gear, explained plainly</title>');
let body = t.slice(styleEnd + '</style>'.length);

const protoOpen = '<div class="proto" id="proto"';
if (!body.includes(protoOpen)) throw new Error('no .proto in template');
body = body.replace(protoOpen, () => read('banner.html') + '\n' + protoOpen);

const firstScript = body.indexOf('<script>');
if (firstScript < 0) throw new Error('no <script> in template');
body = body.slice(0, firstScript) + read('feedback.html') + '\n' + body.slice(firstScript);
body += '\n<script>\n' + read('feedback.js') + '\n</script>\n';

const doc =
  '<!doctype html>\n<html lang="en">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="robots" content="noindex, nofollow">\n' +
  '<meta name="description" content="Baby gear, explained plainly. What each item is, and whether you need it.">\n' +
  '<style>:root{color-scheme:light} body{margin:0}</style>\n' +
  head + '\n</head>\n<body>\n' + body + '</body>\n</html>\n';

fs.writeFileSync(path.join(root, 'index.html'), doc);
console.log('built index.html,', doc.length, 'bytes');
