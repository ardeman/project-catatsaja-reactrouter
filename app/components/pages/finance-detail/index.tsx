import { ItemForm } from './item-form'
import { TitleForm } from './title-form'

export const FinanceDetailPage = () => {
  return (
    <title className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <TitleForm />
      <ItemForm />
    </title>
  )
}
