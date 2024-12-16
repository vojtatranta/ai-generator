import { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authConfig = {
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    // }),
    //   CredentialProvider({
    //     credentials: {
    //       email: {
    //         type: "email",
    //       },
    //       password: {
    //         type: "password",
    //       },
    //     },
    //     async authorize(credentials, req) {
    //       const user = {
    //         id: "1",
    //         name: "John",
    //         email: credentials?.email as string,
    //       };
    //       if (user) {
    //         // Any object returned will be saved in `user` property of the JWT
    //         return user;
    //       } else {
    //         // If you return null then an error will be displayed advising the user to check their details.
    //         return null;
    //         // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
    //       }
    //     },
    //   }),
  ],
  // callbacks: {
  //   async jwt(allData) {
  //     // Assuming `user` contains role information after authentication
  //     console.log("jwt:token", allData);
  //     return allData.token;
  //   },
  // },
  pages: {
    signIn: "/login", //sigin page
  },
} satisfies NextAuthConfig;

export default authConfig;
