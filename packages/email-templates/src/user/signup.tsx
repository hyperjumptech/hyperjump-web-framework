import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface SignupEmailProps {
  name: string;
  verifyUrl: string;
}

/**
 * Email sent to new users after signing up.
 * Contains a verification link to confirm their email address.
 *
 * @param props.name - The user's display name.
 * @param props.verifyUrl - The URL the user clicks to verify their email.
 * @returns The signup email React Email component.
 */
export const SignupEmail = ({
  name,
  verifyUrl,
}: SignupEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>Welcome — verify your email to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {name}!</Heading>
          <Text style={paragraph}>
            Thanks for signing up. Please verify your email address by clicking
            the button below.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verifyUrl}>
              Verify Email
            </Button>
          </Section>
          <Text style={paragraph}>
            If you didn&apos;t create an account, you can safely ignore this
            email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button doesn&apos;t work, copy and paste this URL into your
            browser: {verifyUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

SignupEmail.PreviewProps = {
  name: "Jane",
  verifyUrl: "https://example.com/verify?token=abc123",
} satisfies SignupEmailProps;

export default SignupEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a1a1a",
  marginBottom: "24px",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#4a4a4a",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const hr: React.CSSProperties = {
  borderColor: "#e6e6e6",
  margin: "32px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#8c8c8c",
  wordBreak: "break-all",
};
