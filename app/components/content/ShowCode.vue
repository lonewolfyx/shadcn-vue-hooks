<template>
    <ProsePre
        :code="code"
        :filename="displayFilename"
        :language="codeLanguage"
    />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
    file: string
    filename?: string
}>()

const displayFilename = computed(() => props.filename ?? (props.file.split('/').pop() || props.file))

const codeLanguage = computed(() => `language-${displayFilename.value.split('.').pop()?.toLowerCase() ?? 'ts'}`)

const files = import.meta.glob('~/registry/composables/**/*', {
    query: '?raw',
    import: 'default',
})

const code = await files[`/registry/${props.file}`]?.() as string
</script>
