import { getDocFromTraversal } from '../data/firestore'

export const createPace = async(data) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  const paceUrl = `${BASE_URL}/api/pace`
  try {
    const response = await fetch(paceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    console.log('createPace', result)
    return result.id
  } catch (error) {
    console.log(error)
  }
}

export const updatePace = async(paceId, data) => {
  try {
    const response = await fetch(`/api/pace/${paceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    console.log('updatePace', result)
  } catch (error) {
    console.log(error)
  }    
}


export const getNextBootstrap = (bootstrap, pace) => {
  let nextBootstrap = bootstrap.flow[pace.bootstrap].next
  const nextBootstrapType = typeof bootstrap.flow[pace.bootstrap].next
  // console.log('TYPE', nextBootstrapType)
  switch (nextBootstrapType) {
    case "string":
      break
    default:
      // if "object", get internal value based on instruction
      if (pace.instruction) {
        nextBootstrap = nextBootstrap[pace.instruction]
      } else {
        nextBootstrap = 'unset'
      }
      break
  }
  // console.log('next station is', nextBootstrap)
  return nextBootstrap
}


export const createPaceTaken = async(data) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  const paceTakenUrl = `${BASE_URL}/api/paceTaken`
  try {
    const response = await fetch(paceTakenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    console.log('createPaceTaken', result)
    return result.id
  } catch (error) {
    console.log(error)
  } 
}

export const updatePaceTaken = async(paceTakenId, data) => {
  try {
    const response = await fetch(`/api/paceTaken/${paceTakenId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    console.log('updatePaceTaken', result)
  } catch (error) {
    console.log(error)
  } 
}

export const createPaceTakenAfter = async(paceTaken, pathTakenBootstrap, seoTail) => {
  const newOrder = paceTaken['order:taken'] + 1
  const newBootstrapTaken = getNextBootstrapTaken(pathTakenBootstrap.actionables, paceTaken)
  const newOriginPace = await getNextReferencePace(pathTakenBootstrap.actionables, newBootstrapTaken, paceTaken.originPace)
  console.log('newOriginPace', newOriginPace)
  // if it's the same pace (we've reached the end of the path that's built)
  if (newOriginPace.id === paceTaken.originPace) return null

  const newPaceTakenId = await createPaceTaken({
    "bootstrap": newBootstrapTaken,
    "order:taken": newOrder,
    "originPace": newOriginPace.id,
    "originPath": paceTaken.originPath,
    "path:taken": paceTaken['path:taken'],
    "prev:pace:taken": paceTaken.id,
    "response": ""
  })
  console.log('newPaceTakenId', newPaceTakenId)
  return `/path/${paceTaken['path:taken']}.${newPaceTakenId}/${seoTail}`
}

/**
 * From the reference pace, traverse next:pace until bootstrap indicates it's actionable
 * @returns the next actionable pace
 * @param {array} actionables 
 * @param {object} referencePace 
 */
const getNextReferencePace = async (actionables, nextBootstrapTaken, referencePaceId) => {
  console.log('referencePace', typeof referencePaceId, referencePaceId)
  const theDoc = await getDocFromTraversal('paces', referencePaceId, actionables,
    {
      'nextKey': 'next:pace',
      'fieldPath': 'bootstrap',
      'operator': '==',
      'value': nextBootstrapTaken
    })
  return theDoc
}

const getNextBootstrapTaken = (actionables, paceTaken) => {
  return getNextArrayValue(actionables, paceTaken.bootstrap)
}

/**
 * Get the next item's value given a reference value, 
 * will wrap around 
 * e.g. getNextArrayValue(['a','b','c'], 'c') => 'a'
 * @param {array} array the array
 * @param {string} value the reference value
 */
const getNextArrayValue = (array, value) => {
  value = value.toString()
  const index = array.indexOf(value)
  // if there's 0-1 elements, return value as-is
  if (array.length <= 1) return value
  // if the index is < 0, return value as-is
  if (index < 0) return value
  // else return the next array element, rotate if at the end
  if (index >= 0) return array[((index + 1) % array.length)]
  // everything else return 
  return value
}
