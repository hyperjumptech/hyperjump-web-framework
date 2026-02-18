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

export interface PasswordForgotEmailProps {
  name: string;
  resetUrl: string;
}

/**
 * Email sent when a user requests a password reset.
 * Contains a time-limited link to set a new password.
 *
 * @param props.name - The user's display name.
 * @param props.resetUrl - The URL the user clicks to reset their password.
 * @returns The password-forgot email React Email component.
 */
export const PasswordForgotEmail = ({
  name,
  resetUrl,
}: PasswordForgotEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>
            We received a request to reset your password. Click the button below
            to choose a new one.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={paragraph}>
            This link will expire in 1 hour. If you didn&apos;t request a
            password reset, you can safely ignore this email — your password
            will remain unchanged.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button doesn&apos;t work, copy and paste this URL into your
            browser: {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

PasswordForgotEmail.PreviewProps = {
  name: "Jane",
  resetUrl: "https://example.com/reset-password?token=xyz789",
} satisfies PasswordForgotEmailProps;

export default PasswordForgotEmail;

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
