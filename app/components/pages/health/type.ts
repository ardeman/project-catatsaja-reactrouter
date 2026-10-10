import { HTMLAttributes } from 'react'

import { THealthLogResponse } from '~/lib/types/health'

export type THandleModifyHealthLog = {
  healthLog: THealthLogResponse
}

export type THandlePinHealthLog = {
  isPinned: boolean
} & THandleModifyHealthLog

export type TCardProperties = {
  healthLog: THealthLogResponse
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type THealthLogConfirmation = {
  kind: string
  detail: THealthLogResponse
}
