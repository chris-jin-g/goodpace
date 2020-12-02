import styled from 'styled-components'
import { LinkedinSquare, Twitter } from '@styled-icons/boxicons-logos'
import { Edit, Feedback } from '@styled-icons/material'
import { SignIn, SignOut } from '@styled-icons/octicons'

export const LinkedInIcon = styled(LinkedinSquare)`
  flex: 1;
  width: 24px;
  padding: 0 5px;
  cursor: pointer;
  color: ${ ({ theme }) => theme.colors.quaternary };
  & :hover {
    color: ${ ({ theme }) => theme.colors.secondary };
  }
`
export const TwitterIcon = styled(Twitter)`
  flex: 1;
  width: 24px;
  padding: 0 5px;
  cursor: pointer;
  color: ${ ({ theme }) => theme.colors.quaternary };
  & :hover {
    color: ${ ({ theme }) => theme.colors.secondary };
  }
`
export const EditIcon = styled(Edit)`
  padding: 0;
  width: 24px;
  
  & :hover {
    color: ${ ({ theme }) => theme.colors.primary };
  }
`

export const FeedbackIcon = styled(Feedback)`
  width: 24px;
  padding: 0 5px;
  cursor: pointer;
  color: ${ ({ theme }) => theme.colors.quaternary };
  & :hover {
    color: ${ ({ theme }) => theme.colors.secondary };
  }
`

export const SignInIcon = styled(SignIn)`
  width: 24px;
  padding: 0 5px;
  cursor: pointer;
  color: ${ ({ theme }) => theme.colors.quaternary };
  & :hover {
    color: ${ ({ theme }) => theme.colors.secondary };
  }
`

export const SignOutIcon = styled(SignOut)`
  width: 24px;
  padding: 0 5px;
  cursor: pointer;
  color: ${ ({ theme }) => theme.colors.quaternary };
  & :hover {
    color: ${ ({ theme }) => theme.colors.secondary };
  }
`