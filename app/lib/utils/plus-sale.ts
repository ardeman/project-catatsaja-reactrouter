import { environment } from '~/lib/utils/environment'

// Whether Plus can be bought, so nothing on sale is labelled "coming soon".
export const isPlusOnSale = Boolean(environment.VITE_PLUS_CHECKOUT_URL?.trim())
