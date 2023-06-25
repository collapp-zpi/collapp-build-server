import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components'
import { Font } from '@react-email/font'

export const BuildFailTemplate = ({
  name,
  pluginName,
  errors,
  redirect,
}: {
  name: string
  pluginName: string
  errors: string
  redirect: string
}) => (
  <Html>
    <Head>
      <Font
        fontFamily="Poppins"
        fallbackFontFamily="Arial"
        webFont={{
          url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2',
          format: 'woff2',
        }}
        fontWeight={500}
        fontStyle="normal"
      />
      <Font
        fontFamily="Poppins"
        fallbackFontFamily="Arial"
        webFont={{
          url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2',
          format: 'woff2',
        }}
        fontWeight={700}
        fontStyle="bold"
      />
    </Head>
    <Preview>Your Collapp plugin build failed 😕</Preview>
    <Tailwind>
      <Body className="bg-gray-200 p-8 text-gray-600 font-sans">
        <Container className="bg-gray-50 max-w-2xl mx-auto p-8 rounded-3xl text-center">
          <Section>
            <Img
              src="https://collapp.live/logo.png"
              className="h-8 w-8 mx-auto opacity-20 mb-6"
            />
            <h3 className="text-2xl font-normal">Hey, {name}!</h3>
            <h1 className="text-3xl font-bold text-red-600 mb-6">
              Something went wrong 😥
            </h1>
            <p className="mb-4">
              An error occurred while building your Collapp plugin -{' '}
              <strong>{pluginName}</strong>.
            </p>
            <p className="bg-gray-200 font-mono p-16 text-sm rounded-md mb-4">
              {errors}
            </p>
            <p className="mb-6">
              Bad news - we can{"'"}t publish it at this time.{' '}
              <strong>Good news</strong> - we are already looking into it.
            </p>
            <Button
              href={redirect}
              className="px-6 py-3 bg-red-500 mx-auto rounded-xl font-bold text-white cursor-pointer hover:bg-red-600 shadow-xl transition-colors"
              target="_blank"
            >
              See for yourself
            </Button>
          </Section>

          <div className="text-gray-400 text-xs mt-12">
            If you believe this email was delivered by mistake, you can safely
            ignore it.
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Your friends at{' '}
            <a href="https://collapp.live">
              <strong>Collapp</strong>
            </a>
          </div>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
