import {
  ChevronDown,
  ChevronUp,
  CalendarPlus,
  Check,
  Circle,
  CircleUser,
  Copy,
  Download,
  EyeOff,
  Forward,
  Keyboard,
  Languages,
  ListChecks,
  ListCollapse,
  Lock,
  LockKeyhole,
  LucideIcon,
  Pin,
  Plus,
  Redo2,
  ScanText,
  Search,
  Settings,
  Sparkles,
  SpellCheck,
  Trash,
  Undo2,
} from 'lucide-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  FinancePreview,
  HealthPreview,
  NotePreview,
  TaskPreview,
} from '~/components/base/preview-card'
import { settings } from '~/components/layouts/sidebar'
import { navs } from '~/lib/constants/navigation'
import { cn } from '~/lib/utils/shadcn'

import { THelpSection } from './type'

// Static look-alikes of the parts of the app each section names, built from
// the same icons and labels, so they follow the theme and the language. Keep
// them in step with the components they copy (named next to each part).

type TControl = { icon: LucideIcon; label: string }

type TButton = { icon?: LucideIcon; label: string; primary?: boolean }

const Frame = ({ children }: { children: ReactNode }) => (
  <div
    aria-hidden
    className="flex flex-wrap items-start gap-4 rounded-xl border bg-muted/40 p-4"
  >
    {children}
  </div>
)

// A labelled button (`base/button`).
const MockButton = ({ icon: Icon, label, primary }: TButton) => (
  <span
    className={cn(
      'inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs',
      primary
        ? 'glass-surface glass-primary text-primary-foreground'
        : 'bg-background',
    )}
  >
    {Icon && <Icon className="size-4" />}
    {label}
  </span>
)

// What each icon does.
const Legend = ({ controls }: { controls: TControl[] }) => (
  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
    {controls.map(({ icon: Icon, label }) => (
      <li
        key={label}
        className="flex items-center gap-2"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        {label}
      </li>
    ))}
  </ul>
)

// The icon bar above an item (`base/action`), with what each icon does.
const IconBar = ({ controls }: { controls: TControl[] }) => (
  <div className="grid w-full gap-3">
    <div className="flex gap-1 rounded-full">
      {controls.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="flex h-7 flex-1 items-center justify-center rounded-full border bg-background text-muted-foreground"
        >
          <Icon className="size-4" />
        </span>
      ))}
    </div>
    <Legend controls={controls} />
  </div>
)

// A dropdown menu (the account menu, the Gemini menu).
const MockMenu = ({
  label,
  items,
}: {
  label?: ReactNode
  items: TControl[]
}) => (
  <div className="grid min-w-56 gap-0.5 rounded-md border bg-popover p-1 text-sm text-popover-foreground shadow-md">
    {label && (
      <span className="px-2 py-1.5 text-xs text-muted-foreground">{label}</span>
    )}
    {items.map(({ icon: Icon, label: itemLabel }) => (
      <span
        key={itemLabel}
        className="flex items-center gap-2 rounded-sm px-2 py-1.5"
      >
        <Icon className="size-4 text-muted-foreground" />
        {itemLabel}
      </span>
    ))}
  </div>
)

const StartFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      {/* `layouts/navbar/navigation` */}
      <div className="flex flex-wrap gap-1 rounded-full border bg-background p-1 text-sm">
        {navs(t).map(({ name, icon: Icon }, index) => (
          <span
            key={name}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1',
              index === 0 && 'bg-accent font-medium',
            )}
          >
            {Icon && <Icon className="size-4" />}
            {name}
          </span>
        ))}
      </div>
      <MockButton
        icon={Download}
        label={t('install.button')}
      />
      {/* `base/save-status` */}
      <span className="inline-flex h-9 items-center gap-1 text-xs text-muted-foreground">
        <Check className="size-3" />
        {t('form.status.saved')}
      </span>
    </Frame>
  )
}

const NotesFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      <MockButton
        primary
        label={t('notes.add')}
      />
      <IconBar
        controls={[
          { icon: Trash, label: t('actions.delete') },
          { icon: Forward, label: t('actions.share') },
          { icon: Undo2, label: t('actions.undo') },
          { icon: Redo2, label: t('actions.redo') },
          { icon: Sparkles, label: t('notes.ai.menu') },
          { icon: Pin, label: t('actions.pin') },
        ]}
      />
      <NotePreview />
    </Frame>
  )
}

const TasksFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      <MockButton
        primary
        label={t('tasks.add')}
      />
      <IconBar
        controls={[
          { icon: Trash, label: t('actions.delete') },
          { icon: Forward, label: t('actions.share') },
          { icon: ListChecks, label: t('actions.checkAll') },
          { icon: Undo2, label: t('actions.undo') },
          { icon: Redo2, label: t('actions.redo') },
          { icon: Pin, label: t('actions.pin') },
        ]}
      />
      {/* An item and the add-item field (`pages/task-detail/form`) */}
      <div className="grid w-full gap-2 text-sm sm:w-72">
        <span className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
          <Circle className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {t('landing.preview.task.items.2')}
          </span>
          <span className="flex gap-1 text-muted-foreground">
            <ChevronUp className="size-4" />
            <ChevronDown className="size-4" />
            <Trash className="size-4 text-destructive" />
          </span>
        </span>
        <span className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-muted-foreground">
          <Plus className="size-4" />
          {t('tasks.form.placeholder.label')}
        </span>
        <Legend
          controls={[
            { icon: ChevronUp, label: t('actions.moveUp') },
            { icon: ChevronDown, label: t('actions.moveDown') },
            { icon: Trash, label: t('actions.deleteItem') },
          ]}
        />
      </div>
      <TaskPreview />
    </Frame>
  )
}

const FinancesFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      <MockButton
        primary
        label={t('finances.add')}
      />
      <MockButton
        icon={Plus}
        label={t('finances.entry.add')}
      />
      <MockButton
        icon={ScanText}
        label={t('finances.receipt.scan')}
      />
      <MockButton
        icon={Keyboard}
        label={t('finances.quickAdd.title')}
      />
      <FinancePreview />
    </Frame>
  )
}

const HealthFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      <MockButton
        icon={Plus}
        label={t('health.form.add')}
      />
      <MockButton
        icon={Plus}
        label={t('health.reminders.add')}
      />
      <MockButton
        icon={CalendarPlus}
        label={t('health.reminders.calendar.add')}
      />
      <HealthPreview />
    </Frame>
  )
}

const SearchFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      {/* `layouts/navbar/search` */}
      <span className="flex h-10 w-full max-w-sm items-center gap-2 rounded-full border bg-background px-3.5 text-sm text-muted-foreground">
        <Search className="size-4" />
        <span className="flex-1">{t('navigation.search.placeholder')}</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.7rem]">
          Ctrl K
        </kbd>
      </span>
    </Frame>
  )
}

const SharingFigure = () => {
  const { t } = useTranslation()
  const email = t('help.sample.email')
  return (
    <Frame>
      {/* `base/share` */}
      <div className="grid w-full max-w-sm gap-2 rounded-md border bg-background p-3 text-sm">
        <span className="flex items-center gap-2 rounded-md border px-3 py-2 text-muted-foreground">
          <span className="flex-1 truncate">catatsaja.ardeman.com/notes/…</span>
          <Copy className="size-4" />
        </span>
        <span className="flex items-center gap-2 px-1 py-1">
          <CircleUser className="size-5 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{email}</span>
          <span className="rounded-md border px-2 py-1 text-xs">
            {t('form.permissions.readOnly')}
          </span>
        </span>
      </div>
      <IconBar
        controls={[
          { icon: Forward, label: t('actions.share') },
          { icon: EyeOff, label: t('actions.unlink') },
        ]}
      />
    </Frame>
  )
}

const EncryptionFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      {/* The account menu (`layouts/navbar`) */}
      <MockMenu
        label={t('navigation.userMenu')}
        items={[
          { icon: Settings, label: t('navigation.settings') },
          { icon: Lock, label: t('encryption.settings.lock') },
        ]}
      />
      <MockButton
        icon={LockKeyhole}
        label={t('encryption.settings.turnOn')}
      />
    </Frame>
  )
}

const GeminiFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      {/* `pages/note-detail/ai-helpers` */}
      <MockMenu
        label={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" />
            {t('notes.ai.menu')}
          </span>
        }
        items={[
          { icon: ListCollapse, label: t('notes.ai.summarise.action') },
          { icon: SpellCheck, label: t('notes.ai.tidy.action') },
          { icon: Languages, label: t('notes.ai.translate.action') },
          { icon: ListChecks, label: t('notes.ai.checklist.action') },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <MockButton
          icon={ScanText}
          label={t('finances.receipt.scan')}
        />
        <MockButton
          icon={Keyboard}
          label={t('finances.quickAdd.title')}
        />
      </div>
    </Frame>
  )
}

const SettingsFigure = () => {
  const { t } = useTranslation()
  return (
    <Frame>
      {/* `layouts/sidebar` */}
      <MockMenu
        label={t('navigation.settings')}
        items={settings(t).map(({ icon, name }) => ({ icon, label: name }))}
      />
    </Frame>
  )
}

export const figures: Record<THelpSection, () => ReactNode> = {
  start: StartFigure,
  notes: NotesFigure,
  tasks: TasksFigure,
  finances: FinancesFigure,
  health: HealthFigure,
  search: SearchFigure,
  sharing: SharingFigure,
  encryption: EncryptionFigure,
  gemini: GeminiFigure,
  settings: SettingsFigure,
}
