/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 支持 Web Workers
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    })
    return config
  }
}

module.exports = nextConfig; 