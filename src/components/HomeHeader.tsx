// src/components/HomeHeader.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import {  FiMenu, FiX, FiUser } from "react-icons/fi";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { User } from "@supabase/supabase-js";
import LanguageSwitcher from "./LanguageSwitcher";
import useTranslations from "@/hooks/useTranslations";

// Define route URLs with proper typing for internal navigation
interface RouteUrls {
  about: string;
  contact: string;
  [key: string]: string;
}

// Project route URLs - using internal routes for dynamic navigation
const routeUrls: RouteUrls = {
  home: '/',
  subscriptions: '/subscriptions',
  about: '/about',
  contact: '/contact'
};

// Define menu item interface for type safety
interface MenuItem {
  href: string;
  labelKey: string;
}

// Define component color map with proper typings
interface ComponentColorMap {
  [key: string]: string;
}

const componentColorMap: ComponentColorMap = {
  HairRegrowCard: "#729693",
  FaqAccordion: "#ffffff",
  HomeHero: "#f0f0f0",
  TestimonialSection: "#eaeaea",
  RotatingSection: "#464E3D",
};

// Component that safely uses routing hooks inside Suspense
const HeaderContent: React.FC = () => {
  const { t, isRtl } = useTranslations();
  const [headerBg, setHeaderBg] = useState<string>("#ffffff");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  
  // For safety, we'll get the current path from the window object
  // This avoids using usePathname which requires suspense boundaries
  const [currentPath, setCurrentPath] = useState<string>("/");

  // Get user from auth store
  const { user, isAuthenticated } = useAuthStore();


  // Define menu items for consistency between desktop and mobile
  const menuItems: MenuItem[] = [
    { href: routeUrls.home, labelKey: "header.home" },
    { href: routeUrls.subscriptions, labelKey: "header.subscriptions" },
    { href: routeUrls.about, labelKey: "header.aboutUs" },
    { href: routeUrls.contact, labelKey: "header.contactUs" }
  ];

  // Update the current path whenever necessary
  useEffect(() => {
    // Update on mount
    setCurrentPath(window.location.pathname);
    
    // Listen for navigation events
    const handleRouteChange = (): void => {
      setCurrentPath(window.location.pathname);
    };
    
    // This could be enhanced with routing events if needed
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Create the return URL for login/signup
  const getReturnUrl = (): string => {
    // Don't set return URL for auth-related pages
    if (currentPath && 
        (currentPath.startsWith('/login') || 
         currentPath.startsWith('/signup') || 
         currentPath.startsWith('/forgot-password') || 
         currentPath.startsWith('/reset-password'))) {
      return '/dashboard';
    }
    return currentPath || '/dashboard';
  };

  // Generate the login URL with return parameter
  const loginUrl = `/login?returnUrl=${encodeURIComponent(getReturnUrl())}`;
  const signupUrl = `/signup?returnUrl=${encodeURIComponent(getReturnUrl())}`;

  // Toggle mobile menu
  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]): void => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const componentName = entry.target.getAttribute("data-component");
          if (componentName && componentColorMap[componentName]) {
            setHeaderBg(componentColorMap[componentName]);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });

    Object.keys(componentColorMap).forEach((componentName) => {
      const elements = document.querySelectorAll(`[data-component="${componentName}"]`);
      elements.forEach((element) => observer.observe(element));
    });

    return () => observer.disconnect();
  }, []);

  // Close menu if screen size changes to desktop
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
      style={{ backgroundColor: headerBg }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Mobile Menu Button - Moved to left */}
          <button 
            className="md:hidden text-black focus:outline-none" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/Logo.png" alt="Lily's Logo" className="h-10 md:h-12" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base lg:text-lg font-normal text-gray-800 hover:text-[#fc4e87] hover:shadow-sm hover:shadow-pink-100/30 px-2 py-1 rounded-md transition-all"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Desktop Login/Account Button - Using auth store to determine state */}
            <Link href={isAuthenticated ? "/account" : loginUrl} className="hidden md:flex">
              <button className="flex items-center bg-white text-black border border-gray-200 px-5 py-2 rounded-full shadow-sm hover:shadow-md transition">
                <FiUser className="mr-2" />
                <span>{isAuthenticated ? t('header.account') : t('header.login')}</span>
              </button>
            </Link>

          </div>
        </div>
      </div>

      {/* Mobile Menu - Modified to slide from left */}
      <div 
        className={`md:hidden fixed top-0 left-0 h-full w-3/4 max-w-xs z-50 shadow-lg transition-transform duration-300 ease-in-out transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <img src="/Logo.png" alt="Lily's Logo" className="h-8" />
            </Link>
            <button 
              className="text-black focus:outline-none" 
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
          
          {/* Language Switcher in Mobile Menu */}
          <div className="px-4 py-2 border-b border-gray-100">
            <LanguageSwitcher />
          </div>
          
          {/* Navigation Links - Now using the same items as desktop */}
          <div className="flex-grow overflow-y-auto px-4 py-2">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="text-lg font-normal text-gray-800 hover:text-[#fc4e87] hover:shadow-sm hover:shadow-pink-100/30 py-3 px-4 rounded-md border-b border-gray-100 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User Account Button at Bottom - Using auth store to determine state */}
          <div className="p-4 border-t border-gray-200">
            <Link 
              href={isAuthenticated ? "/account" : loginUrl} 
              className="block"
              onClick={() => setIsMenuOpen(false)}
            >
              <button className="w-full flex items-center justify-center bg-black text-white px-5 py-3 rounded-full shadow-sm hover:bg-gray-800 transition">
                <FiUser className="mr-2" />
                <span>{isAuthenticated ? t('header.myAccount') : t('header.loginSignUp')}</span>
              </button>
            </Link>
            
            {/* Add sign up link if not logged in */}
            {!isAuthenticated && (
              <Link 
                href={signupUrl}
                className="mt-3 block text-center text-sm text-gray-600 hover:text-[#fc4e87]"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('header.newToLilys')}
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

// Fallback component for Suspense
const HeaderFallback: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <div className="w-8 h-8"></div>
          <div className="flex items-center">
            <img src="/Logo.png" alt="Lily's Logo" className="h-8" />
          </div>
          <div className="w-8 h-8"></div>
        </div>
      </div>
    </header>
  );
};

// Main component with Suspense boundary
const HomeHeader: React.FC = () => {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent />
    </Suspense>
  );
};

export default HomeHeader;