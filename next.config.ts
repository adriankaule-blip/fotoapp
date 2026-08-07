import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', '@google/genai'],
}

export default nextConfig
