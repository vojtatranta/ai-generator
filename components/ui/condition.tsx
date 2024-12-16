import React from "react";

export const IfContext = React.createContext<{
  condition: boolean;
}>({
  condition: false,
});

export const If = ({
  condition,
  children,
}: {
  condition: boolean;
  children: React.ReactNode;
}) => {
  return (
    <IfContext.Provider value={{ condition }}>{children}</IfContext.Provider>
  );
};

export const Then = ({ children }: { children: React.ReactNode }) => {
  const { condition } = React.useContext(IfContext);

  if (!condition) return null;

  return <>{children}</>;
};

export const Else = ({ children }: { children: React.ReactNode }) => {
  const { condition } = React.useContext(IfContext);

  if (condition) return null;

  return <>{children}</>;
};
