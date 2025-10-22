import React from 'react';

interface SectionTitleProps {
    children: React.ReactNode;
    className?: string;
}

export default function SectionTitle({ children, className = "" }: SectionTitleProps) {
    return (
        <h2 className={`text-xl font-semibold text-gray-800 dark:text-white mb-3 ${className}`.trim()}>
            {children}
        </h2>
    );
}