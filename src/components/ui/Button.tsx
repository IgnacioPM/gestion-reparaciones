interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: "primary" | "secondary" | "danger";
}

export default function Button({ children, color = "primary", className = "", ...props }: ButtonProps) {
    const base = "py-2 px-4 rounded-md transition focus:outline-none";
    let colorClass = "bg-blue-600 text-white hover:bg-blue-700";

    if (color === "secondary") {
        colorClass = "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";
    } else if (color === "danger") {
        colorClass = "bg-red-600 text-white hover:bg-red-700";
    }

    return (
        <button
            {...props}
            className={`${base} ${colorClass} ${className}`.trim()}
        >
            {children}
        </button>
    );
}
