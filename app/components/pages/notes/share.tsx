import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base'
import { TShareForm } from '~/lib/types'
import { shareSchema } from '~/lib/validations'

import { useNote } from './context'

export const Share = () => {
  const [disabled, setDisabled] = useState(false)
  const { selectedNote } = useNote()
  const { t } = useTranslation(['common', 'zod'])
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: {
      user: '',
    },
  })
  const { handleSubmit } = formMethods

  const onSubmit = handleSubmit(async (data) => {
    console.log('selectedNote', selectedNote) // eslint-disable-line no-console
    console.log('data', data) // eslint-disable-line no-console
    setDisabled(true)
  })

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown space-y-4"
      >
        <Input
          name="user"
          placeholder={'Email address or group name'}
          required
          disabled={disabled}
        />
      </form>
    </FormProvider>
  )
}
