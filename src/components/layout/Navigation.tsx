"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { hasAccess } from "@/lib/subscriptionUtils";
import { buildApiUrl } from "@/lib/config";

export default function Navigation() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);

  const isActive = (path: string) => location === path;
  
  // Check subscription tier for navigation menu access
  const userTier = user?.subscriptionTier || "free";
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  const isAdminUser = user?.role === "admin" || user?.role === "superuser";
  
  // Show navigation menus for paid plan users (except free)
  const showNavMenus = isAdminUser || (isSubscriptionActive && userTier !== "free");

  // Fetch live Bitcoin price
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/public/market/price/BTCUSDT'));
        if (response.ok) {
          const data = await response.json();
          const currentPrice = data.price;
          
          // Get percentage change from API response
          const priceChangePercent = data.changePercent;
          
          console.log('BTC API Response:', { price: currentPrice, changePercent: priceChangePercent, fullData: data });
          
          // Use the 24-hour percentage change from API
          setBtcPrice(currentPrice);
          setBtcChange(priceChangePercent);
        }
      } catch (error) {
        console.error('Error fetching BTC price:', error);
      }
    };

    // Initial fetch
    fetchBtcPrice();
    
    // Fetch every 30 seconds for real-time updates (reduced frequency)
    const interval = setInterval(fetchBtcPrice, 30000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array

  useEffect(() => {
    setMobileMenuOpen(false); // close menu on route change
  }, [location]);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="flex items-center"
          >
            <img 
              src="/proud-profits-logo.png" 
              alt="Proud Profits" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex space-x-6">
            {!isAuthenticated && (
              <>
                <Link
                  href="/market-data"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/market-data") ? "text-foreground font-semibold" : ""
                    }`}
                >
                  Market Data
                </Link>
                <Link
                  href="/pricing"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/pricing") ? "text-foreground font-semibold" : ""
                    }`}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/about") ? "text-foreground font-semibold" : ""
                    }`}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/contact") ? "text-foreground font-semibold" : ""
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
                    className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/dashboard") ? "text-foreground font-semibold" : ""
                      }`}
                  >
                    Dashboard
                  </Link>
                )}
                {hasAccess(userTier, "basicSignals") && (
                  <Link
                    href="/members"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/members") ? "text-foreground font-semibold" : ""
                      }`}
                  >
                    Members
                  </Link>
                )}
                {hasAccess(userTier, "realTimeAlerts") && (
                  <Link
                    href="/alerts"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/alerts") ? "text-foreground font-semibold" : ""
                      }`}
                  >
                    Alerts
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-muted-foreground hover:text-foreground transition-colors ${isActive("/admin") ? "text-foreground font-semibold" : ""
                      }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Live BTC Price */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 bg-muted px-2 lg:px-4 py-2 rounded-lg">
            <span className="text-xs lg:text-sm text-muted-foreground">BTC/USD</span>
            <span className="text-emerald-400 font-semibold text-sm lg:text-base">
              {btcPrice ? `$${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$--,---.--'}
            </span>
            {btcChange !== null && typeof btcChange === 'number' && !isNaN(btcChange) ? (
              <span className={`text-xs lg:text-sm ${btcChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
              </span>
            ) : (
              <span className="text-xs lg:text-sm text-muted-foreground">--.--%</span>
            )}
          </div>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {showNavMenus && (
                  <>
                    {hasAccess(userTier, "trading_dashboard") && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {hasAccess(userTier, "basicSignals") && (
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/auth"><button className="text-white/80 hover:text-white transition-colors">Sign In</button></Link>
              <Link href="/auth?mode=register">
                <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all">
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
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-card bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-t border-border transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen
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

              {/* Sign in + Get Started on small screen */}
              <div className="flex flex-col gap-2 px-3 pt-2">
                <Link href="/auth"><button className="text-white/80 hover:text-white transition-colors">Sign In</button></Link>
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
                onClick={signOut}
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