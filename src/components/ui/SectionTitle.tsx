import React from "react";

interface SectionTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
    return (
        <h2 className={`text-lg font-semibold text-gray-900 dark:text-white mb-3 ${className}`}>
            {children}
        </h2>
    );
}
