import { ReactNode } from 'react';
import StreamVideoProvider from '@/providers/StreamClientProvider';
import { UserProvider } from '@/providers/UserProvider';
import "@stream-io/video-react-sdk/dist/css/styles.css";
const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <main>
      <UserProvider>
        <StreamVideoProvider>
          {children}
        </StreamVideoProvider>
      </UserProvider>
    </main>
  );
};


export default RootLayout;
