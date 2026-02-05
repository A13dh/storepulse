
export function formatDate(date: Date | string, locale: 'fr' | 'ar'): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;

    if (locale === 'fr') {
        // Format: 15 janvier 2026
        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } else {
        // Arabic format
        // Format: ١٥ جانفي ٢٠٢٦
        return d.toLocaleDateString('ar-TN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            // calendar: 'gregory' // standard
        });
    }
}
