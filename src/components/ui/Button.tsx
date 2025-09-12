interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

export default function Button({ children, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
            {children}
        </button>
    )
}
