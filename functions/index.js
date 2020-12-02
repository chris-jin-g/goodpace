// TODO: firebase security rules
// https://www.youtube.com/watch?v=VDulvfBpzZE
// https://www.youtube.com/watch?v=8Mzb9zmnbJs

const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()


const hri = require('human-readable-ids').hri

let FIREBASE_PUBLIC_DEPLOY_URL
if (admin.instanceId().app.options.projectId.includes('goodpace')) {
  FIREBASE_PUBLIC_DEPLOY_URL = 'https://goodpace-ai.web.app'
} else {
  FIREBASE_PUBLIC_DEPLOY_URL = 'https://justpreppin.web.app'
}


const INCREMENT = admin.firestore.FieldValue.increment(1)
const DECREMENT = admin.firestore.FieldValue.increment(-1)


exports.feedbackCreatedAt = functions.firestore.document('/_feedback/{documentId}')
  .onCreate((snap) => {
    const now = new Date()
    return snap.ref.set({ createdAt: now.toISOString() }, { merge: true })
  })

/** 
 * Create User object in firestore with new Firebase Authenticated user
 * - readable friendly random username
 * - random from 10 avatars
 * - email
 * - createdAt
 */ 
exports.createUser = functions.auth.user()
  .onCreate((user) => {  
    const uid = user.uid
    const email = user.email // The email of the user.
    const displayName = user.displayName ? user.displayName : hri.random() // The display name of the user.
    
    functions.logger.info("[logger says] user created", {structuredData: true});
    console.log('user created', uid, email, displayName)
    
    const now = new Date()

    admin.firestore().collection('users').doc(uid).set({
      id: user.uid,
      displayName: displayName,
      email: user.email,
      avatarSource: _getRandomAvatarURL(),
      createdAt: now.toISOString() 
    })
})

const _random = (min, max) => {  
  return Math.random() * (max - min) + min
}

const _getRandomAvatarURL = () => {
  const availableAvatarNames = ['123', '234', '345', '456', '567', '678', '789', '890']
  const fileName = availableAvatarNames[Math.floor(_random(1, availableAvatarNames.length)) - 1]
  let url = `${FIREBASE_PUBLIC_DEPLOY_URL}/assets/${fileName}.svg`
  return url
}


// scheduled function to clean up anonymous users who have been created 7 days ago
// https://firebase.google.com/docs/functions/schedule-functions#write_a_scheduled_function
// https://crontab.guru/#0_0_*_*_SUN
exports.scheduledFunctionCrontab = functions.pubsub.schedule('0 0 * * SUN')
  .timeZone('America/New_York') // Users can choose timezone - default is America/Los_Angeles
  .onRun((context) => {
  console.log('This will be run every Sunday at 00:00 AM Eastern!')
  return null
});


// onCreate
exports.domainCreatedAt = functions.firestore.document('/domains/{documentId}')
  .onCreate((snap, context) => {
    const now = new Date()
    return snap.ref.set({ createdAt: now.toISOString() }, { merge: true })
  })




exports.goalCreatedAt = functions.firestore.document('/goals/{documentId}')
  .onCreate((snap) => {
    const now = new Date()
    return snap.ref.set({ createdAt: now.toISOString() }, { merge: true })
  })

/**
 * 
 * @param {string} docRefStr the document path of the node to update
 * @param {JSON Object} data the data to update with
 */
