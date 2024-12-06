export const extractPathSegment = (path: string) => {
  // Split the path into segments
  const segments = path.split('/').filter(Boolean)

  // Assuming the dynamic segment is always the first one, the desired part will be the second segment if it exists
  const desiredSegment = segments.length > 0 ? `/${segments[0]}` : '/'

  return desiredSegment
}

export const getRandomIndex = (arrayLength: number, currentIndex: number) => {
  let randomIndex = Math.floor(Math.random() * arrayLength)
  // Ensure the random index is not the same as the current one
  while (randomIndex === currentIndex) {
    randomIndex = Math.floor(Math.random() * arrayLength)
  }
  return randomIndex
}
