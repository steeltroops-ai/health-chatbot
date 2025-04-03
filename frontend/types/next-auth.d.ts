import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string;
      /** The user's access token */
      accessToken: string;
      /** The user's refresh token */
      refreshToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    accessToken: string;
    refreshToken: string;
  }
}
