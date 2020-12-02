import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { ModalProvider } from 'styled-react-modal'
import { MixpanelProvider } from 'react-mixpanel-browser'
import '../styles.css'

const GlobalStyle = createGlobalStyle`
`

// https://coolors.co/080705-362023-700548-7272ab-7899d4
const theme = {
  colors: {
    primary: '#232323',
    secondary: '#636363',
    tertiary: '#a1a1a1',
    quaternary: '#c1c1c1',
    light: '#f2f2f2',
    accent: '#2323BC',

    // kombu: '#364453b',
    // cadet: '#596869',
    // ebony: '#515751',
    // ivory: '#f5f9e9',
    // sage: '#c2c1a5',

    // apricot: '#ffcdb2',
    // melon: '#ffb4a2',
    // pastel: '#e5989b',
    // english_lavender: '#b5838d',
    // old_lavender: '#6d6875',

    // deep_space_sparkle: '#466365',
    // camel: '#b49a67',
    // silver_pink: '#ceb3ab',
    // periwinkle_crayola: '#c4c6e7',
    // maximum_blue_purple: '#baa5ff',

    // rich_black: '#080705',
    // old_burgandy: '#362023',
    // pansy_purple: '#700548',
    // dark_blue_gray: '#7272ab',
    // cornflower_blue: '#7899d4'
  }
}

// This default export is required in a new `pages/_app.js` file.
export default function PaceAiApp({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <MixpanelProvider token={process.env.NEXT_PUBLIC_REACT_APP_MIXPANEL_TOKEN}>
          <ModalProvider>
            <Component {...pageProps} />
          </ModalProvider>
        </MixpanelProvider>
      </ThemeProvider>
    </>
  )
}