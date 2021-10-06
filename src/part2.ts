/* 2.1 */

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}

export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    const store = new Map();
    return {
        get(key: K) {
            return new Promise((resolve, reject) => {
            const val = store.get(key);
            if (val == undefined)
                reject(MISSING_KEY);
            else resolve(val);
            })
        },
        set(key: K, value: V) {
            return new Promise((resolve) => {
            store.set(key, value);
            resolve();
            })
        },
        delete(key: K) {
            return new Promise((resolve, reject) => {
            const deleted = store.delete(key);
            if (deleted == false)
                reject(MISSING_KEY);
            else resolve();
            })
        }
    }
}

export function getAll<K, V>(store: PromisedStore<K, V>, keys: K[]): Promise<V[]|V> {
    const values = keys.map(x=> store.get(x));
    const missing = values.some(x=> x == Promise.reject(MISSING_KEY));
    if (missing) 
        return Promise.reject(MISSING_KEY);
    return Promise.all(values);

}

/* 2.2 */

export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store: PromisedStore<T,R> = makePromisedStore<T,R>();
    const helper = async(param: T): Promise<R> => { 
        return store.get(param).then(value => value)
        .catch(t => { store.set(param, f(param));
                        return store.get(param);});}
    return helper;
}

/* 2.3 */

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (param: T) => boolean): () => Generator<T> {
    return function* Generator() {
        for (let x of genFn()) {
            if (filterFn(x))
                yield x;
        }
    }
}

export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (param: T) => R): () => Generator<R> {
    return function* Generator() {
        for (let x of genFn()) {
            yield mapFn(x);
        }
    }
}

/* 2.4 */
// you can use 'any' in this question

export async function asyncWaterfallWithRetry(fns:[() => Promise<any>,... ((x: any) => Promise<any>)[]]): Promise<any> {
    let first = fns[0];
   let curr = first().then((x:any) => first().catch(async(reason: any) => await new Promise<any>((resolve, reject) =>
    setTimeout(() => resolve(first()), 2000)))
    .catch(async (reason: any) => await new Promise<any>((resolve, reject) =>
    setTimeout(() => resolve(first()), 2000)))
    .catch(async (reason: any) => await new Promise<any>((resolve, reject) =>
    reject("failed"))));

    let rest = fns.slice(1);
    rest.map(func => { curr = curr.then((x:any) => func(x).catch(async (reason: any) => await new Promise<any>((resolve, reject) =>
    setTimeout(() => resolve(func(x)), 2000)))
    .catch(async (reason: any) => await new Promise<any>((resolve, reject) =>
    setTimeout(() => resolve(func(x)), 2000))))
    .catch(async (reason: any) => await new Promise<any>((resolve, reject) =>
    reject("failed")))});
    return curr;
}  