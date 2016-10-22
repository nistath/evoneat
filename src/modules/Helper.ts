export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randEntry(arr: Array<any>) {
    return arr[randInt(0, arr.length - 1)];
}

export function varundefined(val: any): boolean {
    return val === undefined || val === null;
}

export function shufflearr(a: Array<any>) {
    let j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
