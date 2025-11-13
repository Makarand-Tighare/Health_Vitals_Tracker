'use client';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-600">
            Made with <span className="text-red-500">❤️</span> by{' '}
            <a
              href="https://www.linkedin.com/in/makarand-tighare/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Mak
            </a>
          </p>
          <p className="text-xs text-gray-500">
            Health Vitals Tracker © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}

