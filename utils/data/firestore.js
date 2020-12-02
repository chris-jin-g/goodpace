import { firebase } from "./database"

/**
 * 
 * @param {*} data 
 * @param {*} attribute 
 * @param {*} collection 
 * @param {*} fields 
 * e.g.
 * data.end = await populateChild(data, 'end', 'paces',
      ['id', 'order', 'bootstrap', 'instruction', 'prev:pace']) || null 
 */
export const populateChild = async (data, attribute, collection, fields=[]) => {
  // console.log('populateChild', data, data[attribute], collection, fields)
  if (data[attribute]) {
    if (fields.length > 0) {
      return await populateChildData(data[attribute], collection, fields)
    } else {
      return await populateChildData(data[attribute], collection)
    }
  } else {
    return null
  }
}

/**
 * 
 * @param {*} id 
 * @param {*} collection 
 * @param {*} fields -- default to [], which means return all fields
 */
export const populateChildData = async (id, collection, fields=[]) => {
  let refget = await firebase.firestore().doc(`/${collection}/${id}`).get()
  let data = refget.data()
  
  // console.log('populateChildData data', data, id, fields)

  if (fields.length > 0) {
    let obj = {}
    // for each field listed,
    fields.forEach((field) => {
      // console.log('field', field)

      if (field === 'id') {
        // if it's id, take from reference
        obj.id = id
      } else {
        // extract the field from data, if exist
        if (data[field]) {
          obj[field] = data[field]
        }
      }
    })
    // console.log('obj', obj)
    return obj
  } else {
    // if fields are not specified, 
    // return any data fields we get
    // (some fields may be `null`)
    return {
      id,
      ...data
    }
  }
}

/**
 * 
 * @param {*} collection -- firestore collection
 * @param {*} whereClauses -- see examples below
 * @param {*} order -- see examples below
 * 
 * whereClauses = [
 *  {
 *    fieldPath: 'path',
 *    operator: '==',
 *    value: 'wqJyPkSQbRMAZhQNWixd'
 *  }
 * ]
 * orderClauses = [
 *  {
 *    fieldPath: 'createdAt',
 *    direction: 'asc'
 *  }
 * ] 
 */
export const getWithFilter = async (collection, whereClauses=[], orderClauses=[], limit=null) => {
  try {
    let collectionQuery = firebase.firestore().collection(collection)
    
    whereClauses.forEach( clause => {
      collectionQuery = collectionQuery.where(clause.fieldPath, clause.operator, clause.value)
    })
    
    orderClauses.forEach( clause => {
      collectionQuery = collectionQuery.orderBy(clause.fieldPath, clause.direction)
    })
    
    if (limit) collectionQuery = collectionQuery.limit(limit)

    const results = await collectionQuery.get().catch(console.log)
    
    return results.docs.map(doc => {
      const data = doc.data() 
      return Object.assign({id: doc.id}, data)
    })

  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 * 
 * @param {string} collection 
 * @param {string} docStr 
 */
export const getDoc = async (collection, docStr) => {
  try {
    const doc = await firebase.firestore().collection(collection).doc(docStr).get().catch(console.log)
    const data = doc.data()
    return Object.assign({id: doc.id}, data)
  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 * Based on a collection, a reference document string, 
 * traverse on next pointer provided until we find a 
 * document with a criterion. Return the first doc that meets this criterion.
 * @returns {object} a document object
 * @param {string} collection collection to search
 * @param {string} refDocId reference doc id
 * @param {array} actionables array of numbers (indexes) that are used for comparison
 * @param {object} criterion criterion to return the next
 * suitable candidate document
 * e.g. 
 */
export const getDocFromTraversal = async (collection, refDocId, actionables, criterion) => {
  try {
    const refDoc = await getDoc(collection, refDocId)
    // if there's no next doc found, return itself (refDoc)
    const nextKey = criterion.nextKey
    
    if (!refDoc[nextKey]) return refDoc
    
    // while there's still next doc to be found
    let nextDocId = refDoc[nextKey]
    let theDoc
    
    // while there's next doc and we haven't exceeded the number of actionables...?
    // for now we're hardcoding to max 10 before exiting and returning original pace
    const _MAX_LEVELS = 10
    let i = 0
    while (nextDocId && i < _MAX_LEVELS) {
      // get the doc based on nextDocId
      theDoc = await getDoc(collection, nextDocId)
      // console.log('theDoc', theDoc)
      // console.log('criterion', theDoc[criterion.fieldPath], criterion.value)
      // if criterion is met
      switch(criterion.operator) {
        case "==":
        default:
          // e.g. if doc.bootstrap == "2"
          if (theDoc[criterion.fieldPath] == criterion.value) {
            return theDoc
          }
      }

      // get next document e.g. theDoc['next:pace']
      // if undefined, it will break out of the loop
      nextDocId = theDoc[nextKey]
      i++
    }

    // in case the entire while loop occurs without finding criterion value
    return refDoc

  } catch (error) {
    console.log(error)
    return null
  }
}


/**
 * OLD DEFINITIONS -- uses firebase references
 export const populateChild = async (data, attribute, fields=[]) => {
  if (data[attribute]) {
    if (fields.length > 0) {
      return await populateChildData(data[attribute], fields)
    } else {
      return await populateChildData(data[attribute])
    }
  } else {
    return null
  }
}

export const populateChildData = async (ref, fields=[]) => {
  let refget = await ref.get()
  let data = await refget.data()
  
  // console.log('data', data, ref.id)

  if (fields.length > 0) {
    let obj = {}
    // for each field listed,
    fields.forEach((field) => {
      // console.log('field', field)

      if (field === 'id') {
        // if it's id, take from reference
        obj.id = ref.id
      } else {
        // extract the field from data
        obj[field] = data[field]
      }
    })
    return obj
  } else {
    // if fields are not specified, 
    // return any data fields we get
    // (some fields may be `null`)
    return {...data}
  }
}
 */
