import React, { useState } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Textarea = styled.textarea`
  background-color: ${ ({ theme }) => theme.colors.light };
  border-color: ${ ({ theme }) => theme.colors.light };
  border-radius: 2px;
  color: ${ ({ theme }) => theme.colors.primary };
  font-family: 'Roboto';
  font-size: 16px;
  font-style: normal;
  height: auto;
  line-height: 28px;
  margin: 0;
  max-height: 480px;
  max-width: 680px;
  min-height: 80px;
  padding: 1em;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${ ({ theme }) => theme.colors.light };
    box-shadow: 0 0 4px ${ ({ theme }) => theme.colors.primary };
  }
`

const AnswerTextarea = ({
  onBlur,
  onChange,
  placeholder,
  value,
  key
}) => {
  const inputRef = React.createRef()
  return (
    <Textarea 
      key={key}
      ref={inputRef} 
      placeholder={placeholder}
      onMouseEnter={ () => { inputRef.current.focus() }}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
    />
  )
}

AnswerTextarea.propTypes = {
  placeholder: PropTypes.any, //string.isRequired,
  ref: PropTypes.any,
  key: PropTypes.any
}




// https://codesandbox.io/s/ymwo5419yv?from-embed=&file=/src/index.js:605-621
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: auto;
  width: 100%;
  padding: 0px 16px 24px 16px;
  box-sizing: border-box;
`;
const Item = styled.div`
  display: flex;
  align-items: center;
  height: 60px;
  position: relative;
  padding: 0 30px 0 0;
`;
const RadioButtonLabel = styled.label`
  position: absolute;
  top: 25%;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #bebebe;
`;
const RadioButton = styled.input`
  opacity: 0;
  z-index: 1;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  &:hover ~ ${RadioButtonLabel} {
    background: #bebebe;
    &::after {
      content: "";
      display: block;
      border-radius: 50%;
      width: 12px;
      height: 12px;
      margin: 6px;
      background: #eeeeee;
    }
  }
  ${props =>
    props.checked &&
    ` 
    &:checked + ${RadioButtonLabel} {
      background: #db7290;
      border: 1px solid #db7290;
      &::after {
        content: "";
        display: block;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        margin: 6px;
        box-shadow: 1px 3px 3px 1px rgba(0, 0, 0, 0.1);
        background: white;
      }
    }
  `}
`

// https://codesandbox.io/s/ymwo5419yv?from-embed=&file=/src/index.js:605-621
const AnswerYesNo = ({
  selected,
  onChange
}) => {
  const [select, setSelect] = useState(selected)
  const handleSelectChange = event => {
    onChange(event)
    setSelect(event.target.value)
  }
  return (
    <Wrapper>
      <Item>
        <RadioButton
          type="radio"
          name="radio"
          value="y"
          checked={select === 'y'}
          onChange={event => handleSelectChange(event)}
        />
        <RadioButtonLabel />
        <div>Yes</div>
      </Item>
      <Item>
        <RadioButton
          type="radio"
          name="radio"
          value="n"
          checked={select === 'n'}
          onChange={event => handleSelectChange(event)}
        />
        <RadioButtonLabel />
        <div>No</div>
      </Item>
    </Wrapper>
  )
}

export { AnswerTextarea, AnswerYesNo }