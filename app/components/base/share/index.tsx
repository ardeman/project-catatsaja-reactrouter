import { zodResolver } from '@hookform/resolvers/zod'
import { BookUser, CircleUser, Trash, Copy as CopyIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Input as UIInput } from '~/components/ui/input'
import { auth } from '~/lib/configs/firebase'
import { useGetUsers } from '~/lib/hooks/use-get-users'
import { useSearchUsers } from '~/lib/hooks/use-search-users'
import { toast } from '~/lib/hooks/use-toast'
import {
  THandleDeletePermission,
  THandleSetPermission,
  TParametersPermission,
  TPermissions,
  TShareForm,
} from '~/lib/types/common'
import { shareSchema } from '~/lib/validations/common'

export const Share = (properties: TPermissions) => {
  const { write, read, handleShare, handleUnshare, path } = properties
  const [disabled, setDisabled] = useState(false)
  const [email, setEmail] = useState('')
  const { t } = useTranslation(['common', 'zod'])
  const {
    data: searchResults,
    error: searchError,
    isLoading: isSearching,
  } = useSearchUsers(email)
  const formMethods = useForm<TShareForm>({
    resolver: zodResolver(shareSchema(t)),
    defaultValues: { user: '' },
  })
  const { handleSubmit, getValues, setValue } = formMethods
  const [copied, setCopied] = useState(false)
  const [removed, setRemoved] = useState<
    { uid: string; email: string; permission: 'read' | 'write' } | undefined
  >()
  const currentLink = `${globalThis.location.origin}${path}`

  const onSubmit = handleSubmit(async (data) => {
    setEmail(data.user)
    setDisabled(true)
  })

  const permissions = useMemo(
    () => new Set([...(read || []), ...(write || [])]),
    [read, write],
  )
  const sharedWith = [...permissions].filter(
    (uid) => uid !== auth?.currentUser?.uid,
  )
  const { data: users } = useGetUsers(sharedWith)
  const usersById = new Map(users?.map((user) => [user.uid, user]))
  const availableUsers = searchResults?.filter(
    (user) => !permissions.has(user.uid),
  )
  const getPermission = (uid: string) =>
    write.includes(uid) ? 'write' : read.includes(uid) ? 'read' : undefined

  useEffect(() => {
    if (!searchResults?.some((user) => !permissions.has(user.uid))) {
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
    const previous = getPermission(uid)
    handleUnshare({ uid })
    // Shown inside the dialog: a modal dialog blocks toasts outside it.
    setRemoved(previous ? { uid, email, permission: previous } : undefined)
  }

  const handleUndoRemove = () => {
    if (!removed) return
    handleShare({ uid: removed.uid, permission: removed.permission })
    setRemoved(undefined)
  }

  const handleSetPermission = (parameters: THandleSetPermission) => {
    const { permission, uid } = parameters
    setRemoved(undefined)
    handleShare({ uid, permission })
    setEmail('')
    setDisabled(false)
    setValue('user', '')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast({ description: t('form.linkCopied') })
    } catch {
      toast({ variant: 'destructive', description: t('errors.unknown') })
    }
  }

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={onSubmit}
        className="group/form is-shown min-w-0 space-y-4"
      >
        {/* Current Link and Copy Button */}
        <div className="relative flex items-center gap-2">
          <UIInput
            type="text"
            name="currentLink"
            defaultValue={currentLink}
            readOnly
            className="flex-1 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopyLink}
            size="icon"
            aria-label={t('form.copyLink')}
            title={t('form.copyLink')}
            className="absolute right-1 size-8"
          >
            {copied ? <CopyIcon className="text-primary" /> : <CopyIcon />}
          </Button>
        </div>
        {/* End Current Link and Copy Button */}
        <Input
          type="search"
          name="user"
          placeholder={t('form.user.placeholder')}
          required
          disabled={disabled || isSearching}
          rightNode={({ className }) => (
            <Button
              type="submit"
              disabled={disabled || isSearching}
              variant="ghost"
              size="icon"
              className={className}
            >
              <BookUser />
            </Button>
          )}
        />

        {searchError && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {searchError}
          </p>
        )}
        {availableUsers?.map(({ uid, photoURL, displayName, email }) => (
          <Permission
            key={uid}
            photoURL={photoURL}
            displayName={displayName}
            uid={uid}
            email={email}
            handleDeletePermission={handleDeletePermission}
            handleSetPermission={handleSetPermission}
          />
        ))}

        {sharedWith.map((uid) => {
          const user = usersById.get(uid)
          if (!user) return null
          return (
            <Permission
              key={uid}
              uid={uid}
              permission={getPermission(uid)}
              photoURL={user.photoURL || ''}
              displayName={user.displayName || ''}
              email={user.email || ''}
              handleDeletePermission={handleDeletePermission}
              handleSetPermission={handleSetPermission}
            />
          )
        })}
        {removed && (
          <div
            role="status"
            className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              {t('form.permissions.removed', { email: removed.email })}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2"
              onClick={handleUndoRemove}
            >
              {t('form.undo')}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )
}

const Permission = (parameters: TParametersPermission) => {
  const {
    permission = '',
    photoURL,
    displayName,
    uid,
    email,
    handleDeletePermission,
    handleSetPermission,
  } = parameters
  const { t } = useTranslation('common')

  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <div className="flex items-center gap-x-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={photoURL} />
          <AvatarFallback>
            <CircleUser className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex min-w-16 flex-1 flex-col justify-center">
        <p className="truncate">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="flex min-w-0 items-center gap-x-2">
        <Select
          onValueChange={(newValue: THandleSetPermission['permission']) =>
            handleSetPermission({ permission: newValue, uid })
          }
          value={permission}
        >
          <SelectTrigger className="w-fit min-w-16 gap-2 [&>span]:truncate">
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
          aria-label={t('form.permissions.remove', { email })}
          title={t('form.permissions.remove', { email })}
          onClick={() => handleDeletePermission({ uid, email })}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
