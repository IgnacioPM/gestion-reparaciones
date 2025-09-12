import React from "react";

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div>
            <span className="font-medium">{label}:</span> {value ?? "N/A"}
        </div>
    );
}
