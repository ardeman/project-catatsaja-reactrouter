import { zodResolver } from '@hookform/resolvers/zod'
import { BookUser, CircleUser, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { auth } from '~/lib/configs/firebase'
import { useGetUsers } from '~/lib/hooks/use-get-users'
import { useSearchUsers } from '~/lib/hooks/use-search-users'
import {
  THandleDeletePermission,
  THandleSetPermission,
  TParametersPermission,
  TPermissions,
  TShareForm,
} from '~/lib/types/common'
import { shareSchema } from '~/lib/validations/common'

export const Share = (properties: TPermissions) => {
  const { write, read, handleShare, handleUnshare } = properties
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')
  const { t } = useTranslation(['common', 'zod'])
  const { data: searchResults } = useSearchUsers(email)
  const { data: users } = useGetUsers()
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: { user: '' },
  })
  const { handleSubmit, getValues, setValue } = formMethods

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

  const handleDeletePermission = (parameters: THandleDeletePermission) => {
    const { email, uid } = parameters
    if (email === getValues().user) {
      setEmail('')
      setDisabled(false)
      setValue('user', '')
      return
    }
    handleUnshare({ uid })
  }

  const handleSetPermission = (parameters: THandleSetPermission) => {
    const { permission, uid } = parameters
    handleShare({ uid, permission })
    setEmail('')
    setDisabled(false)
    setValue('user', '')
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

const Permission = (parameters: TParametersPermission) => {
  const {
    write,
    photoURL,
    displayName,
    uid,
    email,
    handleDeletePermission,
    handleSetPermission,
  } = parameters
  const { t } = useTranslation('common')

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-x-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={photoURL} />
          <AvatarFallback>
            <CircleUser className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="max-w-48">
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
