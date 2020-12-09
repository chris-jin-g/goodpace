import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Modal from 'styled-react-modal'
import {LinkedinSquare, Twitter} from '@styled-icons/boxicons-logos'
import {Close, Email, SmartButton} from '@styled-icons/material'
import {Snooze} from '@styled-icons/material-sharp'
import {Share} from '@styled-icons/open-iconic'

// Find styled icons: https://styled-icons.js.org/

const Menu = styled.div`
  color: ${ ({ theme }) => theme.colors.tertiary };
  display: flex;
  font-size: 14px;
  font-style: normal;
  font-weight: 350;
  justify-content: center;
  line-height: 60px;
  user-select: none;
`
const MenuIcon = styled.span`
  flex: 1;
  padding: 0 14px;
  width: 30px;
  
  & :hover {
    color: ${ ({ theme }) => theme.colors.primary };
  }
`

const StyledModal = Modal.styled`
  background-color: white;
  height: 36rem;
  width: 40rem;
  text-align: center;
  
  & h1 {
    color: ${ ({ theme }) => theme.colors.secondary };
    padding: 20px;
    
  }
  & .bold {
    color: ${ ({ theme }) => theme.colors.primary }; 
    font-weight: 800;
  }
  & .shareContainer {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  & .shareMethod {
    color: ${ ({ theme }) => theme.colors.secondary };
    height: 40px;
    width: 40px;
    padding: 4px 6px;
    margin: 6px;
  }
  & .backBtn {
    cursor: pointer;
    font-size: 18px;
    padding: 8px 32px;
  }
  & .saveBtn {
    background-color: ${ ({ theme }) => theme.colors.light };
    cursor: pointer;
    font-size: 18px;
    padding: 8px 32px;
  }
  & .snoozeContainer {
    display: flex;
    flex-direction: rows;
    justify-content: center;
  }
  & .snoozeElement {
    color: ${ ({ theme }) => theme.colors.secondary };
    height: 48px;
    width: 240px;
    padding: 6px;
    margin: 10px 0px;
    flex: -1;
  }
  & .snoozeIcon {
    height: 40px;
    width: 40px;
    flex: -1;
    margin-top: 18px;
  }
  & .input {
    padding: 10px;
    width: 240px;
    font-size: 16px;
    flex: -1;
  }
  & .reminderContainer {
    display: flex;
    flex-direction: columns;
    justify-content: center;
  }
  & .reminderInput {
    flex: -1;
    width: 80px;
    font-size: 16px;
    padding: 10px;
    margin: 0 10px;
  }
`

function MenuItemShare() {
  const [isOpen, setIsOpen] = React.useState(false)
  function toggleModal(e) { setIsOpen(!isOpen) }
  return (
    <>
      <MenuIcon onClick={toggleModal}><Share /></MenuIcon>
      <StyledModal
        isOpen={isOpen}
        onBackgroundClick={toggleModal}
        onEscapeKeydown={toggleModal}
      >
        <h1>Share your path</h1>
        <div className="shareContainer">
          <span className="shareMethod"><Email /></span>
          <span className="shareMethod"><Twitter /></span>
          <span className="shareMethod"><LinkedinSquare /></span>
        </div>
        <div>
          <button className="backBtn" onClick={toggleModal}>Back</button>
        </div>
      </StyledModal>
    </>
  )
}
function MenuItemSnooze({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [myEmail, setMyEmail] = useState()
  const [myReminderValue, setReminderValue] = useState(0)
  const [myReminderUnit, setReminderUnit] = useState('h')

  function toggleModal(e) { 
    e.preventDefault()
    console.log(myEmail, myReminderValue, myReminderUnit)
    if (myReminderValue > 0) {

    }
    setIsOpen(!isOpen) 
  }
  
  useEffect(() => {
    setMyEmail(user && user.email)
    return () => {
    }
  }, [user])
  return (
    <>
      <MenuIcon onClick={toggleModal}><Snooze /></MenuIcon>
      <StyledModal
        isOpen={isOpen}
        onBackgroundClick={toggleModal}
        onEscapeKeydown={toggleModal}
      >  
        <h1><span className="bold">Rest now</span>. Pick this up later</h1>
        <p className="text">Send yourself a reminder and pick up<br/>right where you leave off.</p><br/>
        <span className="bold charlie">Connect your email</span><br/>
        <div className="snoozeContainer">
          <span className="snoozeIcon"><Email /></span>
          <div className="snoozeElement">
            <input 
              className="input" 
              type="text" 
              placeholder="Email" 
              value={myEmail} 
              onChange={(e) => {
                e.preventDefault();
                setMyEmail(e.target.value)
              }} />
          </div>
        </div>
        <br />
        <span className="bold charlie">Remind me in</span><br/>
        <div className="snoozeContainer">
          <span className="snoozeIcon"><Snooze /></span>
          <div className="snoozeElement reminderContainer">
            <input
              id="reminderInput"
              className="reminderInput" 
              type="number" 
              name="reminderDuration"
              onBlur={(e) => {
                e.preventDefault()
                const reminderValue = e.target.value.replace(/[^\d]/g, '')
                setReminderValue(reminderValue)
              }} />
            <select 
              className="reminderIput" 
              name="reminderDurationUnit" 
              id="pauseDuration"
              onChange={(e) => {
                e.preventDefault()
                const reminderUnit = e.target.value
                setReminderUnit(reminderUnit)
                console.log('reminderUnit', reminderUnit)
              }}
              >
              <option value="h">hours</option>
              <option value="d">days</option>
              <option value="w">weeks</option>
              <option value="m">months</option>
            </select>
          </div>
        </div>
        <br />
        <div>
          <button className="saveBtn" onClick={toggleModal}>Done</button>
        </div>
      </StyledModal>
    </>
  )
}

const PaceMenu = ({
  user,
  onClickPace
}) => (
  <Menu>
    <MenuItemSnooze user={user} />
    <MenuIcon onClick={onClickPace}>Pace</MenuIcon>
    {/* <MenuItemShare /> */}
  </Menu>
)

PaceMenu.propTypes = {
}


export { PaceMenu }