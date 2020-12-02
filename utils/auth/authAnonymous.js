import firebase from 'firebase/app'
import 'firebase/auth'
import { initFirebase } from './initFirebase'
import { setUserCookie } from './userCookies'
import { mapUserData } from './mapUserData'

initFirebase()

const signInAnonymously = async () => {
  
  const result = await firebase.auth().signInAnonymously()
    .catch((error) => {
      console.error(error)
    })
  
  const userData = mapUserData(result.user)
  
  // Edit: fetch displayName from users collection
  const userDoc = await firebase.firestore()
    .doc(`/users/${userData.id}`)
    .get()
    .catch((error) => error)
  const userDocData = userDoc.data()
  userData.displayName = userDocData && userDocData.displayName
  userData.avatarSource = userDocData && userDocData.avatarSource
  // Edit: set isAnonymous to true
  userData.isAnonymous = true

  setUserCookie(userData)
  console.log('signing in anonymously', userData)
}


export default signInAnonymously


