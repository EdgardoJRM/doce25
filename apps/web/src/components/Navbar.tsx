'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'aws-amplify/auth';
import { getCurrentUserInfo } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, [pathname]);

  async function checkUser() {
    try {
      const userInfo = await getCurrentUserInfo();
      setUser(userInfo);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const isAdmin = user?.groups?.includes('admin');
  const isStaff = user?.groups?.includes('staff') || isAdmin;

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold hover:text-primary-100 transition-colors">
              Doce25
            </Link>
            <Link
              href="/events"
              className={`hover:text-primary-100 transition-colors ${
                pathname === '/events' ? 'font-semibold' : ''
              }`}
            >
              Eventos
            </Link>
            {isStaff && (
              <Link
                href="/staff/scanner"
                className={`hover:text-primary-100 transition-colors ${
                  pathname.startsWith('/staff') ? 'font-semibold' : ''
                }`}
              >
                Scanner
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/events"
                className={`hover:text-primary-100 transition-colors ${
                  pathname.startsWith('/admin') ? 'font-semibold' : ''
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm">Cargando...</div>
            ) : user ? (
              <>
                <span className="text-sm">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

