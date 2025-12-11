<template>
    <div class="flex flex-1 flex-col justify-center items-center">
        <PageHeader>
            <PageHeaderHeading class="max-w-4xl">
                {{ siteConfig.title }}
            </PageHeaderHeading>
            <PageHeaderDescription>{{ siteConfig.description }}</PageHeaderDescription>

            <Button as-child>
                <NuxtLink to="/docs/getting-started/introduction">
                    Get Started
                </NuxtLink>
            </Button>
        </PageHeader>
    </div>
</template>

<script lang="ts" setup>
import { siteConfig } from '~/lib/config'

useSeoMeta({
    title: siteConfig.siteTitle,
    titleTemplate: siteConfig.siteTitle,
})
</script>
