import { Dispatch, SetStateAction } from 'react'

export type TProps = {
  disabled: boolean
  setDisabled: Dispatch<SetStateAction<boolean>>
}
