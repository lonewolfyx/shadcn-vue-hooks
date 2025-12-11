<template>
    <div
        v-if="page"
        class="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full"
        data-slot="docs"
    >
        <div class="flex min-w-0 flex-1 flex-col">
            <div class="h-(--top-spacing) shrink-0" />
            <div
                class="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-neutral-800 md:px-0 lg:py-8 dark:text-neutral-300"
            >
                <div class="flex flex-col gap-2">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-start justify-between">
                            <h1 class="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                                {{ page.title }}
                            </h1>

                            <div
                                :class="cn(
                                    'docs-nav',
                                    'bg-background/80 border-border/50',
                                    'fixed inset-x-0 bottom-0 isolate z-50',
                                    'flex items-center gap-2',
                                    'border-t px-6 py-4 backdrop-blur-sm',
                                    'sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none',
                                    'sm:px-0 sm:pt-1.5',
                                )"
                            >
                                <Button
                                    v-if="neighbours?.[0]"
                                    as-child
                                    class="extend-touch-target ml-auto size-8 shadow-none md:size-7"
                                    size="icon"
                                    variant="secondary"
                                >
                                    <NuxtLink :to="neighbours[0].path">
                                        <Icon name="tabler:arrow-left" />
                                        <span class="sr-only">Previous</span>
                                    </NuxtLink>
                                </Button>

                                <Button
                                    v-if="neighbours?.[1]"
                                    as-child
                                    class="extend-touch-target size-8 shadow-none md:size-7"
                                    size="icon"
                                    variant="secondary"
                                >
                                    <NuxtLink :to="neighbours[1].path">
                                        <span class="sr-only">Next</span>
                                        <Icon name="tabler:arrow-right" />
                                    </NuxtLink>
                                </Button>
                            </div>
                        </div>
                        <p
                            v-if="page.description"
                            class="text-muted-foreground text-[1.05rem] text-balance sm:text-base"
                        >
                            {{ page.description }}
                        </p>
                    </div>
                </div>

                <ContentRenderer
                    :value="page"
                    class="w-full flex-1 *:data-[slot=alert]:first:mt-0"
                />
            </div>
        </div>

        <div
            class="sticky top-[calc(var(--header-height)+1px)] z-30 ml-auto hidden h-[calc(100svh-var(--header-height)-var(--footer-height))] w-72 flex-col gap-4 overflow-hidden overscroll-none pb-8 xl:flex"
        >
            <div class="h-(--top-spacing) shrink-0" />
            <div
                v-if="page.body.toc?.links.length"
                class="no-scrollbar overflow-y-auto px-8"
            >
                <DocsTableOfContents :toc="page.body.toc" />
                <div class="h-12" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { cn } from '~/lib/utils'

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => {
    return queryCollection('content').path(route.path).first()
})

if (!page.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const { data: neighbours } = await useAsyncData(`surround-${route.path}`, () => {
    return queryCollectionItemSurroundings('content', route.path)
})
</script>
