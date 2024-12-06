import { z } from 'zod'

import { searchSchema } from '~/validations'

export type TSearchRequest = z.infer<typeof searchSchema>
