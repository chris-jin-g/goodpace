import { useEffect } from 'react'
import Head from 'next/head'
import { hotjar } from 'react-hotjar'
import { NextSeo } from 'next-seo'

// hotjar site id (2071370)
const hjid = process.env.NEXT_PUBLIC_HOTJAR_ID
// hotjar script version (6)
const hjsv = process.env.NEXT_PUBLIC_HOTJAR_SCRIPT_VERSION

export const Header = (props) => {
  useEffect(() => {
    if (hjid && hjsv) {
      hotjar.initialize(hjid, hjsv)
    }    
  }, [])

  const description = (props.description) ?? "Pace is great. SEO stuff goes here. https://github.com/garmeeh/next-seo#readme"
  

  return (
    <NextSeo
      title={props.title}
      description={description}
    />
  )
}