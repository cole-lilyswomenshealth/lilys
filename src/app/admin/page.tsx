// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StatCard {
  title: string;
  value: string;
  link: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would fetch from an API
        // For now, we'll use placeholder data
        setStats([
          {
            title: "Active Subscriptions",
            value: "",
            link: "/admin/subscriptions?status=active"
          },
          {
            title: "Manual Subscriptions",
            value: "",
            link: "/admin/manual-subscriptions"
          }
        ]);
      } catch (error) {
        // Silent error handling for production
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-600">
            System overview and statistics
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Overview</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Link 
                  href={stat.link}
                  key={index}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-lg font-medium text-blue-600 mt-2">View {stat.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}