const updateNode = async (collection, docStr, data) => {
  try {
    const docPath = `/${collection}/${docStr}` 
    return await admin.firestore().doc(docPath).set(data, {merge: true})
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * Path creation (when inserting 2 .. N-th node)
 * When creating/updating a pace with "prev:pace" field non-empty,
 * - go to prev:pace and set its "next:pace" to myself
 * - go to next:pace and set its "prev:pace" to myself
 * // REF: https://fireship.io/snippets/firestore-increment-tips/
 * - increment the path's "next:order" field as new order + 1
 * - recursively update order in (k+1)th pace to n
 *    createdAt
 *    updatedAt
 */

exports.paceCreatedAt = functions.firestore.document('/paces/{documentId}')
  .onCreate(async(snap) => {
    try {
      // setting `createdAt`
      const now = new Date()
      snap.ref.set({ createdAt: now.toISOString() }, { merge: true })

      const thisDoc = await snap.ref.get()
      
      const path = thisDoc.get('path')
      const previous = thisDoc.get('prev:pace')
      const next = thisDoc.get('next:pace')

      if (path) {
        // In case there is no next pace, 
        // - update next:order in path
        // - set this pace as path's end
        await admin.firestore().doc(`/paths/${path}`)
          .set({
            'next:order': INCREMENT,
            'end': snap.id
          }, { merge: true })
      }
      
      if (previous) {
        await admin.firestore().doc(`/paces/${previous}`)
          .set({
            'next:pace': snap.id,
            'updatedAt': now.toISOString()
          }, { merge: true })
      }

      let paceRef
      if (next) {
        paceRef = admin.firestore().doc(`/paces/${next}`)
        await paceRef.set({
            'prev:pace': snap.id,
            'order': INCREMENT,
            'updatedAt': now.toISOString()
          }, { merge: true })

        // recursively update order in (k+1)th pace to n 
        // while there's still a next pace,
        // go to next pace and increment order by 1
        let refget = await paceRef.get()
        let data = refget.data()
        let nextPaceId

        while (data['next:pace']) {
          nextPaceId = data['next:pace']
          
          // eslint-disable-next-line no-await-in-loop
          paceRef = admin.firestore().doc(`/paces/${nextPaceId}`)
          // eslint-disable-next-line no-await-in-loop
          await paceRef.set({
              'order': INCREMENT,
              'updatedAt': now.toISOString()
            }, { merge: true })
          // eslint-disable-next-line no-await-in-loop
          refget = await paceRef.get()
          data = refget.data()
        } 

        // set last defined nextPaceId as path's end
        await admin.firestore().doc(`/paths/${path}`)
          .set({
            'end': refget.id
          }, { merge: true })
      }

    } catch (error) {
      console.error(error)
      throw error
    }
    
  })


exports.paceChanged = functions.firestore.document('/paces/{documentId}')
  .onUpdate(async (snap) => {
    try {
      const now = new Date()
      const thisDocData = snap.after.data()
      
      const next = thisDocData['next:pace']
      const thisDocBootstrap = thisDocData['bootstrap']
      const thisDocInstruction = thisDocData['instruction']
      
      if (thisDocBootstrap === '3') {
        // if data comes with bootstrap 3, instruction 'y'
        if (thisDocInstruction === 'y') {
          // seek next:pace, change that bootstrap to 1-next, with timestamp
          if (next) {
            paceRef = await admin.firestore().doc(`/paces/${next}`)
            await paceRef.set({
                'bootstrap': '1-next',
                'updatedAt': now.toISOString()
              }, { merge: true })
          }
        } 
        // if data comes with bootstrap 3, instruction 'n'
        else if (thisDocInstruction === 'n') {
          // seek next:pace, change that bootstrap to 1-sub, with timestamp
          if (next) {
            paceRef = await admin.firestore().doc(`/paces/${next}`)
            await paceRef.set({
                'bootstrap': '1-sub',
                'updatedAt': now.toISOString()
              }, { merge: true })
          }
        }
      }

      // update timestamp
      const beforeData = snap.before.data()
      if (beforeData.instruction !== thisDocData.instruction) {
        return snap.after.ref.set({ 'updatedAt': now.toISOString() }, { merge: true })
      } else {
        return false
      }
      
    } catch (error) {
      console.error(error)
      throw error
    }
  })

/**
  Path correction (when deleting 2 .. N-th node)				
    When deleting a pace with "prev:pace" field non-empty,
      - go to prev:pace and set "next:pace" to deletedValue's next:pace
      - go to next:pace and set "prev:pace" to deletedValue's prev:pace
      - decrement that path's "next:order" field as new order - 1
      - recursively update order in (k+1)th pace to n
      createdAt
      updatedAt
*/
exports.paceDeletedAt = functions.firestore.document('/paces/{documentId}')
  .onDelete(async(snap) => {
    try {
      const now = new Date()
      
      const thisDocData = snap.data()
      
      const prev = thisDocData['prev:pace']
      const next = thisDocData['next:pace']
      const path = thisDocData['path']

      if (path) {
        // In case there is no next pace, 
        // - update next:order in path
        // - set this pace's prev as path's end
        await admin.firestore().doc(`/paths/${path}`)
          .set({
            'next:order': DECREMENT,
            'end': prev
          }, { merge: true })
      }
      
      if (prev) {
        const nextValue = (next) ? next : admin.firestore.FieldValue.delete()
        await admin.firestore().doc(`/paces/${prev}`)
          .set({
            'next:pace': nextValue,
            'updatedAt': now.toISOString() 
          }, { merge: true })
      }
  
      let paceRef
      if (next) {
        paceRef = admin.firestore().doc(`/paces/${next}`)
        await paceRef.set({
            'prev:pace': prev,
            'order': DECREMENT,
            'updatedAt': now.toISOString()
          }, { merge: true })
  
        // recursively update order in (k+1)th pace to n 
        // while there's still a next pace,
        // go to next pace and decrement order by 1
        let refget = await paceRef.get()
        let data = refget.data()
        let nextPaceId
        
        while (data['next:pace']) {
          nextPaceId = data['next:pace']

          paceRef = admin.firestore().doc(`/paces/${nextPaceId}`)
          // eslint-disable-next-line no-await-in-loop
          await paceRef.set({
            'order': DECREMENT,
            'updatedAt': now.toISOString()
          }, { merge: true })
          // eslint-disable-next-line no-await-in-loop
          refget = await paceRef.get()
          data = refget.data()
        }

        // in case there's no more next pace,
        // set this pace as path's end
        if (path) {
          await admin.firestore().doc(`/paths/${path}`)
            .set({
              'end': refget.id
            }, { merge: true })
        }        
      }

    } catch (error) {
      console.error(error)
      throw error
    }

  })


/**          
  Path taking			
    Functions	When creating a pace:taken with "prev:pace:taken" field non-empty,
      - ensure its ID is in that pace's "next:pace:taken" field
      createdAt
      updatedAt
 */
exports.paceTakenCreatedAt = functions.firestore.document('/paces:taken/{documentId}')
  .onCreate(async(snap) => {
    try {
      const now = new Date()
      snap.ref.set({ createdAt: now.toISOString() }, { merge: true })

      const thisDoc = await snap.ref.get()

      const pathTaken = thisDoc.get('path:taken')
      const previousTaken = thisDoc.get('prev:pace:taken')
      const nextTaken = thisDoc.get('next:pace:taken')
      
      if (pathTaken) {
        // await updateNode('paths:taken', pathTaken, {
        //   'next:order:taken': INCREMENT
        // })
        await admin.firestore().doc(`/paths:taken/${pathTaken}`)
          .set({
            'next:order:taken': INCREMENT,
            'end': snap.id
          }, { merge: true })
      }
      
      if (previousTaken) {
        // await updateNode('paces:taken', previousTaken, {
        //   'next:pace:taken': snap.id,
        //   'updatedAt': now.toISOString()
        // })
        await admin.firestore().doc(`/paces:taken/${previousTaken}`)
          .set({
            'next:pace:taken': snap.id,
            'updatedAt': now.toISOString()
          }, { merge: true })
      }

      let paceRef
      if (nextTaken) {
        paceRef = admin.firestore().doc(`/paces:taken/${nextTaken}`)
        await paceRef.set({
          'prev:pace:taken': snap.id,
          'order:taken': INCREMENT,
          'updatedAt': now.toISOString()
        }, { merge: true })

        let refget = await paceRef.get()
        let data = refget.data()
        let nextPaceTakenId

        while (data['next:pace:taken']) {
          nextPaceTakenId = data['next:pace:taken']

          // eslint-disable-next-line no-await-in-loop
          paceRef = admin.firestore().doc(`/paces:taken/${nextPaceTakenId}`)
          // eslint-disable-next-line no-await-in-loop
          await paceRef.set({
            'order:taken': INCREMENT,
            'updatedAt': now.toISOString()
          }, { merge: true })
          // eslint-disable-next-line no-await-in-loop
          refget = await paceRef.get()
          data = refget.data()
        }
      } 

      await admin.firestore().doc(`/paths:taken/${pathTaken}`)
        .set({
          'end': refget.id
        }, { merge: true })

    } catch (error) {
      console.error(error)
      throw error
    }
        
  })

exports.paceTakenChanged = functions.firestore.document('/paces:taken/{documentId}')
  .onUpdate(async (snap) => {
    try {
      const now = new Date()
      const afterData = snap.after.data()
      const beforeData = snap.before.data()
      
      if (beforeData.response !== afterData.response) {
        return snap.after.ref.set({ 'updatedAt': now.toISOString() }, { merge: true })
      } else {
        return false
      }
      
      // const thisDocData = snap.after.data()
      
      // const next = thisDocData['next:pace']
      // const thisDocBootstrap = thisDocData['bootstrap']
      // const thisDocInstruction = thisDocData['instruction']
      
      // if (thisDocBootstrap === '3') {
      //   // if data comes with bootstrap 3, instruction 'y'
      //   if (thisDocInstruction === 'y') {
      //     // seek next:pace, change that bootstrap to 1-next, with timestamp
      //     if (next) {
      //       paceRef = await admin.firestore().doc(`/paces/${next}`)
      //       await paceRef.set({
      //           'bootstrap': '1-next',
      //           'updatedAt': now.toISOString()
      //         }, { merge: true })
      //     }
      //   } 
      //   // if data comes with bootstrap 3, instruction 'n'
      //   else if (thisDocInstruction === 'n') {
      //     // seek next:pace, change that bootstrap to 1-sub, with timestamp
      //     if (next) {
      //       paceRef = await admin.firestore().doc(`/paces/${next}`)
      //       await paceRef.set({
      //           'bootstrap': '1-sub',
      //           'updatedAt': now.toISOString()
      //         }, { merge: true })
      //     }
      //   }
      // } 
      
    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.paceTakenDeletedAt = functions.firestore.document('/paces:taken/{documentId}')
  .onDelete(async(snap) => {
    try {
      const now = new Date()

      const thisDocData = snap.data()

      const prev = thisDocData['prev:pace:taken']
      const next = thisDocData['next:pace:taken']
      const pathTaken = thisDocData['path:taken']

      if (path) {
        await admin.firestore().doc(`/paths:taken/${pathTaken}`)
          .set({
            'next:order:taken': DECREMENT,
            'end': prev
          }, { merge: true })
      }

      if (prev) {
        const nextValue = (next) ? next : admin.firestore.FieldValue.delete()
        await admin.firestore().doc(`/paces:taken/${prev}`)
          .set({
            'next:pace:taken': nextValue,
            'updatedAt': now.toString()
          }, { merge: true })
      }

      let paceRef
      if (next) {
        paceRef = admin.firestore().doc(`/paces:taken/${next}`, {
          'prev:pace:taken': prevRef,
          'order:taken': DECREMENT,
          'updatedAt': now.toISOString()
        }, { merge: true})

        let refget = await paceRef.get()
        let data = refget.data()
        let nextPaceTakenId

        while (data['next:pace:taken']) {
          nextPaceTakenId = data['next:pace:taken']

          paceRef = admin.firestore().doc(`/paces:taken/${nextPaceTakenId}`)
          // eslint-disable-next-line no-await-in-loop
          await paceRef.set({
            'order:taken': DECREMENT,
            'updatedAt': now.toISOString()
          }, { merge: true })
          // eslint-disable-next-line no-await-in-loop
          refget = await paceRef.get()
          data = refget.data()
        }

        if (pathTaken) {
          await admin.firestore().doc(`/paths:taken/${pathTaken}`)
            .set({
              'end': refget.id
            }, { merge: true })
        }
      }

    } catch (error) {
      console.error(error)
      throw error
    }
    
  })


exports.pathCreatedAt = functions.firestore.document('/paths/{documentId}')
  .onCreate(async(snap) => {
    try {
      // setting `createdAt` in newly created path
      const now = new Date()
      
      // create first pace
      const pace = await admin.firestore().collection('/paces')
        .add({
          'bootstrap': '1',
          'instruction': '',
          'order': 1,
          'path': snap.id
        })
        .catch((error) => {
          console.log(error)
          res.status(500).json({ message: 'sumting wong', error: error })
        })
      
      // set first pace id as start and end of this path
      return snap.ref.set({ 
        'start': pace.id,
        'end': pace.id,
        'createdAt': now.toISOString()
      }, { merge: true })

    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.pathTakenCreatedAt = functions.firestore.document('/paths:taken/{documentId}')
 .onCreate(async(snap) => {
    try {
      // setting `createdAt` in newly created path
      const now = new Date()

      const thisDoc = await snap.ref.get()
      const originPath = thisDoc.get('path')

      // fetch the first actionable pace index from bootstrap rules we're using
      const bootstrap = await getDoc('bootstrap', thisDoc.get('bootstrap'))
      const firstActionableIndex = bootstrap.actionables[0]

      // take the first actionable pace 
      // (where path=pathTaken.path, bootstrap== first actionable pace, order by createdAt, limit 1)
      const paceQuery = await getWithFilter('paces', 
        [
          {fieldPath: 'path', operator: '==', value: originPath},
          {fieldPath: 'bootstrap', operator: '==', value: firstActionableIndex},
        ],
        [
          {fieldPath: 'createdAt', direction: 'asc'}
        ], 1)
      const pace = await paceQuery[0]
      
      // create first pace:taken
      const paceTaken = await admin.firestore().collection('paces:taken')
        .add({
          'bootstrap': firstActionableIndex, 
          'response': '',
          'order:taken': 1,
          'originPace': pace.id,
          'originPath': originPath,
          'path:taken': snap.id
        })
        .catch((error) => {
          console.log(error)
          return res.status(500).json({ message: 'sumting wong', error: error })
        })
      
      // set first pace id as start and end of this path:taken
      return snap.ref.set({ 
        'start': paceTaken.id,
        'end': paceTaken.id,
        // 'test': {
        //   'originPath': thisDoc.get('path'),
        //   'bootstrap': thisDoc.get('bootstrap'),
        //   'firstIdx': firstActionableIndex,
        //   'pace': pace,
        //   'snapId': snap.id
        // },
        'createdAt': now.toISOString()
      }, { merge: true })

    } catch (error) {
      console.error(error)
      throw error
    }
  }) 



// ----- HELPER FUNCTIONS -----

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
const getWithFilter = async (collection, whereClauses=[], orderClauses=[], limit=null) => {
  try {
    let collectionQuery = admin.firestore().collection(collection)
    
    whereClauses.forEach( clause => {
      collectionQuery = collectionQuery.where(clause.fieldPath, clause.operator, clause.value)
    })
    
    orderClauses.forEach( clause => {
      collectionQuery = collectionQuery.orderBy(clause.fieldPath, clause.direction)
    })
    
    if (limit) collectionQuery = collectionQuery.limit(limit)

    const results = await collectionQuery.get().catch(console.log)
    
    return await results.docs.map(async doc => {
      const data = await doc.data() 
      return Object.assign({id: doc.id}, data)
    })

  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 * 
 * @param {*} collection 
 * @param {*} docStr 
 */
const getDoc = async (collection, docStr, fields=[]) => {
  try {
    const doc = await admin.firestore().collection(collection).doc(docStr).get().catch(console.log)
    let data = await doc.data()    
    return Object.assign({id: doc.id}, data)
  } catch (error) {
    console.log(error)
    return null
  }
}

