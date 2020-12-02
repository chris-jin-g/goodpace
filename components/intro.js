import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import Link from 'next/link'
import { FeedbackIcon, SignInIcon, SignOutIcon } from './Icons'

const Heading = styled.h5`
  color: ${ props => props.primary ? ({ theme }) => theme.colors.primary : ({ theme }) => theme.colors.tertiary };
  font-size: 18px;
  font-style: normal;
  font-weight: 300;
  line-height: 24px;
  padding: 0 10px;

  & span {
    cursor: pointer;
  }
`

const Dot = styled.span`
  height: 10px;
  width: 10px;
  background-color: ${ ({ theme }) => theme.colors.quaternary };
  border-radius: 60%;
  display: inline-block;
`

const StickyHeading = styled(Heading)`
  background-color: white;
  font-size: 13px;
  left: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  padding: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 10;

  & div {
    max-width: 680px;
    flex: 1;
    padding: 16px 30px 16px;
    border-left: 3px solid ${ ({ theme }) => theme.colors.quaternary };
  }

  & span {
    flex: 1;
    justify-content: space-around;
    align-content: center;
    padding: 0 10px 0 0;
    color: ${ ({ theme }) => theme.colors.tertiary };
  }
  
  & span.goal {
    font-size: 18px;
    color: ${ ({ theme }) => theme.colors.quaternary };
    padding-left: 12px;
  }

  & span.author {
    padding-left: 12px;
  }

  & span.avatar img {
    width: 24px;
    margin-bottom: -6px;
  }

  & span.me {
    position: fixed;
    right:32px;
    width: 48px;    
  }

  & span.me img {
    right: 32px;
    top: 16px;
    width: 24px;
  }
`

const GoalHeading = ({
  goal,
  onClickGoal,
  
  author,
  authorName,
  onClickAuthor,

  me,
  myAvatar,
  onClickMe,

  previewUrl
}) => {
  goal = `To ${goal}`
  if (author === me) { authorName += ' (me)' }
  return (
    <StickyHeading primary>
      <div className='holder'>
        <span className='goal' onClick={onClickGoal}>
          <b>{goal}</b>
        </span>
        { previewUrl && <a target="_blank" href={previewUrl}>[preview]</a>}
        <br />
        <span className='author' onClick={onClickAuthor}>
          <span>By:</span><span><b>{authorName}</b></span>
          <span className='avatar' onClick={onClickAuthor}></span>
        </span>
        <span className='me' onClick={onClickMe}><img src={myAvatar} /></span>
      </div>
    </StickyHeading>
  )
}

GoalHeading.propTypes = {
  goal: PropTypes.string.isRequired,
  onClickGoal: PropTypes.any,
  
  author: PropTypes.string,
  authorName: PropTypes.string,
  onClickCreator: PropTypes.any,

  me: PropTypes.string,
  myAvatar: PropTypes.string,
  onClickMe: PropTypes.any,

  previewUrl: PropTypes.any,
}

const IndexHeading = ({
  text,
  onClickTitle,
  me,
  myAvatar,
  onClickMe,
}) => {
  return (
    <StickyHeading primary>
      <div className='holder'>
        <span className='goal'>
          <b onClick={onClickTitle}>{text}</b>
        </span>
        &nbsp;&nbsp;
        { me ? 
          <span className='me' onClick={onClickMe}>
            <img src={myAvatar} />
          </span> :
          <span className='me'>
            <Link href='/auth'>
              <a>Sign in</a>
            </Link>
        </span>
        }
      </div>
    </StickyHeading>
  )
}

IndexHeading.propTypes = {
  text: PropTypes.string,
  onClickTitle: PropTypes.any,
  me: PropTypes.string,
  myAvatar: PropTypes.string,
  onClickMe: PropTypes.any,
}

const NextHeading = ({
  text,
  onClick,
}) => (
  <Heading onClick={onClick}>{text}</Heading>
)

NextHeading.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}


const SubtleHeading  = styled.div`
  font-size: 12px;
  line-height: 30px;
` 

const PaceLabel = ({
  count,
  duration
}) => (
  <SubtleHeading>
    <span className="paceLabel">PACE : <b>{count}</b></span>&nbsp;&nbsp;&nbsp;<Dot />&nbsp;<span className="tag">{duration}</span>
  </SubtleHeading>
)

PaceLabel.propTypes = {
  count: PropTypes.number.isRequired,
  duration: PropTypes.string.isRequired,
}

const BuildPaceLabel = ({
  count
}) => (
  <SubtleHeading>
    <span className="paceLabel">BUILDING PACE : <b>{count}</b></span>
  </SubtleHeading>
)

BuildPaceLabel.propTypes = {
  count: PropTypes.number.isRequired
} 

export { GoalHeading, NextHeading, IndexHeading, PaceLabel, BuildPaceLabel }