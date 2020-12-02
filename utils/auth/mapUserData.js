export const mapUserData = (user) => {
  const { uid, email, xa, isAnonymous } = user
  return {
    id: uid,
    email,
    token: xa,
    isAnonymous,
  }
}
