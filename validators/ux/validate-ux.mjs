import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildArgs({ target, referenceSpecFile, referenceImage, outputDir, installDeps, cleanup }) {
  const args = [path.resolve(__dirname, '..', '..', 'scripts', 'playwright-validate-screen.mjs')];

  args.push('--target', target);
  if (installDeps) args.push('--install-deps');
  if (cleanup) args.push('--cleanup');
  if (outputDir) args.push('--output-dir', outputDir);
  if (referenceSpecFile) args.push('--reference-spec-file', referenceSpecFile);
  if (referenceImage) args.push('--reference-image', referenceImage);

  return args;
}

export function validateUx(
  target,
  { referenceSpecFile, referenceImage, outputDir, installDeps = true, cleanup = true, dryRun = false } = {},
) {
  if (process.env.BIGSCREEN_SKIP_UX === '1') {
    return { skipped: true, target };
  }

  const args = buildArgs({
    target,
    referenceSpecFile,
    referenceImage,
    outputDir,
    installDeps,
    cleanup,
  });

  if (dryRun) {
    return { command: process.execPath, args };
  }

  execFileSync(process.execPath, args, { stdio: 'inherit' });
  return { command: process.execPath, args };
}
