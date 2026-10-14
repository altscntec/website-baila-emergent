'use strict';
// Minimal RFC 4180 parser (quoted fields, escaped quotes, CRLF) and a writer that
// neutralises spreadsheet formula injection (=, +, -, @, tab, CR at the start of a cell).
const parseCsv = (text) => {
  const rows = []; let row = []; let cell = ''; let i = 0; let inQ = false;
  const s = String(text).replace(/^﻿/, '');
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i += 2; continue; } inQ = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',' || c === ';') { row.push(cell); cell = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += c; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((x) => x.trim() !== ''));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, k) => [h, (r[k] || '').trim()])));
};

const safeCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (columns, rows) => [columns.join(','), ...rows.map((r) => columns.map((c) => safeCell(r[c])).join(','))].join('\n') + '\n';

const toCents = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  let s = String(v).replace(/[^\d.,-]/g, '');
  if (!/\d/.test(s)) return null;
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

module.exports = { parseCsv, toCsv, toCents, safeCell };
