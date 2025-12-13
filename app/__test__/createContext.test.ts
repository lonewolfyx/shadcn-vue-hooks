import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { createContext } from '@/registry/composables/createContext'

describe('createContext', () => {
    it('should provide and inject context', () => {
        const [injectContext, provideContext] = createContext<string>('Test')

        const Child = defineComponent({
            template: '<div>{{ value }}</div>',
            setup() {
                const value = injectContext()
                return { value }
            },
        })

        const Parent = defineComponent({
            components: { Child },
            template: '<Child />',
            setup() {
                provideContext('test value')
            },
        })

        const wrapper = mount(Parent)
        expect(wrapper.text()).toBe('test value')
    })

    it('should use fallback value if context is not provided', () => {
        const [injectContext] = createContext<string>('Test')

        const Child = defineComponent({
            template: '<div>{{ value }}</div>',
            setup() {
                const value = injectContext('fallback')
                return { value }
            },
        })

        const wrapper = mount(Child)
        expect(wrapper.text()).toBe('fallback')
    })

    it('should throw error if context is not provided and no fallback', () => {
        const [injectContext] = createContext<string>('Test')

        const Child = defineComponent({
            template: '<div></div>',
            setup() {
                injectContext()
            },
        })

        // Suppress Vue warn for missing injection
        const originalWarn = console.warn
        console.warn = () => {}

        try {
            expect(() => mount(Child)).toThrowError(/Injection `Symbol\(TestContext\)` not found/)
        }
        finally {
            console.warn = originalWarn
        }
    })

    it('should handle multiple provider names in error message', () => {
        const [injectContext] = createContext<string>(['ProviderA', 'ProviderB'], 'MyContext')

        const Child = defineComponent({
            template: '<div></div>',
            setup() {
                injectContext()
            },
        })

        const originalWarn = console.warn
        console.warn = () => {}

        try {
            expect(() => mount(Child)).toThrowError(/Component must be used within one of the following components: ProviderA, ProviderB/)
        }
        finally {
            console.warn = originalWarn
        }
    })

    it('should be reactive', async () => {
        const [injectCount, provideCount] = createContext<Ref<number>>('Count')

        const Child = defineComponent({
            template: '<div>{{ count }}</div>',
            setup() {
                const count = injectCount()
                return { count }
            },
        })

        const count = ref(0)
        const Parent = defineComponent({
            components: { Child },
            template: '<Child />',
            setup() {
                provideCount(count)
            },
        })

        const wrapper = mount(Parent)
        expect(wrapper.text()).toBe('0')

        count.value = 1
        await nextTick()
        expect(wrapper.text()).toBe('1')
    })
})
