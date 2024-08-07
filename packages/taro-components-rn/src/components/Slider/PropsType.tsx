import { FormItemProps } from '@tarojs/components'
import { StyleProp, ViewStyle } from 'react-native'

export type CallbackEvent = {
  detail: {
    value: number
  }
}

export interface SliderState {
  currentValue: number
}

export interface SliderProps extends FormItemProps {
  style?: StyleProp<ViewStyle>
  min: number
  max: number
  step: number
  disabled?: boolean
  value?: number
  defaultValue?: number
  activeColor: string
  backgroundColor: string
  blockColor: string
  showValue?: boolean
  onChange?: (event: CallbackEvent) => void
  onChanging?: (event: CallbackEvent) => void
}
