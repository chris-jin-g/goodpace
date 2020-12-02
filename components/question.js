import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Heading = styled.h2`
  color: ${ props => props.primary ? ({ theme }) => theme.colors.primary : ({ theme }) => theme.colors.tertiary };
  font-size: 24px;
  font-style: normal;
  font-weight: 300;
  line-height: 30px;
  padding: 0;

  & span {
    cursor: pointer;
  }

  &:hover {
    color: ${ ({ theme }) => theme.colors.primary }
  }
`

const ReducedHeading = styled(Heading)`
  flex: 1;
  font-size: 24px;
  line-height: 30px;
  padding: 0 10px;
`

const Question = ({
  question
}) => {
  
  if (question.includes('~~')) {
    question = question.replace('~~','')
  }

  return (
    <Heading primary>{question}?</Heading>
  )
}

Question.propTypes = {
  question: PropTypes.string.isRequired,
}

const PrevQuestion = () => {
  return (
    <ReducedHeading><span>Previous</span></ReducedHeading>
  )
}


const NextQuestion = ({
  question,
}) => {
  if (question.length === 0) return ( <ReducedHeading><span>Next</span></ReducedHeading> )
  
  // show only first 24 chars
  const truncatedQuestion = question && question.slice(0, 25) + ' ...' || ': ' + question
  return ( <ReducedHeading><span>Next {truncatedQuestion}</span></ReducedHeading> )
}

NextQuestion.propTypes = {
  question: PropTypes.string.isRequired,
}


export { Question, PrevQuestion, NextQuestion }