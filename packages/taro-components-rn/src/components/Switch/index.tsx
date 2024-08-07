/**
 * ✔ checked
 * ✔ disabled
 * ✔ type
 * ✔ onChange(bindchange) :isChecked
 * ✔ color
 *
 * @warn When type="switch", use native Switch
 * @example
 *  <Switch
 *    checked={this.state.isSwitchChecked}
 *    onChange={this.onSwitchChange}
 *    color="red"
 *  />
 */

import * as React from 'react'
import {
  Switch,
} from 'react-native'

import { noop } from '../../utils'
import Checkbox from '../Checkbox'
import { SwitchProps, SwitchState } from './PropsType'

class _Switch extends React.Component<SwitchProps, SwitchState> {
  static displayName = '_Switch'
  static defaultProps = {
    type: 'switch',
    color: '#04BE02',
    disabled: false,
  }

  // $touchable: Checkbox | Switch | null
  $touchable = React.createRef<Checkbox | Switch>()

  state: SwitchState = {
    checked: !!this.props.checked,
    pChecked: false,
  }

  static getDerivedStateFromProps (nextProps: SwitchProps, lastState: SwitchState): SwitchState | null {
    // eslint-disable-next-line eqeqeq
    const isControlled = nextProps.checked != undefined
    if (isControlled) {
      if (nextProps.checked !== lastState.pChecked) {
        // 受控更新
        return {
          checked: nextProps.checked,
          pChecked: nextProps.checked,
        }
      } else if (nextProps.checked !== lastState.checked) {
        // 受控还原
        return {
          checked: nextProps.checked
        }
      }
    } else if (lastState.pChecked !== nextProps.checked) {
      // 初次更新才设置 defaultChecked
      return {
        pChecked: nextProps.checked,
        checked: nextProps.defaultChecked ?? false,
      }
    }

    return null
  }

  _simulateNativePress = (): void => {
    const { type } = this.props
    if (type === 'checkbox') {
      const node = this.$touchable.current as Checkbox
      node && node._simulateNativePress?.()
    } else {
      // this.$touchable._onChange()
      this.setState({ checked: !this.state.checked })
    }
  }

  onCheckedChange = (isChecked: boolean): void => {
    const { onChange = noop } = this.props
    onChange({ detail: { value: isChecked } })
    this.setState({ checked: isChecked })
  }

  onCheckboxToggle = (item: { checked: boolean }): void => {
    this.onCheckedChange(item.checked)
  }

  render (): JSX.Element {
    const {
      style,
      type,
      color,
      disabled
    } = this.props

    if (type === 'checkbox') {
      return (
        <Checkbox
          onChange={this.onCheckboxToggle}
          checked={this.state.checked}
          disabled={disabled}
          ref={this.$touchable as React.RefObject<Checkbox>}
        />
      )
    }

    return (
      <Switch
        value={this.state.checked}
        onValueChange={disabled ? undefined : this.onCheckedChange}
        trackColor={{ false: '#FFFFFF', true: color }}
        ios_backgroundColor="#FFFFFF"
        style={style}
        disabled={disabled}
        ref={this.$touchable as React.RefObject<Switch>}
      />
    )
  }
}

export default _Switch
