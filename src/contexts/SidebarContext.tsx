"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  collapse: () => void;
  expand: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  collapse: () => {},
  expand: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        collapse: () => setCollapsed(true),
        expand: () => setCollapsed(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
