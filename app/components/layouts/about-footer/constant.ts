import { TFunction } from 'i18next'

import { aboutMenus } from '~/components/layouts/navbar'
import { appName } from '~/lib/constants/metadata'
import { TMenu } from '~/lib/types/common'

export const homeMenus = (t: TFunction): TMenu[] => [
  {
    name: appName,
    href: '/',
  },
  ...aboutMenus(t),
]
