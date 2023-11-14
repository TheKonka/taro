/* eslint-disable no-console */
import { type IFileType, type TConfig, TaroPlatform } from '@tarojs/service'
import { getPkgVersion } from '@tarojs/service/dist/utils/package'
import { isObject, PLATFORM_TYPE } from '@tarojs/shared'

export abstract class TaroPlatformHarmony<T extends TConfig = TConfig> extends TaroPlatform<T> {
  platformType = PLATFORM_TYPE.HARMONY
  globalObject = 'globalThis'

  abstract fileType: IFileType
  abstract useETS: boolean
  abstract useJSON5: boolean
  taroComponentsPath: string

  /**
   * 1. 清空 dist 文件夹
   * 2. 输出编译提示
   */
  private async setup () {
    await this.setupTransaction.perform(this.setupHarmonyApp, this)
    this.ctx.onSetupClose?.(this)
  }

  private setupHarmonyApp () {
    const { output } = this.config
    // eslint-disable-next-line eqeqeq
    if (output == undefined || output.clean == undefined || output.clean === true) {
      this.emptyOutputDir()
    } else if (isObject(output.clean)) {
      this.emptyOutputDir(output.clean.keep || [])
    }
    this.printDevelopmentTip()
  }

  protected printDevelopmentTip () {
    const tips: string[] = []
    const { chalk } = this.helper

    if (tips.length) {
      console.log(chalk.yellowBright('Tips:'))
      tips.forEach((item, index) => console.log(`${chalk.yellowBright(index + 1)}. ${item}`))
      console.log('\n')
    }
  }

  /**
   * 返回当前项目内的 runner 包
   */
  protected async getRunner () {
    const { appPath } = this.ctx.paths
    const { npm } = this.helper

    const runnerPkg = '@tarojs/vite-runner'
    const runner = await npm.getNpmPkg(runnerPkg, appPath)
    return runner.bind(null, appPath)
  }

  /**
   * 准备 runner 参数
   * @param extraOptions 需要额外合入 Options 的配置项
   */
  protected getOptions (extraOptions = {}) {
    const { ctx } = this
    const { recursiveMerge } = ctx.helper
    const config = recursiveMerge(Object.assign({}, this.config), {
      env: {
        FRAMEWORK: JSON.stringify(this.config.framework),
        TARO_ENV: JSON.stringify(this.platform),
        TARO_PLATFORM: JSON.stringify(this.platformType),
        TARO_VERSION: JSON.stringify(getPkgVersion())
      },
    })

    return {
      ...config,
      buildAdapter: config.platform,
      fileType: this.fileType,
      platformType: this.platformType,
      useETS: this.useETS,
      useJSON5: this.useJSON5,
      ...extraOptions
    }
  }

  /**
   * 调用 runner 开始编译
   * @param extraOptions 需要额外传入 runner 的配置项
   */
  private async build (extraOptions = {}) {
    this.ctx.onBuildInit?.(this)
    await this.buildTransaction.perform(this.buildHarmonyApp, this, extraOptions)
  }

  private async buildHarmonyApp (extraOptions = {}) {
    const runner = await this.getRunner()
    const options = this.getOptions(Object.assign({
      runtimePath: this.runtimePath,
      taroComponentsPath: this.taroComponentsPath,
    }, extraOptions))
    await runner(options)
  }

  /**
   * 调用 runner 开启编译
   */
  public async start () {
    await this.setup()
    await this.build()
  }
}