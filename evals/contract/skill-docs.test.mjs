import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('documentation reflects the manifest-first harness workflow', () => {
  const skill = fs.readFileSync('SKILL.md', 'utf8');
  const readme = fs.readFileSync('README.md', 'utf8');

  const starterPath = new RegExp('assets[/\\\\]starter', 'i');
  assert.doesNotMatch(skill, starterPath);
  assert.doesNotMatch(readme, starterPath);
  assert.doesNotMatch(skill, /starter template|starter 模板/i);
  assert.doesNotMatch(readme, /starter template|starter 模板/i);

  assert.match(skill, /request spec -> blueprint -> project manifest -> file generation -> validation/);
  assert.match(readme, /request spec -> blueprint -> project manifest -> file generation -> validation/);
});
