const nextConfig = {
  reactStrictMode: true,
  // Allow WSL IP and localhost for HMR (hot reload via portproxy)
  allowedDevOrigins: ['172.31.236.106', 'localhost', '127.0.0.1'],
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig;
