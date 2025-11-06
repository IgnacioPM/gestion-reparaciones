interface FormattedAmountProps {
    amount: number | null | undefined;
    className?: string;
}

export const FormattedAmount = ({ amount, className = "" }: FormattedAmountProps) => {
    if (amount === null || amount === undefined) return null;

    // Formatear el número usando Intl.NumberFormat
    const formattedAmount = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(amount);

    return <span className={className}>₡{formattedAmount}</span>;
};
