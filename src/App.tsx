import NostrProvider from '@/components/NostrProvider'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { NostrLoginProvider } from '@nostrify/react/login';

// AI: do not modify this relay list
const defaultRelays = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://ditto.pub/relay',
];

const queryClient = new QueryClient();

const App = () => (
  <NostrLoginProvider storageKey='nostr:login'>
    <NostrProvider relays={defaultRelays}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </NostrProvider>
  </NostrLoginProvider>
);

export default App;
