'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getAllEntries } from '@/lib/firebase/db';
import { exportToExcel } from '@/lib/exportToExcel';

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [exporting, setExporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Daily Entry' },
    { href: '/weekly', label: 'Weekly Summary' },
  ];

  const handleExportToExcel = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const allEntries = await getAllEntries(user.uid);
      if (allEntries.length === 0) {
        alert('No data to export. Please log some entries first.');
        return;
      }
      exportToExcel(allEntries, 'health-vitals-tracker');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8 min-w-0 flex-1">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900 whitespace-nowrap">
              Health Tracker
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <span className="text-sm text-gray-600 hidden lg:block truncate max-w-[180px]">{user.email}</span>
            <button
              onClick={handleExportToExcel}
              disabled={exporting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Export all data to Excel"
            >
              {exporting ? 'Exporting...' : '📊 Export to Excel'}
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 hover:shadow-sm whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex h-14 items-center justify-between">
            <Link 
              href="/dashboard" 
              className="text-lg font-bold text-gray-900 whitespace-nowrap"
              onClick={() => setMobileMenuOpen(false)}
            >
              Health Tracker
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 py-3 space-y-2">
              {/* Navigation Links */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      pathname === item.href
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* User Email */}
              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 px-4">
                <button
                  onClick={() => {
                    handleExportToExcel();
                    setMobileMenuOpen(false);
                  }}
                  disabled={exporting}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting...' : '📊 Export to Excel'}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

