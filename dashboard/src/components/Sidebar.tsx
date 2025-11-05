// Sidebar navigation for NGO admin dashboard
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Stories', href: '/stories', icon: '📖' },
  { label: 'Donations', href: '/donations', icon: '💰' },
  { label: 'Approve Stories', href: '/admin/approve', icon: '✅', adminOnly: true },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPlatformAdmin = (session?.user as any)?.profileType === 'platform_admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">HaMaaser</h1>
        <p className="text-sm text-gray-600">
          {isPlatformAdmin ? 'Platform Admin' : 'NGO Admin'}
        </p>
      </div>
      
      <nav className="mt-6">
        {navItems.map((item) => {
          // Skip admin-only items if not admin
          if (item.adminOnly && !isPlatformAdmin) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-6 py-3 text-sm font-medium
                transition-colors duration-150 ease-in-out
                ${isActive 
                  ? 'bg-primary-light text-primary border-r-4 border-primary' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
        <button
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
