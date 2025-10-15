export const isValidDecimalInput = (value) => {
    return value === '' || /^-?\d*(\.\d*)?$/.test(value);
};

export const isValidFractionInput = (value) => {
    return value === '' || /^-?[\d\s/]+$/.test(value);
};

const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y > 1e-8) {
        const temp = y;
        y = x % y;
        x = temp;
    }
    return x || 1;
};

const trimTrailingZeros = (value) => {
    const str = value.toString();
    return str.includes('.') ? str.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') : str;
};

export const fractionToFloat = (input) => {
    if (typeof input !== 'string') {
        return NaN;
    }
    const trimmed = input.trim();
    if (!trimmed) {
        return NaN;
    }

    let negative = false;
    let working = trimmed;
    if (working.startsWith('-')) {
        negative = true;
        working = working.slice(1).trim();
    }

    const parts = working.split(' ').filter(Boolean);
    let whole = 0;
    let fractionPart = '';

    if (parts.length === 1) {
        fractionPart = parts[0];
    } else if (parts.length === 2) {
        whole = parseInt(parts[0], 10);
        if (Number.isNaN(whole)) {
            return NaN;
        }
        fractionPart = parts[1];
    } else {
        return NaN;
    }

    let fractionValue = 0;
    if (fractionPart.includes('/')) {
        const [numeratorStr, denominatorStr] = fractionPart.split('/').map(part => part.trim());
        const numerator = parseInt(numeratorStr, 10);
        const denominator = parseInt(denominatorStr, 10);
        if (Number.isNaN(numerator) || Number.isNaN(denominator) || denominator === 0) {
            return NaN;
        }
        fractionValue = numerator / denominator;
    } else {
        const parsed = parseFloat(fractionPart);
        if (Number.isNaN(parsed)) {
            return NaN;
        }
        fractionValue = parsed;
    }

    const result = whole + fractionValue;
    return negative ? -result : result;
};

export const floatToFraction = (value, maxDenominator = 32) => {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
        return '';
    }

    const negative = value < 0;
    const absValue = Math.abs(value);
    const whole = Math.floor(absValue);
    const fractional = absValue - whole;

    if (fractional < 0.00001) {
        const integerResult = negative ? -whole : whole;
        return integerResult.toString();
    }

    let bestNumerator = 0;
    let bestDenominator = 1;
    let smallestDiff = Number.POSITIVE_INFINITY;

    for (let denominator = 2; denominator <= maxDenominator; denominator++) {
        const numerator = Math.round(fractional * denominator);
        if (numerator === 0 || numerator > denominator) {
            continue;
        }
        const diff = Math.abs(fractional - numerator / denominator);
        if (diff < smallestDiff - 1e-8) {
            const divisor = gcd(numerator, denominator);
            bestNumerator = numerator / divisor;
            bestDenominator = denominator / divisor;
            smallestDiff = diff;
        }
    }

    if (bestNumerator === 0) {
        const decimalString = trimTrailingZeros(absValue.toFixed(4));
        return negative ? `-${decimalString}` : decimalString;
    }

    let fractionText = `${bestNumerator}/${bestDenominator}`;
    if (whole > 0) {
        fractionText = `${whole} ${fractionText}`;
    }

    return negative ? `-${fractionText}` : fractionText;
};

export const parseQuantityToFloat = (quantity, mode) => {
    if (quantity === '' || quantity === null || quantity === undefined) {
        return NaN;
    }

    if (mode === 'fraction') {
        return fractionToFloat(quantity);
    }

    const parsed = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    return Number.isNaN(parsed) ? NaN : parsed;
};

export const toDecimalDisplayString = (value) => {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    let numberValue = value;
    if (typeof value === 'string') {
        const fractionAttempt = fractionToFloat(value);
        if (!Number.isNaN(fractionAttempt)) {
            numberValue = fractionAttempt;
        } else {
            const parsed = parseFloat(value);
            if (!Number.isNaN(parsed)) {
                numberValue = parsed;
            } else {
                return value;
            }
        }
    }

    if (typeof numberValue !== 'number' || Number.isNaN(numberValue)) {
        return '';
    }

    return trimTrailingZeros(numberValue);
};
