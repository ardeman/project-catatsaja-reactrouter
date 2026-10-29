import { firebase } from '~/lib/configs/app-check'
import { geminiModel } from '~/lib/constants/ai'
import { TTaskHelper, TTaskHelperResult } from '~/lib/types/task'
import { taskHelperSchema } from '~/lib/validations/task'

const PLAIN = `Items are plain text (no "- ", numbers or "[ ]"); never add facts that aren't in the list.`

const instructions: Record<TTaskHelper, string> = {
  breakDown: `Break down the open items of this task list, in its own language: split each item that is big or vague into 2 to 5 short, concrete steps, in order, and keep items that are already a single step as they are. items: the open items rewritten this way, in the same order (only the open ones). title: empty. ${PLAIN}`,
  suggest: `Suggest what is missing from this task list, in its own language: up to 5 short, concrete items that fit its title and items and aren't on it yet (done or not). items: the new items only. title: empty. ${PLAIN}`,
  translate: `Translate this task list: into English if it is mostly in Indonesian, otherwise into Indonesian (natural, informal "kamu" style). Leave names as they are; write amounts the way the target language does ("1,5jt" is "1.5 million" in English, "1.5 million" is "1,5 juta" in Indonesian). title: the translated title (empty if it has none). items: every item translated, one for one, in the same order. ${PLAIN}`,
  fromText: `Turn this pasted text into a task list, in its own language: the things to do in it as short, actionable items, one per task, in order, without duplicates; leave out greetings, notes about the list and anything that isn't a task. Remove list marks and checkboxes. If it has no clear tasks, use its main points. title: the list's title if the text starts with one (a heading or a first line naming the list), otherwise a short title for it. items: the items. ${PLAIN}`,
}

// Runs a task list helper with Gemini (Firebase AI Logic, behind App
// Check). The list is sent only when the person picks a helper, and for
// `fromText` only the pasted text; nothing is stored. Loaded on demand, so the AI SDK isn't in the app's main bundle.
export const runTaskHelper = async ({
  helper,
  title,
  content,
  text = '',
}: {
  helper: TTaskHelper
  title: string
  content: { checked: boolean; item: string }[]
  text?: string
}): Promise<TTaskHelperResult> => {
  if (!firebase) {
    throw new Error('Firebase is not initialized.')
  }
  const { getAI, getGenerativeModel, AgentPlatformBackend, Schema } =
    await import('firebase/ai')
  const responseSchema = Schema.object({
    properties: {
      title: Schema.string(),
      items: Schema.array({ items: Schema.string() }),
    },
  })
  const ai = getAI(firebase, { backend: new AgentPlatformBackend() })
  const model = getGenerativeModel(ai, {
    model: geminiModel,
    generationConfig: { responseMimeType: 'application/json', responseSchema },
  })
  // Translating keeps each item's place, so it gets them all; the others
  // say which are done.
  const list = content
    .map(({ checked, item }) => `${checked ? '[done]' : '[open]'} ${item}`)
    .join('\n')
  const result = await model.generateContent(
    helper === 'fromText'
      ? `${instructions[helper]}\n\nText:\n${text}`
      : `${instructions[helper]}\n\nTitle: ${title}\n\nItems:\n${list}`,
  )
  let parsed
  try {
    parsed = taskHelperSchema.safeParse(JSON.parse(result.response.text()))
  } catch {
    throw new Error('task/unreadable')
  }
  if (!parsed.success) throw new Error('task/unreadable')
  const answer = {
    title: parsed.data.title.trim(),
    items: parsed.data.items.map((item) => item.trim()).filter(Boolean),
  }
  // A translation must line up with the items, to keep what is done.
  const isUsable =
    helper === 'translate'
      ? answer.items.length === content.length
      : answer.items.length > 0
  if (!isUsable) throw new Error('task/unreadable')
  return answer
}
