interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: "primary" | "secondary";
}

export default function Button({ children, color = "primary", className = "", ...props }: ButtonProps) {
    const base = "py-2 px-4 rounded-md transition focus:outline-none";
    const colorClass =
        color === "secondary"
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            : "bg-blue-600 text-white hover:bg-blue-700";
    return (
        <button
            {...props}
            className={`${base} ${colorClass} ${className}`.trim()}
        >
            {children}
        </button>
    );
}
