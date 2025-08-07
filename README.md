# AskNostr

A minimalist Nostr web client focused on the #asknostr tag — a decentralized Q&A interface where users can view, post, and reply to questions.

## Features

🧠 **Feed of Questions**
- Display all kind 1 events tagged with ["t", "asknostr"]
- Root-level notes only (no "e" tags = no replies)
- Sort options: Most recent, Most replied, Most zapped
- Show pubkey (or NIP-05), timestamp, truncated content, zap & reply counts

🧵 **Thread View: Root + Replies**
- Show the root question note first
- Fetch and display all direct replies
- Sort replies by created_at (oldest to newest)
- Optional toggle for zap-ranked sorting

✍️ **Post a Question**
- Input field for question text (markdown supported)
- Auto-append tag ["t", "asknostr"]
- Posting options: Logged-in user or Anonymous (ephemeral keypair)

💬 **Reply to a Question**
- Replies include ["e", root_note_id] and ["p", pubkey_of_root]
- Post as anonymous or signed-in user
- Show under root in thread view

⚡ **Zap Support**
- Show zap counts on questions and replies (NIP-57)
- Zap buttons for signed-in users

🔑 **Auth Options**
- Login via nsec stored in localStorage
- Use browser extension (Alby / NIP-07)
- Generate and post with ephemeral anonymous key

🎓 **New User Tutorial**
- Interactive tutorial explaining Nostr vs legacy internet
- Focus on cryptographic identity vs usernames/passwords
- Explains the benefits of decentralization
- Always accessible via Help button

📡 **Relay Pool**
- Uses Nostrify for relay handling
- Configurable relay selection

## Technology Stack

- **React 18.x**: Modern React with hooks and concurrent rendering
- **TailwindCSS 3.x**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **shadcn/ui**: Accessible UI components built with Radix UI
- **Nostrify**: Nostr protocol framework for web
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and state management
- **TypeScript**: Type-safe JavaScript development

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
src/
├── components/           # UI components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── QuestionCard.tsx # Individual question display
│   ├── ReplyCard.tsx    # Individual reply display
│   ├── QuestionsFeed.tsx # Main questions feed
│   ├── ThreadView.tsx   # Thread view with replies
│   ├── PostQuestionForm.tsx # Form to post questions
│   ├── ReplyForm.tsx    # Form to post replies
│   ├── NostrTutorial.tsx # Interactive tutorial for new users
│   ├── WelcomeMessage.tsx # Welcome banner for new users
│   └── AskNostrInfo.tsx # Information about #asknostr community
├── hooks/               # Custom React hooks
│   ├── useAskNostrQuestions.ts # Fetch asknostr questions
│   ├── useThreadReplies.ts     # Fetch thread replies
│   ├── useAnonymousPost.ts     # Anonymous posting
│   └── useTutorial.ts          # Tutorial state management
├── pages/               # Page components
│   └── Index.tsx        # Main application page
└── lib/                 # Utility functions
```

## Core Functionality

### Questions Feed
- Fetches kind 1 events with #asknostr tag
- Filters out replies (events with "e" tags)
- Supports sorting by recent, most replied, most zapped
- Click to view full thread

### Thread View
- Shows root question with full content
- Displays all direct replies chronologically
- Reply form for posting responses
- Back navigation to questions feed

### Anonymous Posting
- Generates ephemeral keypairs for anonymous posts
- No persistence of anonymous keys
- Option to post signed if logged in

### Authentication
- NIP-07 browser extension support
- nsec key storage in localStorage
- Anonymous posting without authentication

## Nostr Implementation

- **NIP-01**: Basic protocol implementation
- **NIP-07**: Browser extension signing
- **NIP-57**: Lightning zaps (display only)
- **Kind 1**: Text notes for questions and replies
- **Tags**: Uses "t" tag for #asknostr categorization

## License

MIT

---

Vibed with [MKStack](https://soapbox.pub/mkstack)