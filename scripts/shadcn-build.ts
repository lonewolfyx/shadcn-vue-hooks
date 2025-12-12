import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from '../package.json'
import components from '../components.json'
import { generateShadcnRegistry } from 'shadcn-vue-registry'
import { x } from 'tinyexec'
import { mkdir, unlink, writeFile } from 'node:fs/promises';

(async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    const cwd = resolve(__dirname, '../')
    const registryPath = resolve(cwd, './app/registry')
    const outputPath = resolve(cwd, './public/r/')
    const config = {
        root: cwd,
        name: pkg.name,
        homepage: 'https://github.com/lonewolfyx/',
        registries: components.registries,
        cwd: registryPath,
        output: registryPath,
        scanPatterns: {
            componentPattern: '*/*',
            filePattern: '*',
        },
    }

    const registryJson = await generateShadcnRegistry(config)

    const registryJsonPath = resolve(registryPath, 'registry.json')
    await mkdir(dirname(registryJsonPath), { recursive: true })
    await writeFile(registryJsonPath, JSON.stringify(registryJson, null, 2))
    console.log(`✓ Registry JSON is saved to: ${registryJsonPath}`)

    await mkdir(outputPath, { recursive: true })
    console.log(`✓ The output directory has been created: ${outputPath}`)

    await x('shadcn-vue', ['build', '-c', registryPath, '-o', outputPath], {
        nodeOptions: {
            cwd,
            shell: true,
        },
    })

    await unlink(registryJsonPath)

    console.log(`\n\n✓ Shadcn Vue Registry Files Generate Done`)
    console.log(`Your shadcn resource address:\n /r/registry.json \n /r/{name}.json`)
})()
