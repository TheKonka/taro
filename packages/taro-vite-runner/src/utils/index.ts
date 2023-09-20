import { NODE_MODULES_REG } from '@tarojs/helper'
import { isString } from '@tarojs/shared'
import path from 'path'
import querystring from 'querystring'

import type {
  ViteH5BuildConfig,
  ViteH5CompilerContext,
  ViteHarmonyBuildConfig,
  ViteHarmonyCompilerContext,
  ViteMiniBuildConfig,
  ViteMiniCompilerContext,
  VitePageMeta
} from '@tarojs/taro/types/compile/viteCompilerContext'
import type { Target } from 'vite-plugin-static-copy'

export function convertCopyOptions (taroConfig: ViteMiniBuildConfig | ViteH5BuildConfig | ViteHarmonyBuildConfig) {
  const copy = taroConfig.copy
  const copyOptions: Target[] = []
  copy?.patterns.forEach(({ from, to }) => {
    const { base, ext } = path.parse(to)
    to = to
      .replace(new RegExp('^' + taroConfig.outputRoot + '/'), '')
    let rename

    if (ext) {
      to = to.replace(base, '')
      rename = base
    } else {
      rename = '/'
    }


    copyOptions.push({
      src: from,
      dest: to,
      rename
    })
  })
  return copyOptions
}

export function prettyPrintJson (obj: Record<string, any>) {
  return JSON.stringify(obj, null, 2)
}

export function getComponentName (viteCompilerContext: ViteH5CompilerContext | ViteHarmonyCompilerContext | ViteMiniCompilerContext, componentPath: string) {
  let componentName: string
  if (NODE_MODULES_REG.test(componentPath)) {
    componentName = componentPath
      .replace(viteCompilerContext.cwd, '')
      .replace(/\\/g, '/')
      .replace(path.extname(componentPath), '')
      .replace(/node_modules/gi, 'npm')
  } else {
    componentName = componentPath
      .replace(viteCompilerContext.sourceDir, '')
      .replace(/\\/g, '/')
      .replace(path.extname(componentPath), '')
  }

  return componentName.replace(/^(\/|\\)/, '')
}

const virtualModulePrefix ='\0'
const virtualModulePrefixREG = new RegExp(`^${virtualModulePrefix}`)

export function appendVirtualModulePrefix (id: string): string {
  return virtualModulePrefix + id
}

export function stripVirtualModulePrefix (id: string): string {
  return id.replace(virtualModulePrefixREG, '')
}

export function isVirtualModule (id: string): boolean {
  return virtualModulePrefixREG.test(id)
}

export function isRelativePath (id: string | undefined): boolean {
  if (!isString(id)) return false

  if (path.isAbsolute(id)) return false

  if (/^[a-z][a-z0-9+.-]*:/i.test(id)) return false

  return true
}

export function stripMultiPlatformExt (id: string): string {
  return id.replace(new RegExp(`\\.${process.env.TARO_ENV}$`), '')
}

export const addTrailingSlash = (url = '') => (url.charAt(url.length - 1) === '/' ? url : url + '/')

// TODO 关于mode 全部替换成这个
export function getMode (config: ViteH5BuildConfig | ViteHarmonyBuildConfig | ViteMiniBuildConfig) {
  const preMode = config.mode || process.env.NODE_ENV
  const modes: ('production' | 'development' | 'none')[] = ['production', 'development', 'none']
  const mode = modes.find(e => e === preMode)
    || (!config.isWatch || process.env.NODE_ENV === 'production' ? 'production' : 'development')
  return mode
}


export function genRouterResource (page: VitePageMeta) {
  return [
    'Object.assign({',
    `  path: '${page.name}',`,
    '  load: async function(context, params) {',
    `    const page = await import("${page.scriptPath}")`,
    '    return [page, context, params]',
    '  }',
    `}, ${JSON.stringify(page.config)})`
  ].join('\n')
}

export function getQueryParams (path: string) {
  return querystring.parse(path.split('?')[1])
}

export function generateQueryString (params: { [key: string] : string }): string {
  return querystring.stringify(params)
}