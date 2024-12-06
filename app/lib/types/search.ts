import { z } from 'zod'

import { searchSchema } from '~/lib/validations'

export type TSearchRequest = z.infer<typeof searchSchema>
