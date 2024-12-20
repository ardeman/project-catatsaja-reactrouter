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
import { auth } from '~/lib/configs'
import { useSearchUsers, useGetUsers } from '~/lib/hooks'
import {
  THandlePermission,
  TParamsPermission,
  TPermissions,
  TShareForm,
} from '~/lib/types'
import { shareSchema } from '~/lib/validations'

export const Share = (props: TPermissions) => {
  const { write, read } = props
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')
  const { t } = useTranslation(['common', 'zod'])
  const { data: searchResults } = useSearchUsers(email)
  const { data: users } = useGetUsers()
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: {
      user: '',
    },
  })
  const { handleSubmit } = formMethods

  const onSubmit = handleSubmit(async (data) => {
    setEmail(data.user)
    setDisabled(true)
  })

  useEffect(() => {
    if (searchResults?.length === 0) setDisabled(false)
  }, [searchResults])

  const permissions = new Set([...(read || []), ...(write || [])])

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown space-y-4"
      >
        <Input
          type="search"
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

        {searchResults?.map(({ uid, photoURL, displayName }) => (
          <Permission
            key={uid}
            photoURL={photoURL || ''}
            displayName={displayName}
            uid={uid}
            write={write}
          />
        ))}

        {[...permissions]
          .filter((uid) => uid !== auth?.currentUser?.uid)
          .map(
            (uid) =>
              users?.find((user) => user.uid === uid) && (
                <Permission
                  key={uid}
                  write={write}
                  photoURL={
                    users.find((user) => user.uid === uid)?.photoURL || ''
                  }
                  displayName={
                    users.find((user) => user.uid === uid)?.displayName || ''
                  }
                  uid={uid}
                />
              ),
          )}
      </form>
    </FormProvider>
  )
}

const handlePermission = (params: THandlePermission) => {
  const { newValue, uid } = params
  console.log('handlePermission', newValue, uid) // eslint-disable-line no-console
}

const Permission = (params: TParamsPermission) => {
  const { write, photoURL, displayName, uid } = params
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex items-center gap-x-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={photoURL} />
          <AvatarFallback>
            <CircleUser className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
      </div>
      <Select
        onValueChange={(newValue) => {
          handlePermission({ newValue, uid })
        }}
        defaultValue={uid ? (write.includes(uid) ? 'write' : 'read') : ''}
      >
        <SelectTrigger className="w-fit gap-2">
          <SelectValue placeholder={t('form.permissions.select')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="read">{t('form.permissions.readOnly')}</SelectItem>
          <SelectItem value="write">{t('form.permissions.write')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
