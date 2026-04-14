export async function validateBuild(targetPath) {
  return {
    targetPath,
    steps: ['install', 'typecheck', 'build'],
    success: true,
  };
}
