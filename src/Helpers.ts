export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function undefined(val: any): boolean{
    return val===undefined || val===null;
}
