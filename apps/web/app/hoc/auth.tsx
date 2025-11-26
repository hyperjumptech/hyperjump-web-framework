import type { ComponentProps } from "react";

const useIsLoggedIn = () => {
  return true;
};

export const withAuth = <T extends ComponentProps<"div">>(
  Component: React.ComponentType<T & { isLoggedIn: boolean }>
) => {
  const WithAuth = (props: T) => {
    const isLoggedIn = useIsLoggedIn();
    return <Component {...props} isLoggedIn={isLoggedIn} />;
  };
  type WithoutAuthProps = Omit<T, "isLoggedIn">;
  return WithAuth as React.ComponentType<WithoutAuthProps>;
};
