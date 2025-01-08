import { Dispatch, SetStateAction } from 'react'

export type TProperties = {
  disabled: boolean
  setDisabled: Dispatch<SetStateAction<boolean>>
}
