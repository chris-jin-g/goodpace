export const getBootstrap = ({
  pace, 
  bootstrap, 
  type, 
  index, 
  lastAnswer, 
  duration
}) => {
  // console.log(pace, bootstrap, type, index, lastAnswer, duration)
  let returnText 
  switch (type) {
    default:
    case "question":
      returnText = bootstrap.flow[pace.bootstrap].question
      break;
    case "answer":
      returnText = bootstrap.flow[pace.bootstrap].answer
      break;
  }

  if (returnText && index) {
    // console.log('returnText', returnText, index == 1)
    if (index === 1) {
      returnText = returnText.replace('{nth}', 'first')
    } else {
      returnText = returnText.replace('{nth}', 'next')
    }
  }

  if (returnText && lastAnswer && lastAnswer.length > 0) {
    returnText = returnText.replace('{lastAnswer}', lastAnswer)
  }

  if (returnText && duration && duration.length > 0 ) {
    returnText = returnText.replace('{duration}', duration)
  }

  return returnText
}



export const hashCode = (s) => {
  const hash = s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
  return hash.toString()
}

export const sameAnswer = (currentText, localKey) => {
  return localStorage.getItem(localKey) ? 
    localStorage.getItem(localKey) === hashCode(currentText) : false
}

export const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const lowercase = (s) => {
  if (typeof s !== 'string') return ''
  return s.toLowerCase()  
}
