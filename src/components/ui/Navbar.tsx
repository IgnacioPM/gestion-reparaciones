'use client'

import { useRouter } from "next/navigation"
import { LogOut, User, ChevronDown, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuthStore } from "@/stores/auth"
import { ThemeToggle } from "./ThemeToggle"
import { useState, useRef, useEffect } from "react"

export default function Navbar() {
    const router = useRouter()
    // Obtenemos el perfil y la función de logout del store
    const { profile, logout } = useAuthStore()
    
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // La nueva función de logout
    const handleLogout = async () => {
        await logout() // Llama a la función del store
        router.push("/login")
    }

    // Cerrar el menú al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <nav className="w-full bg-white dark:bg-gray-800 shadow-md px-3 py-2 flex justify-between items-center sticky top-0 z-50 transition-colors">
            {/* Logo + App Name */}
            <Link href="/" className="flex items-center gap-2">
                <Image
                    src={profile?.empresa?.logo_url || "/icons/logo-CR.svg"}
                    alt={profile?.empresa?.nombre || "Logo Reparaciones"}
                    width={44}
                    height={44}
                    className="object-contain"
                />
                <h1 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-white transition-colors">
                    {/* Muestra el nombre de la empresa si existe */}
                    {profile?.empresa?.nombre || 'Control de reparaciones'}
                </h1>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <User className="w-5 h-5" />
                        {/* Muestra el nombre del usuario si existe */}
                        <span className="hidden sm:inline font-medium">
                            {profile?.nombre || profile?.email || 'Usuario'}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                {profile?.rol === 'Admin' && (
                                    <Link href="/administrar" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left">
                                        <Settings className="w-4 h-4" />
                                        Administrar
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
