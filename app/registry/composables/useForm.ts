import { onUnmounted, reactive, toRaw } from 'vue'

type Primitive = string | number | boolean | bigint | symbol | null | undefined
type StorageType = 'session' | 'local'

type Path<T> = T extends Primitive
    ? never
    : {
            [K in keyof T & string]:
                | K
                | (T[K] extends Primitive ? K : `${K}.${Path<T[K]>}`)
        }[keyof T & string]

type PathValue<T, P extends Path<T>>
    = P extends `${infer K}.${infer R}`
        ? K extends keyof T
            ? R extends Path<T[K]>
                ? PathValue<T[K], R>
                : never
            : never
        : P extends keyof T
            ? T[P]
            : never

type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

const deepClone = <T>(val: T): T =>
    structuredClone
        ? structuredClone(val)
        : JSON.parse(JSON.stringify(val))

const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === 'object' && val !== null

const setAtPath = (
    target: Record<string, unknown>,
    path: string,
    value: unknown,
) => {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let cur: Record<string, unknown> = target

    for (const key of keys) {
        cur[key] = isObject(cur[key]) ? cur[key] : {}
        cur = cur[key] as Record<string, unknown>
    }

    cur[lastKey] = value
}

const getAtPath = (
    target: Record<string, unknown>,
    path: string,
): unknown =>
    path.split('.').reduce<unknown>((cur, key) => {
        if (!isObject(cur)) return undefined
        return cur[key]
    }, target)

const traverseLeaves = (
    obj: unknown,
    cb: (path: string, value: unknown) => void,
    base = '',
) => {
    if (!isObject(obj)) return

    for (const key of Object.keys(obj)) {
        const path = base ? `${base}.${key}` : key
        const val = obj[key]

        if (isObject(val) && !Array.isArray(val))
            traverseLeaves(val, cb, path)
        else
            cb(path, val)
    }
}

const applyPatch = (
    target: Record<string, unknown>,
    values: unknown,
) => {
    traverseLeaves(values, (path, value) => {
        setAtPath(target, path, value)
    })
}

const replaceValues = (
    target: Record<string, unknown>,
    source: unknown,
) => {
    for (const key of Object.keys(target)) {
        target[key] = undefined
    }

    if (isObject(source)) {
        Object.assign(target, deepClone(source))
    }
}

const xor = (str: string, key: string) =>
    str
        .split('')
        .map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)),
        )
        .join('')

const encrypt = (obj: unknown, secret: string) =>
    btoa(xor(JSON.stringify(obj), secret))

const decrypt = <T>(str: string, secret: string): T =>
    JSON.parse(xor(atob(str), secret))

const getStorage = (type: StorageType) =>
    type === 'local' ? localStorage : sessionStorage

const getCacheKey = () =>
    location.pathname

export function useForm<T extends Record<string, unknown>>(
    initialValues: T,
    options?: {
        cache?: boolean
        secret?: string
        storage?: StorageType
        autoPersist?: boolean
    },
) {
    const form = reactive<T>(initialValues)
    const snapshot = deepClone(initialValues)

    const {
        cache = true,
        secret = 'AK78FB',
        storage = 'session',
        autoPersist = true,
    } = options ?? {}

    if (cache && secret) {
        const store = getStorage(storage)
        const cached = store.getItem(getCacheKey())

        if (cached) {
            try {
                const data = decrypt<T>(cached, secret)
                replaceValues(form, data)
            }
            catch {
                store.removeItem(getCacheKey())
            }
        }
    }

    if (cache && autoPersist) {
        onUnmounted(() => {
            persist()
        })
    }

    const reset = () => {
        replaceValues(form, snapshot)
    }

    const setFieldValue = <P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ) => {
        setAtPath(form, path, value)
    }

    const getFieldValue = <P extends Path<T>>(path: P): PathValue<T, P> =>
        getAtPath(toRaw(form), path) as PathValue<T, P>

    const setFieldsValue = (values: DeepPartial<T>) => {
        applyPatch(form, values)
    }

    const persist = () => {
        if (!cache || !secret) return
        getStorage(storage).setItem(
            getCacheKey(),
            encrypt(toRaw(form), secret),
        )
    }

    const clearCache = () => {
        getStorage(storage).removeItem(getCacheKey())
    }

    return {
        form,
        reset,
        setFieldValue,
        getFieldValue,
        setFieldsValue,
        persist,
        clearCache,
    }
}
