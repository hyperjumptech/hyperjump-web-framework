import { withAuth } from "./auth";

const AuthButton = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <div>{isLoggedIn ? <button>Logout</button> : <button>Login</button>}</div>
  );
};

export default withAuth(AuthButton);
