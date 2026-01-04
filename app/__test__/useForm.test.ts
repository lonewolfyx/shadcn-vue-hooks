import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useForm } from '../registry/composables/useForm'

describe('useForm', () => {
    const createStorageMock = () => {
        let store: Record<string, string> = {}
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString()
            }),
            removeItem: vi.fn((key: string) => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete store[key]
            }),
            clear: vi.fn(() => {
                store = {}
            }),
        }
    }

    const localStorageMock = createStorageMock()
    const sessionStorageMock = createStorageMock()

    beforeEach(() => {
        vi.stubGlobal('localStorage', localStorageMock)
        vi.stubGlobal('sessionStorage', sessionStorageMock)
        localStorageMock.clear()
        sessionStorageMock.clear()

        // Mock location
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/test',
                search: '',
            },
            writable: true,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with default values', () => {
        const initialValues = {
            name: 'John',
            age: 30,
            address: {
                city: 'New York',
                zip: '10001',
            },
        }

        const { form } = useForm(initialValues, { autoPersist: false })

        expect(form.name).toBe('John')
        expect(form.age).toBe(30)
        expect(form.address.city).toBe('New York')
    })

    it('should get field value using path', () => {
        const initialValues = {
            user: {
                details: {
                    name: 'Alice',
                },
            },
        }

        const { getFieldValue } = useForm(initialValues, { autoPersist: false })

        expect(getFieldValue('user.details.name')).toBe('Alice')
        expect(getFieldValue('user')).toEqual({ details: { name: 'Alice' } })
    })

    it('should set field value using path', () => {
        const initialValues = {
            user: {
                name: 'Bob',
                age: 25,
            },
        }

        const { form, setFieldValue } = useForm(initialValues, { autoPersist: false })

        setFieldValue('user.name', 'Charlie')
        expect(form.user.name).toBe('Charlie')

        setFieldValue('user.age', 26)
        expect(form.user.age).toBe(26)
    })

    it('should set multiple fields values (patch)', () => {
        const initialValues = {
            name: 'David',
            settings: {
                theme: 'light',
                notifications: true,
            },
        }

        const { form, setFieldsValue } = useForm(initialValues, { autoPersist: false })

        setFieldsValue({
            name: 'Eve',
            settings: {
                theme: 'dark',
            },
        })

        expect(form.name).toBe('Eve')
        expect(form.settings.theme).toBe('dark')
        expect(form.settings.notifications).toBe(true) // Should remain unchanged
    })

    it('should reset form to initial values', () => {
        const initialValues = {
            count: 0,
        }

        const { form, reset, setFieldValue } = useForm(initialValues, { autoPersist: false })

        setFieldValue('count', 5)
        expect(form.count).toBe(5)

        reset()
        expect(form.count).toBe(0)
    })

    it('should persist data to storage', () => {
        const initialValues = { data: 'test' }
        const { persist } = useForm(initialValues, { storage: 'local', secret: 'secret', autoPersist: false })

        persist()

        expect(localStorage.setItem).toHaveBeenCalled()
        // Verify key is location based
        const expectedKey = '/test'
        expect(localStorage.setItem).toHaveBeenCalledWith(expectedKey, expect.any(String))
    })

    it('should restore data from storage on init', () => {
        // Setup existing data in storage
        const initialValues = { data: 'initial' }

        // We need to use the internal encrypt logic or manually mock the stored value
        // The hook uses: btoa(xor(JSON.stringify(obj), secret))
        // Let's rely on the hook's own persist to set it up first, or manually mock

        // Let's use a helper to encrypt compatible with the hook's logic if possible,
        // or just use useForm to save it first in a separate instance.

        // Create a temporary form to save data
        const { persist: saveTemp, setFieldValue: setTemp } = useForm(initialValues, { storage: 'local', secret: 'key', autoPersist: false })
        setTemp('data', 'restored')
        saveTemp()

        // Now create the actual form under test
        const { form } = useForm(initialValues, { storage: 'local', secret: 'key', autoPersist: false })

        expect(form.data).toBe('restored')
    })

    it('should clear cache', () => {
        const initialValues = { data: 'test' }
        const { persist, clearCache } = useForm(initialValues, { storage: 'session', autoPersist: false })

        persist()
        expect(sessionStorage.setItem).toHaveBeenCalled()

        clearCache()
        expect(sessionStorage.removeItem).toHaveBeenCalled()
    })

    it('should auto persist on unmount', async () => {
        const TestComponent = defineComponent({
            setup() {
                const { form } = useForm({ value: 'initial' }, {
                    storage: 'local',
                    autoPersist: true,
                    secret: 'secret',
                })
                return { form }
            },
            template: '<div></div>',
        })

        const wrapper = mount(TestComponent)
        wrapper.vm.form.value = 'changed'

        wrapper.unmount()

        expect(localStorage.setItem).toHaveBeenCalled()

        // Verify the stored value corresponds to 'changed'
        // We can do this by trying to restore it
        const { form: restoredForm } = useForm({ value: 'initial' }, {
            storage: 'local',
            secret: 'secret',
            autoPersist: false,
        })
        expect(restoredForm.value).toBe('changed')
    })

    it('should not persist if cache is false', () => {
        const { persist } = useForm({ val: 1 }, { cache: false, autoPersist: false })
        persist()
        expect(localStorage.setItem).not.toHaveBeenCalled()
        expect(sessionStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle complex nested paths', () => {
        const initialValues = {
            a: {
                b: {
                    c: [1, 2, 3],
                    d: {
                        e: 'nested',
                    },
                },
            },
        }

        const { form, setFieldValue, getFieldValue } = useForm(initialValues, { autoPersist: false })

        // The type definition in useForm seems to handle array paths as dot notation?
        // Let's check the implementation of setAtPath.
        // It splits by '.', so 'a.b.c' accesses the array.
        // However, standard JS array access via string key works for index.

        // Let's try modifying an object nested deep
        setFieldValue('a.b.d.e', 'changed')
        expect(form.a.b.d.e).toBe('changed')
        expect(getFieldValue('a.b.d.e')).toBe('changed')
    })
})
