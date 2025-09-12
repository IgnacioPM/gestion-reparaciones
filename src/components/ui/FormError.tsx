interface FormErrorProps {
    message?: string
}

export default function FormError({ message }: FormErrorProps) {
    if (!message) return null
    return (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center font-medium">
            {message}
        </p>
    )
}
