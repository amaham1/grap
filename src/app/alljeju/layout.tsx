import { ReactNode } from 'react';

export default function AllJejuLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {children}
    </div>
  );
}
