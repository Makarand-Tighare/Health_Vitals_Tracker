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
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Health Tracker
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button
              onClick={handleExportToExcel}
              disabled={exporting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export all data to Excel"
            >
              {exporting ? 'Exporting...' : '📊 Export to Excel'}
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 hover:shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

