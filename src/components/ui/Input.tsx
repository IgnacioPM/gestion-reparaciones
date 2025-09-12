interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
}

export default function Input({ label, error, ...props }: InputProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
            </label>
            <input
                {...props}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                          bg-white dark:bg-gray-800 
                          text-gray-900 dark:text-gray-100
                          shadow-sm focus:border-blue-500 dark:focus:border-blue-400 
                          focus:ring-blue-500 dark:focus:ring-blue-400 
                          placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    )
}
