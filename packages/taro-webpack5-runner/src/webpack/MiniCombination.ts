import path from 'node:path'

import { REG_NODE_MODULES_DIR, REG_TARO_SCOPED_PACKAGE, taroJsComponents } from '@tarojs/helper'

import { componentConfig } from '../utils/component'
import { BuildNativePlugin } from './BuildNativePlugin'
import { Combination } from './Combination'
import { MiniBaseConfig } from './MiniBaseConfig'
import { MiniWebpackModule } from './MiniWebpackModule'
import { MiniWebpackPlugin } from './MiniWebpackPlugin'

import type { IFileType, IMiniBuildConfig } from '../utils/types'

export class MiniCombination extends Combination<IMiniBuildConfig> {
  buildNativePlugin: BuildNativePlugin
  fileType: IFileType
  isBuildPlugin = false
  optimizeMainPackage: { enable?: boolean | undefined, exclude?: any[] | undefined } = {
    enable: true
  }

  process (config: Partial<IMiniBuildConfig>) {
    const baseConfig = new MiniBaseConfig(this.appPath, config)
    const chain = this.chain = baseConfig.chain
    const {
      entry = {},
      output = {},
      mode = 'production',
      globalObject = 'wx',
      sourceMapType = 'cheap-module-source-map',
      fileType = {
        style: '.wxss',
        config: '.json',
        script: '.js',
        templ: '.wxml'
      },
      /** special mode */
      isBuildPlugin = false,
      /** hooks */
      modifyComponentConfig,
      optimizeMainPackage
    } = config

    this.fileType = fileType

    modifyComponentConfig?.(componentConfig, config)

    if (isBuildPlugin) {
      // 编译目标 - 小程序原生插件
      this.isBuildPlugin = true
      this.buildNativePlugin = BuildNativePlugin.getPlugin(this)
      chain.merge({
        context: path.join(process.cwd(), this.sourceRoot, 'plugin')
      })
    }

    if (optimizeMainPackage) {
      this.optimizeMainPackage = optimizeMainPackage
    }

    const webpackEntry = this.getEntry(entry)
    const webpackOutput = this.getOutput({
      publicPath: '/',
      globalObject,
      isBuildPlugin,
      output
    })
    const webpackPlugin = new MiniWebpackPlugin(this)
    const webpackModule = new MiniWebpackModule(this)

    const module = webpackModule.getModules()
    const [, pxtransformOption] = webpackModule.__postcssOption.find(([name]) => name === 'postcss-pxtransform') || []
    webpackPlugin.pxtransformOption = pxtransformOption as any
    const plugin = webpackPlugin.getPlugins()

    chain.merge({
      entry: webpackEntry,
      output: webpackOutput,
      mode,
      devtool: this.getDevtool(sourceMapType),
      resolve: {
        alias: this.getAlias()
      },
      plugin,
      module,
      optimization: this.getOptimization()
    })
  }

  getEntry (entry: IMiniBuildConfig['entry']) {
    return this.isBuildPlugin ? this.buildNativePlugin.entry : entry
  }

  getOutput ({ publicPath, globalObject, isBuildPlugin, output }) {
    return {
      path: this.outputDir,
      publicPath,
      filename: '[name].js',
      chunkFilename: '[name].js',
      globalObject,
      enabledLibraryTypes: isBuildPlugin ? ['commonjs'] : [],
      ...output
    }
  }

  getAlias () {
    const { alias = {}, taroComponentsPath } = this.config
    return {
      ...alias,
      [`${taroJsComponents}$`]: taroComponentsPath
    }
  }

  getOptimization () {
    return {
      usedExports: true,
      runtimeChunk: {
        name: 'runtime'
      },
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          default: false,
          defaultVendors: false,
          common: {
            name: 'common',
            minChunks: 2,
            priority: 1
          },
          vendors: {
            name: 'vendors',
            minChunks: 2,
            test: module => {
              const nodeModulesDirRegx = new RegExp(REG_NODE_MODULES_DIR)
              return nodeModulesDirRegx.test(module.resource)
            },
            priority: 10
          },
          taro: {
            name: 'taro',
            test: module => REG_TARO_SCOPED_PACKAGE.test(module.context),
            priority: 100
          }
        }
      }
    }
  }
}
