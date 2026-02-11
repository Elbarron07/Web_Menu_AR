/**
 * Utilitaire d'export CSV pour les pages admin
 */



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], filename: string, columns?: { key: string; header: string }[]) {
    if (!data || data.length === 0) return;

    // Déterminer les colonnes
    const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }));

    // Construire le CSV
    const header = cols.map(c => `"${c.header}"`).join(',');
    const rows = data.map(row =>
        cols.map(c => {
            const val = row[c.key];
            if (val === null || val === undefined) return '""';
            if (typeof val === 'number') return String(val);
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csv = [header, ...rows].join('\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

    // Télécharger
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Calcule la tendance en pourcentage entre deux périodes
 * Compare la période courante vs la période précédente de même durée
 */
export function computeTrend(
    currentValue: number,
    previousValue: number
): { value: string; direction: 'up' | 'down' | 'neutral' } {
    if (previousValue === 0 && currentValue === 0) {
        return { value: '0%', direction: 'neutral' };
    }
    if (previousValue === 0) {
        return { value: '+100%', direction: 'up' };
    }

    const pct = ((currentValue - previousValue) / previousValue) * 100;
    const rounded = Math.round(pct);

    if (rounded === 0) return { value: '0%', direction: 'neutral' };
    if (rounded > 0) return { value: `+${rounded}%`, direction: 'up' };
    return { value: `${rounded}%`, direction: 'down' };
}
