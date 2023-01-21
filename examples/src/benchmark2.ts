import * as VENTEA from "venteajs";

const stringMap: Map<string, number> = new Map();
const intMap: Map<number, number> = new Map();

const stringKey = "a";
const intKey = 1;

stringMap.set(stringKey, 0);
intMap.set(intKey, 0);

for (let j = 0; j < 10; j++) {
    const startString = performance.now();
    for (let i = 0; i < 100; i++) {
        const val = stringMap.get(stringKey);
    }
    const endString = performance.now();
    const timeString = endString - startString;

    const startInt = performance.now();
    for (let i = 0; i < 100; i++) {
        const val = intMap.get(intKey);
    }
    const endInt = performance.now();
    const timeInt = endInt - startInt;

    console.log(`String: ${timeString}ms, Int: ${timeInt}ms`);
}