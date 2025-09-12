import React from "react";

interface InfoBlockProps {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function InfoBlock({ title, children, className = "" }: InfoBlockProps) {
    return (
        <div className={className}>
            {title}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}
