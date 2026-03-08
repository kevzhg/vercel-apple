export default function Home() {
  return (
    <main>
      {/* Hero Section - Bold gradient background */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 text-center px-4 py-20">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 tracking-tight">
            UNLEASH THE FULL POWER
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
              OF SOCIAL
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-semibold">
            Advanced social media analytics for Apple&apos;s March 2026 event campaign
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/demo"
              className="px-10 py-4 bg-white text-primary-600 rounded-full font-extrabold text-lg hover:scale-105 transition-transform shadow-2xl"
            >
              View Dashboard
            </a>
            <a
              href="/upload"
              className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-full font-extrabold text-lg hover:bg-white/10 transition-colors"
            >
              Upload Data
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Feature Cards with Brand Colors */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold gradient-text-simple mb-4">
              Campaign Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Analyze every aspect of your social media presence with powerful insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Card 1 */}
            <div className="card-viral">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900">Campaign Analysis</h3>
              <p className="text-gray-600">
                Deep dive into campaign performance with advanced metrics and insights
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-viral">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900">Trend Detection</h3>
              <p className="text-gray-600">
                Identify emerging trends and creative patterns with AI-powered analysis
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-viral">
              <div className="w-16 h-16 bg-gradient-to-br from-tertiary-500 to-tertiary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900">Visual Intelligence</h3>
              <p className="text-gray-600">
                Extract and analyze visual content using state-of-the-art technology
              </p>
            </div>

            {/* Card 4 */}
            <div className="card-viral">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900">Interactive Reports</h3>
              <p className="text-gray-600">
                Beautiful presentations that make complex data actionable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to transform your analytics?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            See how Viral Nation powers social media intelligence for the world&apos;s biggest brands
          </p>
          <a
            href="/demo"
            className="inline-block px-12 py-5 bg-white text-primary-600 rounded-full font-extrabold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            Explore Demo Dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
