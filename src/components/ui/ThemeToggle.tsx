"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme, setTheme } = useTheme()

    // Evitar hidratación incorrecta
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="theme-toggle-switch"
            data-state={resolvedTheme}
        >
            <span className="sr-only">Cambiar tema</span>
            <span
                className="theme-toggle-thumb"
                data-state={resolvedTheme}
            >
                {resolvedTheme === "dark" ? (
                    <Moon className="h-4 w-4 text-blue-600" />
                ) : (
                    <Sun className="h-4 w-4 text-yellow-500" />
                )}
            </span>
        </button>
    )
}
