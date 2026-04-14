import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function read(file) {
  return fs.readFileSync(path.resolve(file), 'utf8');
}

test('skill defaults image-driven requests to direct generation with minimal clarification', () => {
  const skill = read('SKILL.md');
  const imageGuide = read('references/image-to-prompt.md');
  const promptInterface = read('references/prompt-interface.md');

  assert.match(skill, /If inputs are incomplete, ask at most 1 focused clarification round\./);
  assert.match(skill, /Default to direct image-to-project generation when the user uploads a screenshot or asks to reproduce the design effect\./);
  assert.match(skill, /Do not stop for blueprint confirmation in image-driven mode unless the user explicitly asks to review the blueprint first\./);

  assert.match(imageGuide, /Do not block unless the page intent is fundamentally ambiguous\./);
  assert.match(imageGuide, /Default to continuing through runnable project generation instead of stopping after prompt construction\./);

  assert.match(promptInterface, /Treat uploaded-image requests as direct-generation by default:/);
  assert.match(promptInterface, /Only ask follow-up questions when ambiguity would materially change layout or page intent\./);
});

test('documentation sends playwright artifacts to temp storage instead of project output', () => {
  const readme = read('README.md');
  const promptInterface = read('references/prompt-interface.md');

  assert.match(readme, /Playwright 截图和校验报告默认输出到系统临时目录/);
  assert.match(readme, /项目目录不默认保留 Playwright 截图产物/);
  assert.match(promptInterface, /Optional Playwright validation artifacts when browser validation is enabled are written to a temporary artifacts directory by default/);
});
