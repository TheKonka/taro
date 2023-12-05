import { bindInstanceToNode, bindAnimation, AREA_CHANGE_EVENT_NAME, eventHandler, getComponentEventCallback, VISIBLE_CHANGE_EVENT_NAME, initComponentNodeInfo, findChildNodeWithDFS } from '@tarojs/runtime'

import { createNode } from './render'
import TaroComponentWrapper from './base'
import { TOUCH_EVENT_MAP } from './utils/constant/event'
import { FlexManager } from './utils/FlexManager'
import { createTaroEvent } from './utils/events'
import { getNormalAttributes, shouldBindEvent, getNodeThresholds } from './utils/helper'

import type { TaroAny, TaroEvent, TaroFormWidgetElement } from '@tarojs/runtime'
import type { TaroElement } from './element'
import type { TaroStyleType } from './type'


@Extend(Flex)
function attrs (style: TaroStyleType) {
  .id(style.id)
  .key(style.id)
  .padding(style.padding)
  .margin(style.margin)
  .width(style.width)
  .height(style.height)
  .constraintSize(style.constraintSize)
  .flexGrow(style.flexGrow)
  .flexShrink(style.flexShrink)
  .flexBasis(style.flexBasis)
  .alignSelf(style.alignSelf)
  .backgroundColor(style.backgroundColor)
  .backgroundImage(style.backgroundImage, style.backgroundRepeat)
  .backgroundImageSize(style.backgroundImageSize)
  .rotate(style.rotate)
  .scale(style.scale)
  .translate(style.translate)
  .transform(style.transform)
  .borderStyle(style.borderStyle)
  .borderWidth(style.borderWidth)
  .borderColor(style.borderColor)
  .borderRadius(style.borderRadius)
  .linearGradient(style.linearGradient)
  .zIndex(style.zIndex)
  .opacity(style.opacity)
  .clip(style.clip)
}

@Component
export default struct TaroForm {
  nodeInfoMap: TaroAny = {}

  @Styles visibleChangeEvent () {
    .onVisibleAreaChange(getNodeThresholds(this.node) || [0.0, 1.0], getComponentEventCallback(this.node, VISIBLE_CHANGE_EVENT_NAME))
  }

  @ObjectLink node: TaroElement

  aboutToAppear () {
    initComponentNodeInfo(this, this.node)
    bindInstanceToNode(this.node, this)
    // 绑定动画
    bindAnimation(this.node)

    // 监听submit冒泡
    this.node.addEventListener('submit-btn', (e: TaroEvent) => {
      e.stopPropagation()
      const formResult: Record<string, string> = {}
      findChildNodeWithDFS<TaroFormWidgetElement>(this.node, (item) => {
        switch (item.nodeName) {
          case 'INPUT':
          case 'SLIDER':
          case 'SWITCH':
          case 'RADIO-GROUP':
          case 'CHECKBOX-GROUP':
          case 'PICKER': {
            formResult[item.name] = item.value
            break
          }
        }
        return false
      }, true)
      const event: TaroEvent = createTaroEvent('submit', { detail: { value: formResult } }, this.node)
      eventHandler(event, 'submit', this.node)
    })
    // 监听reset冒泡
    this.node.addEventListener('reset-btn', (e: TaroEvent) => {
      findChildNodeWithDFS<TaroFormWidgetElement>(this.node, (item) => {
        e.stopPropagation()
        switch (item.nodeName) {
          case 'INPUT': {
            item.value = item._attrs.value
            break
          }
          case 'SLIDER': {
            item.value = item._attrs.value
            break
          }
          case 'SWITCH': {
            item.value = item._attrs.checked
            break
          }
          case 'RADIO-GROUP': {
            item._instance.reset()
            break
          }
          case 'CHECKBOX-GROUP': {
            item._instance.reset()
            break
          }
          case 'PICKER': {
            item.value = item._attrs.value
            break
          }
        }
        return false
      }, true)
    })
  }

  @Styles defaultEvent () {
    .onClick(shouldBindEvent((e: ClickEvent) => eventHandler(e, 'click', this.node), this.node, ['click']))
    .onTouch(shouldBindEvent((e: TouchEvent) => eventHandler(e, TOUCH_EVENT_MAP.get(e.type), this.node), this.node, TOUCH_EVENT_MAP.values()))
    .onAreaChange(getComponentEventCallback(this.node, AREA_CHANGE_EVENT_NAME, res => {
      const eventResult: TaroAny = res.eventResult
      this.nodeInfoMap[this.node._nid].areaInfo = eventResult[1]
    }))
  }

  build() {
    TaroComponentWrapper({ node: this.node }) {
      Flex(FlexManager.flexOptions(this.node)) {
        ForEach(this.node.childNodes, (item: TaroElement) => {
          createNode(item)
        }, (item: TaroElement) => item._nid)
      }
      .attrs(getNormalAttributes(this.node))
      .defaultEvent()
      .visibleChangeEvent()
    }
  }
}