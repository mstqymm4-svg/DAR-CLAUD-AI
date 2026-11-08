import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_TEMPLATES, filterTemplates, formatCodeSnippet } from './helpers';

test('filterTemplates filters by query correctly', () => {
  const result = filterTemplates(PRESET_TEMPLATES, 'Compose', 'All');
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Jetpack Compose Screen');
});

test('filterTemplates filters by category correctly', () => {
  const result = filterTemplates(PRESET_TEMPLATES, '', 'Android');
  assert.equal(result.length, 1);
  assert.equal(result[0].category, 'Android');
});

test('formatCodeSnippet adds header comment', () => {
  const formatted = formatCodeSnippet('val x = 10;', 'kotlin');
  assert.ok(formatted.includes('Language: kotlin'));
  assert.ok(formatted.includes('val x = 10;'));
});
