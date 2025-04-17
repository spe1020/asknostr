import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import NostrProvider from './components/NostrProvider.tsx'

const defaultRelays: `wss://${string}`[] = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nostr.mom',
  'wss://nos.lol'
];

createRoot(document.getElementById("root")!).render(
  <NostrProvider relays={defaultRelays}>
    <App />
  </NostrProvider>
);
