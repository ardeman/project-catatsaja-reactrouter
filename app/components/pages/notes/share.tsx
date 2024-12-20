import { zodResolver } from '@hookform/resolvers/zod'
import { BookUser, CircleUser } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui'
import { useSearchUsers } from '~/lib/hooks'
import { TShareForm } from '~/lib/types'
import { shareSchema } from '~/lib/validations'

import { useNote } from './context'

export const Share = () => {
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')
  const { selectedNote } = useNote()
  const { t } = useTranslation(['common', 'zod'])
  const { data: searchResults } = useSearchUsers(email)
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: {
      user: '',
    },
  })
  const { handleSubmit } = formMethods

  const onSubmit = handleSubmit(async (data) => {
    console.log('selectedNote', selectedNote) // eslint-disable-line no-console

    setEmail(data.user)
    setDisabled(true)
  })

  useEffect(() => {
    if (searchResults === undefined) return
    if (searchResults.length === 0) setDisabled(false)
  }, [searchResults])

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown space-y-4"
      >
        <Input
          name="user"
          placeholder={t('form.user.placeholder')}
          required
          disabled={disabled}
          rightNode={({ className }) => (
            <Button
              type="submit"
              disabled={disabled}
              variant="ghost"
              size="icon"
              className={className}
            >
              <BookUser />
            </Button>
          )}
        />

        {searchResults?.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between gap-x-2"
          >
            <div className="flex items-center gap-x-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback>
                  <CircleUser className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <span>{user.displayName}</span>
            </div>
            <Select>
              <SelectTrigger className="w-fit gap-2">
                <SelectValue placeholder="Choose permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </form>
    </FormProvider>
  )
}
