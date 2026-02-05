
export function formatCurrency(amount: number | string, locale: 'fr' | 'ar'): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-TN' : 'fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    let formatted = formatter.format(numericAmount);

    // Custom formatting for Tunisian display
    if (locale === 'fr') {
        // Replace "TND" with "DT" to match local preference
        // Intl output might be "150,50 TND" or "TND 150.50"
        formatted = formatted.replace('TND', 'DT').trim();
    } else if (locale === 'ar') {
        // Replace "TND" with "د.ت"
        formatted = formatted.replace('TND', 'د.ت').trim();
    }

    return formatted;
}
