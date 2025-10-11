import React from 'react';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
}

export default function TopBar({ title, onMobileMenuToggle, showMobileMenu }: TopBarProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between lg:justify-start">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-md hover:bg-muted"
        aria-label="Toggle mobile menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Title */}
      <h1 className="text-lg font-semibold text-foreground lg:ml-0 ml-4">
        {title}
      </h1>
      
      {/* Spacer for desktop */}
      <div className="flex-1" />
      
      {/* User section placeholder */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-medium">A</span>
        </div>
      </div>
    </header>
  );
}