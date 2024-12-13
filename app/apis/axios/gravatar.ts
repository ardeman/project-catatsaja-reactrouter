export const test = async () => {
  const data = await fetch('https://api.gravatar.com/v3/profiles', {
    headers: {
      authorization: `Bearer ${import.meta.env.VITE_GRAVATAR_API_KEY as string}`,
    },
  })
  return { data }
}
