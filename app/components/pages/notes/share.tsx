import { zodResolver } from '@hookform/resolvers/zod'
import { BookUser, CircleUser, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  THandleDeletePermission,
  THandleSetPermission,
  TParamsPermission,
  TPermissions,
  TShareForm,
} from '~/lib/types'
import { shareSchema } from '~/lib/validations'

export const Share = (props: TPermissions) => {
  const { write, read, handleShare, handleUnshare } = props
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')
  const { t } = useTranslation(['common', 'zod'])
  const { data: searchResults } = useSearchUsers(email)
  const { data: users } = useGetUsers()
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: { user: '' },
  })
  const { handleSubmit, getValues } = formMethods

  const onSubmit = handleSubmit(async (data) => {
    setEmail(data.user)
    setDisabled(true)
  })

  const permissions = useMemo(
    () => new Set([...(read || []), ...(write || [])]),
    [read, write],
  )

  useEffect(() => {
    if (
      searchResults?.filter((user) => !permissions.has(user.uid)).length === 0
    ) {
      setDisabled(false)
    }
  }, [searchResults, permissions])

  const handleDeletePermission = (params: THandleDeletePermission) => {
    const { email, uid } = params
    if (email === getValues().user) {
      setEmail('')
      setDisabled(false)
      return
    }
    handleUnshare({ uid })
    console.log('handleDeletePermission', uid) // eslint-disable-line no-console
  }

  const handleSetPermission = (params: THandleSetPermission) => {
    const { permission, uid } = params
    handleShare({ uid, permission })
    console.log('handlePermission', permission, uid) // eslint-disable-line no-console
  }

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

        {searchResults
          ?.filter((user) => !permissions.has(user.uid))
          .map(({ uid, photoURL, displayName, email }) => (
            <Permission
              key={uid}
              photoURL={photoURL}
              displayName={displayName}
              uid={uid}
              email={email}
              write={[]}
              handleDeletePermission={handleDeletePermission}
              handleSetPermission={handleSetPermission}
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
                  email={users.find((user) => user.uid === uid)?.email || ''}
                  uid={uid}
                  handleDeletePermission={handleDeletePermission}
                  handleSetPermission={handleSetPermission}
                />
              ),
          )}
      </form>
    </FormProvider>
  )
}

const Permission = (params: TParamsPermission) => {
  const {
    write,
    photoURL,
    displayName,
    uid,
    email,
    handleDeletePermission,
    handleSetPermission,
  } = params
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
        <div className="max-w-32 md:max-w-48">
          <p className="truncate">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <Select
          onValueChange={(newValue: THandleSetPermission['permission']) =>
            handleSetPermission({ permission: newValue, uid })
          }
          defaultValue={
            write.length > 0 ? (write.includes(uid) ? 'write' : 'read') : ''
          }
        >
          <SelectTrigger className="w-fit gap-2">
            <SelectValue placeholder={t('form.permissions.select')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">
              {t('form.permissions.readOnly')}
            </SelectItem>
            <SelectItem value="write">{t('form.permissions.write')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleDeletePermission({ uid, email })}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
