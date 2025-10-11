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

export default function ResponsiveNavigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location === path;

  // Check subscription tier for navigation menu access
  const userTier = user?.subscriptionTier || "free";
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  const isAdminUser = user?.role === "admin";

  // Show navigation menus for paid plan users (except free)
  const showNavMenus =
    isAdminUser || (isSubscriptionActive && userTier !== "free");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[aria-label="Toggle menu"]')
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Fetch live Bitcoin price
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch(
          buildApiUrl("/api/public/market/price/BTCUSDT")
        );
        if (response.ok) {
          const data = await response.json();
          const currentPrice = data.price;
          const priceChangePercent = data.changePercent;

          setBtcPrice(currentPrice);
          setBtcChange(priceChangePercent);
        }
      } catch (error) {
        console.error("Error fetching BTC price:", error);
      }
    };

    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-[10000] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="/proud-profits-logo.png"
                alt="Proud Profits"
                className="h-8 w-auto sm:h-10 lg:h-12 object-contain"
              />
            </Link>

            {/* Desktop Navigation - Hidden on mobile, shown on lg screens */}
            <div className="hidden lg:flex ml-10 space-x-8">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/market-data"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/market-data")
                        ? "text-white font-semibold"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Market Data
                  </Link>
                  <Link
                    href="/pricing"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/pricing")
                        ? "text-white font-semibold"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/about"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/about")
                        ? "text-white font-semibold"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/contact")
                        ? "text-white font-semibold"
                        : "text-gray-300 hover:text-white"
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
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive("/dashboard")
                          ? "text-white font-semibold"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Dashboard
                    </Link>
                  )}
                  {hasAccess(userTier, "basicSignals") && (
                    <Link
                      href="/members"
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive("/members")
                          ? "text-white font-semibold"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Members
                    </Link>
                  )}
                  {hasAccess(userTier, "realTimeAlerts") && (
                    <Link
                      href="/alerts"
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive("/alerts")
                          ? "text-white font-semibold"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Alerts
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        isActive("/admin")
                          ? "text-white font-semibold"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* BTC Price - Hidden on mobile, shown on sm screens and up */}
            <div className="hidden sm:flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700">
              <Bitcoin className="h-4 w-4 text-yellow-400" />
              <span className="text-emerald-400 font-semibold text-sm">
                {btcPrice
                  ? `$${btcPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "$--,---.--"}
              </span>
              {btcChange !== null &&
              typeof btcChange === "number" &&
              !isNaN(btcChange) ? (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    btcChange >= 0
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-red-400 bg-red-400/10"
                  }`}
                >
                  {btcChange >= 0 ? "+" : ""}
                  {btcChange.toFixed(2)}%
                </span>
              ) : (
                <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                  --.--
                </span>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* User dropdown - Hidden on mobile, shown on lg screens */}
                <div className="hidden lg:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 border border-blue-500/20"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                        {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-700 bg-slate-900/95 backdrop-blur-md shadow-xl z-[10001]">
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-500 text-white">
                              {user?.firstName?.[0] ||
                                user?.email[0].toUpperCase()}
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
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User avatar for mobile - Shown on screens smaller than lg */}
                <div className="lg:hidden flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </>
            ) : (
              /* Auth buttons - Hidden on mobile, shown on lg screens */
              <div className="hidden lg:flex items-center space-x-3">
                <Link href="/auth">
                  <button className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5">
                    Sign In
                  </button>
                </Link>
                <Link href="/auth?mode=register">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-orange-500/25 font-medium">
                    Get Started
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile menu button - Shows on screens smaller than lg */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative z-[10002] h-10 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu - Shows on screens smaller than lg */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out z-[9999] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm">
                    {user?.firstName || "User"}
                  </span>
                  <span className="text-green-400 text-xs">
                    {userTier === "free"
                      ? "Free Plan"
                      : userTier === "basic"
                      ? "Basic Plan"
                      : userTier === "premium"
                      ? "Premium Plan"
                      : "Enterprise Plan"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <span className="text-white font-medium">Menu</span>
                <span className="text-gray-400 text-xs">Welcome</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-slate-700"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Mobile BTC Price */}
        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm mx-4 my-4 px-3 py-2 rounded-lg border border-gray-600">
          <Bitcoin className="h-4 w-4 text-yellow-400" />
          <span className="text-emerald-400 font-semibold text-sm">
            {btcPrice
              ? `$${btcPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "$--,---.--"}
          </span>
          {btcChange !== null &&
          typeof btcChange === "number" &&
          !isNaN(btcChange) ? (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                btcChange >= 0
                  ? "text-emerald-400 bg-emerald-400/10"
                  : "text-red-400 bg-red-400/10"
              }`}
            >
              {btcChange >= 0 ? "+" : ""}
              {btcChange.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
              --.--
            </span>
          )}
        </div>

        {/* Mobile Menu Content */}
        <div className="px-4 py-4 space-y-2 h-[calc(100vh-140px)] overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-2">
            {!isAuthenticated ? (
              // Public navigation for mobile
              <>
                <Link
                  href="/market-data"
                  className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market Data
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </>
            ) : (
              // Authenticated user navigation for mobile
              <>
                {showNavMenus && (
                  <>
                    {hasAccess(userTier, "trading_dashboard") && (
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <TrendingUp className="mr-3 h-5 w-5 text-blue-400" />
                        <span>Dashboard</span>
                      </Link>
                    )}

                    {hasAccess(userTier, "basicSignals") && (
                      <Link
                        href="/members"
                        className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>Members</span>
                      </Link>
                    )}

                    {hasAccess(userTier, "realTimeAlerts") && (
                      <Link
                        href="/alerts"
                        className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Bell className="mr-3 h-5 w-5 text-orange-400" />
                        <span>Alerts</span>
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-5 w-5 text-purple-400" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center px-4 py-3 text-base text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-[44px]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons for non-authenticated users in mobile */}
          {!isAuthenticated && (
            <div className="flex flex-col gap-3 pt-6">
              <Link href="/auth">
                <button
                  className="w-full text-center px-6 py-3 text-base text-white border border-slate-600 hover:bg-slate-800 rounded-xl transition-colors font-medium min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </button>
              </Link>
              <Link href="/auth?mode=register">
                <button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 text-base rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg min-h-[44px]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Logout for authenticated users in mobile */}
          {isAuthenticated && (
            <div className="pt-6 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-base text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-red-400/20 min-h-[44px]"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
