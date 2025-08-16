//src/app/account/layout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import GlobalFooter from "@/components/GlobalFooter";

// Define navigation items interface
interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode; // Optional icon property for future enhancement
}

// Define navigation items
const navItems: NavItem[] = [
  { name: "Dashboard", path: "/account" },
  // { name: "Orders", path: "/account/orders" },
  { name: "Subscriptions", path: "/account/subscriptions" },
  { name: "Settings", path: "/account/settings" },
  // { name: "Telehealth", path: "/appointment" },
];

// AccountHeader component for all account pages
const AccountHeader: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  
  // Get display name directly from user data
  const displayName = getUserDisplayName(user);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {displayName && (
              <span className="text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded-full">
                {displayName}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium hover:bg-gray-200 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

// Account hero section that matches About Us page styling
const AccountHero: React.FC = () => {
  return (
    <div style={{ background: "#F7F7F7" }}>
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 
            className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
            style={{ color: "#e63946" }}
          >
            Account
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-700">
            Manage your orders, subscriptions, and telehealth access
          </p>
        </div>
      </div>
    </div>
  );
};

// Sidebar navigation
const AccountNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block px-4 py-3 rounded-lg transition-colors ${
              pathname === item.path
                ? "bg-pink-100 text-pink-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Link
          href="/"
          className="block px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

/**
 * Helper function to get user display name from various sources
 * @param user User object from auth store
 * @returns Display name string or null if none available
 */
function getUserDisplayName(user: any): string | null {
  if (!user) return null;
  
  // Try to get name from user metadata
  if (user.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user.user_metadata?.name) return user.user_metadata.name;
  
  // If no name in metadata, use email (split at @ to get username part)
  if (user.email && typeof user.email === 'string') {
    return user.email.split('@')[0];
  }
  
  return null;
}

// This layout wraps all pages within the account section
export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if user is not authenticated and loading is complete
    if (!loading && !user) {
      // Capture the current URL to redirect back after login
      const currentPath = window.location.pathname;
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router]);

  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Don't render anything while redirecting to login
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountHeader />
      <AccountHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <AccountNavigation />
          </div>
          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}