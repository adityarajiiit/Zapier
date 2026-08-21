"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ReduxProvider } from "./dashboard/store/ReduxProvider";

export function Providers({children}:{children:ReactNode}){
  return(
    <SessionProvider>
      <ReduxProvider>{children}</ReduxProvider>
    </SessionProvider>
  );
}
