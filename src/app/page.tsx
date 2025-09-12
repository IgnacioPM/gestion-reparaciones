import Navbar from "@/components/ui/Navbar"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                    Bienvenido a la App
                </h1>
            </main>
        </div>
    )
}
