export function formatInputNumberValue(value: number | string | undefined) {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    const num = Number(value);
    if (Number.isNaN(num)) {
        return `${value}`;
    }

    const decimal = `${value}`.split('.')[1];
    if (decimal && decimal.length > 1) {
        return num.toFixed(1);
    }

    return value;
}
