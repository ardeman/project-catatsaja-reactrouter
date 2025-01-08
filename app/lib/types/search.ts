import { z } from 'zod'

import { searchSchema } from '~/lib/validations/search'

export type TSearchRequest = z.infer<typeof searchSchema>
