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

export const BuildSuccessTemplate = ({
  name,
  pluginName,
  redirect,
}: {
  name: string
  pluginName: string
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
    <Preview>Your Collapp plugin has been published! 🤩</Preview>
    <Tailwind>
      <Body className="bg-gray-200 p-8 text-gray-600 font-sans">
        <Container className="bg-gray-50 max-w-2xl mx-auto p-8 rounded-3xl text-center">
          <Section>
            <Img
              src="https://collapp.live/logo.png"
              className="h-8 w-8 mx-auto opacity-20 mb-6"
            />
            <h3 className="text-2xl font-normal">Hey, {name}!</h3>
            <h1 className="text-4xl font-bold text-green-500 mb-6">
              Great news! 🎉
            </h1>
            <p className="mb-4">
              Your Collapp plugin <b>{pluginName}</b> has been successfully
              published and can be used by people all over the world!
            </p>
            <p className="text-gray-400 italic mb-6 text-sm">
              Exciting, isn{"'"}t it?
            </p>
            <Button
              href={redirect}
              className="px-6 py-3 bg-green-500 mx-auto rounded-xl font-bold text-white cursor-pointer hover:bg-green-600 shadow-xl transition-colors"
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
