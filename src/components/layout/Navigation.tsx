"use client";

import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  Bitcoin,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { hasAccess } from "@/lib/subscriptionUtils";
import { buildApiUrl } from "@/config/api";

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);

  const isActive = (path: string) => location === path;

  const userTier = user?.subscriptionTier || "free";
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  const isAdminUser = user?.role === "admin";
  const showNavMenus =
    isAdminUser || (isSubscriptionActive && userTier !== "free");

  // Fetch live BTC price
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch(
          buildApiUrl("/api/public/market/price/BTCUSDT")
        );
        if (response.ok) {
          const data = await response.json();
          setBtcPrice(data.price);
          setBtcChange(data.changePercent);
        }
      } catch (error) {
        console.error("Error fetching BTC price:", error);
      }
    };

    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left Logo + Links */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <img
              src="/proud-profits-logo.png"
              alt="Proud Profits"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6">
            {!isAuthenticated && (
              <>
                <Link
                  href="/market-data"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    isActive("/market-data")
                      ? "text-foreground font-semibold"
                      : ""
                  }`}
                >
                  Market Data
                </Link>
                <Link
                  href="/pricing"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    isActive("/pricing") ? "text-foreground font-semibold" : ""
                  }`}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    isActive("/about") ? "text-foreground font-semibold" : ""
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${
                    isActive("/contact") ? "text-foreground font-semibold" : ""
                  }`}
                >
                  Contact
                </Link>
              </>
            )}

            {isAuthenticated && showNavMenus && (
              <>
                {hasAccess(userTier, "trading_dashboard") && (
                  <Link
                    href="/dashboard"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${
                      isActive("/dashboard")
                        ? "text-foreground font-semibold"
                        : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {hasAccess(userTier, "basicSignals") && (
                  <Link
                    href="/members"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${
                      isActive("/members")
                        ? "text-foreground font-semibold"
                        : ""
                    }`}
                  >
                    Members
                  </Link>
                )}
                {hasAccess(userTier, "realTimeAlerts") && (
                  <Link
                    href="/alerts"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${
                      isActive("/alerts") ? "text-foreground font-semibold" : ""
                    }`}
                  >
                    Alerts
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${
                      isActive("/admin") ? "text-foreground font-semibold" : ""
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side (BTC + User + Mobile) */}
        <div className="flex items-center space-x-4">
          {/* Live BTC Price */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 bg-muted px-2 lg:px-4 py-2 rounded-lg">
            <span className="text-xs lg:text-sm text-muted-foreground">
              BTC/USD
            </span>
            <span className="text-emerald-400 font-semibold text-sm lg:text-base">
              {btcPrice
                ? `$${btcPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "$--,---.--"}
            </span>
            {btcChange !== null ? (
              <span
                className={`text-xs lg:text-sm ${
                  btcChange >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {btcChange >= 0 ? "+" : ""}
                {btcChange.toFixed(2)}%
              </span>
            ) : (
              <span className="text-xs lg:text-sm text-muted-foreground">
                --.--%
              </span>
            )}
          </div>

          {/* Authenticated Dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full z-10"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>

              {/* Custom Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-700 bg-slate-900/95 backdrop-blur-md shadow-xl z-[10001]">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.firstName || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-green-400 font-medium mt-1">
                          {userTier === "free"
                            ? "Free Plan"
                            : userTier === "basic"
                            ? "Basic Plan"
                            : userTier === "premium"
                            ? "Premium Plan"
                            : "Enterprise Plan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {showNavMenus && (
                      <>
                        {hasAccess(userTier, "trading_dashboard") && (
                          <Link
                            href="/dashboard"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-slate-800 rounded-md transition-colors mb-1"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <TrendingUp className="mr-3 h-4 w-4 text-blue-400" />
                            <span>Dashboard</span>
                          </Link>
                        )}

                        {hasAccess(userTier, "basicSignals") && (
                          <Link
                            href="/settings"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-slate-800 rounded-md transition-colors mb-1"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4 text-purple-400" />
                            <span>Settings</span>
                          </Link>
                        )}

                        {hasAccess(userTier, "realTimeAlerts") && (
                          <Link
                            href="/alerts"
                            className="flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-slate-800 rounded-md transition-colors mb-1"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <Bell className="mr-3 h-4 w-4 text-orange-400" />
                            <span>Alerts</span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-2 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 relative z-10">
              <Link href="/auth">
                <button className="text-white/80 hover:text-white transition-colors relative z-10">
                  Sign In
                </button>
              </Link>
              <Link href="/auth?mode=register">
                <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all relative z-10">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-card bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-t border-border transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen
            ? "max-h-[600px] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="px-4 py-2 space-y-1">
          {!isAuthenticated && (
            <>
              <Link
                href="/market-data"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Market Data
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>

              <div className="flex flex-col gap-2 px-3 pt-2">
                <Link href="/auth">
                  <button className="text-white/80 hover:text-white transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth?mode=register">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all">
                    Get Started
                  </button>
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && (
            <>
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-destructive hover:text-red-600 transition-colors"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
