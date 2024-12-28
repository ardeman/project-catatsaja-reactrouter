import { MouseEvent } from 'react'

import { TMoneyLogResponse } from '~/lib/types'

export type TMoneyLogConfirmation = {
  kind: string
  detail: TMoneyLogResponse
}

export type THandleModifyMoneyLog = {
  event: MouseEvent<HTMLButtonElement>
  moneyLog: TMoneyLogResponse
}

export type THandlePinMoneyLog = {
  isPinned: boolean
} & THandleModifyMoneyLog
