/** @type {import('next').NextConfig} */
const isCI = process.env.GITHUB_ACTIONS === 'true'
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''

export default {
  output: 'export',          // generate static HTML
  images: { unoptimized: true }, // required for static export
  assetPrefix: isCI ? `/${repo}` : '',
  basePath: isCI ? `/${repo}` : '',
}
