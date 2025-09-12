import LoginForm from "@/components/forms/LoginForm"

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md transition-colors">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white transition-colors">
                    Iniciar Sesión
                </h1>
                <LoginForm />
            </div>
        </div>
    )
}
