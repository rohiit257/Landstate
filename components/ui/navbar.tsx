'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './button';
import { Building, LogIn, LogOut, Plus, ScrollText, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Building className="h-6 w-6 text-primary" />
              </motion.div>
              <span className="ml-2 text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Real Estate
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Button variant="ghost" className="hover:text-primary transition-colors" asChild>
                <Link href="/properties">Properties</Link>
              </Button>
              {user && (
                <>
                  <Button variant="ghost" className="hover:text-primary transition-colors" asChild>
                    <Link href="/properties/new" className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      List Property
                    </Link>
                  </Button>
                  <Button variant="ghost" className="hover:text-primary transition-colors" asChild>
                    <Link href="/applications" className="flex items-center">
                      <ScrollText className="w-4 h-4 mr-2" />
                      Applications
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center">
            {user ? (
              <Button 
                variant="ghost" 
                onClick={handleSignOut} 
                className="flex items-center hover:text-primary transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button variant="ghost" className="hover:text-primary transition-colors" asChild>
                <Link href="/auth/login" className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hover:text-primary transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden bg-white border-b"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-primary transition-colors"
                asChild
              >
                <Link href="/properties">Properties</Link>
              </Button>
              {user && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:text-primary transition-colors"
                    asChild
                  >
                    <Link href="/properties/new" className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      List Property
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:text-primary transition-colors"
                    asChild
                  >
                    <Link href="/applications" className="flex items-center">
                      <ScrollText className="w-4 h-4 mr-2" />
                      Applications
                    </Link>
                  </Button>
                </>
              )}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start hover:text-primary transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:text-primary transition-colors"
                  asChild
                >
                  <Link href="/auth/login" className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}