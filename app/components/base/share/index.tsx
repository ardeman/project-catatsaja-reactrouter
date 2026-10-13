import { zodResolver } from '@hookform/resolvers/zod'
import { CircleUser, Copy as CopyIcon, Trash, UserSearch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
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
import { useGetContacts } from '~/lib/hooks/use-get-contacts'
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
  const { write, read, invited, handleShare, handleUnshare, path } = properties
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
  const { handleSubmit, getValues, setValue, control } = formMethods
  const { data: contacts } = useGetContacts()
  const [copied, setCopied] = useState(false)
  const [removed, setRemoved] = useState<
    { uid: string; email: string; permission: 'read' | 'write' } | undefined
  >()
  // An encrypted item, and the person hasn't turned encryption on: asked in
  // the dialog (a modal dialog blocks toasts outside it).
  const [needsPlain, setNeedsPlain] = useState<
    { uid: string; email: string; permission: 'read' | 'write' } | undefined
  >()
  // Someone who can't be invited by this person (shown neutrally).
  const [refused, setRefused] = useState<string>()
  const currentLink = `${location.origin}${path}`

  const onSubmit = handleSubmit(async (data) => {
    setEmail(data.user)
  })

  // Everyone with access or an invitation: not offered again.
  const permissions = useMemo(
    () =>
      new Set([
        ...(read || []),
        ...(write || []),
        ...(invited?.read || []),
        ...(invited?.write || []),
      ]),
    [read, write, invited],
  )
  const invitedIds = new Set(invited?.read || [])
  const sharedWith = [...permissions].filter(
    (uid) => uid !== auth?.currentUser?.uid,
  )
  const { data: users } = useGetUsers(sharedWith)
  const usersById = new Map(users?.map((user) => [user.uid, user]))
  const availableUsers = searchResults?.filter(
    (user) => !permissions.has(user.uid),
  )
  const isFound = (availableUsers?.length ?? 0) > 0
  // What the search found for the email still in the field: nobody, or only
  // people who already have access or an invitation.
  const typed = (useWatch({ control, name: 'user' }) ?? '').trim().toLowerCase()
  const isSearchShown =
    !!email && !isSearching && !searchError && typed === email.toLowerCase()
  const isNotFound = isSearchShown && searchResults?.length === 0
  const isAlreadyIn = isSearchShown && !!searchResults?.length && !isFound
  // People the person already shares with, not on this item yet, matching
  // what is typed; hidden while a search runs or shows someone.
  const suggestions =
    isSearching || isFound
      ? []
      : contacts
          .filter(
            (user) =>
              !permissions.has(user.uid) &&
              (!typed ||
                user.email.toLowerCase().includes(typed) ||
                user.displayName?.toLowerCase().includes(typed)),
          )
          .slice(0, 5)
  // Choosing one is the same as typing their email and searching.
  const handleChooseContact = (contactEmail: string) => {
    setValue('user', contactEmail)
    setEmail(contactEmail)
  }

  const getPermission = (uid: string) => {
    if (write.includes(uid) || invited?.write.includes(uid)) return 'write'
    if (read.includes(uid) || invited?.read.includes(uid)) return 'read'
  }

  const handleDeletePermission = (parameters: THandleDeletePermission) => {
    const { email, uid } = parameters
    if (email === getValues().user) {
      setEmail('')
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

  const handleSetPermission = async (parameters: THandleSetPermission) => {
    const { permission, uid } = parameters
    setRemoved(undefined)
    setNeedsPlain(undefined)
    const email =
      searchResults?.find((user) => user.uid === uid)?.email ??
      usersById.get(uid)?.email ??
      ''
    setEmail('')
    setValue('user', '')
    setRefused(undefined)
    const result = await handleShare({ uid, permission })
    if (result === 'needsPlain' && permission !== 'delete')
      setNeedsPlain({ uid, email, permission })
    if (result === 'refused') setRefused(email)
  }

  const handleSharePlain = async () => {
    if (!needsPlain) return
    const { uid, permission } = needsPlain
    setNeedsPlain(undefined)
    await handleShare({ uid, permission, allowPlain: true })
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
          disabled={isSearching}
          rightNode={({ className }) => (
            <Button
              type="submit"
              disabled={isSearching}
              variant="ghost"
              size="icon"
              aria-label={t('form.user.find')}
              title={t('form.user.find')}
              className={className}
            >
              <UserSearch />
            </Button>
          )}
        />

        {refused && (
          <p
            role="alert"
            className="text-sm text-muted-foreground"
          >
            {t('form.user.refused', { email: refused })}
          </p>
        )}
        {(isNotFound || isAlreadyIn) && (
          <p
            role="status"
            className="text-sm text-muted-foreground"
          >
            {t(isNotFound ? 'form.user.notFound' : 'form.user.alreadyIn', {
              email,
            })}
          </p>
        )}
        {searchError && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {searchError}
          </p>
        )}
        {suggestions.length > 0 && (
          <div className="grid gap-1">
            <p className="text-xs text-muted-foreground">
              {t('form.user.recent')}
            </p>
            <ul className="grid gap-0.5">
              {suggestions.map((user) => (
                <li key={user.uid}>
                  <button
                    type="button"
                    onClick={() => handleChooseContact(user.email)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        <CircleUser className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid min-w-0">
                      <span className="truncate text-sm">
                        {user.displayName || user.email}
                      </span>
                      {user.displayName && (
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
              isInvited={invitedIds.has(uid)}
              photoURL={user.photoURL || ''}
              displayName={user.displayName || ''}
              email={user.email || ''}
              handleDeletePermission={handleDeletePermission}
              handleSetPermission={handleSetPermission}
            />
          )
        })}
        {needsPlain && (
          <div
            role="alert"
            className="grid gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
          >
            <p>{t('encryption.share.notSetUp', { email: needsPlain.email })}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-3"
                onClick={() => setNeedsPlain(undefined)}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3"
                onClick={() => void handleSharePlain()}
              >
                {t('encryption.share.withoutEncryption')}
              </Button>
            </div>
          </div>
        )}
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
    isInvited,
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
        {/* Gets access once they accept. */}
        {isInvited && (
          <p
            title={t('form.permissions.invitedHint')}
            className="truncate text-xs text-amber-700 dark:text-amber-400"
          >
            {t('form.permissions.invited')}
          </p>
        )}
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
