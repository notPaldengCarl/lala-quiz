# LalaQuiz

An advanced AI-powered study companion that generates quizzes, flashcards, and memory games from your study materials using Google's Gemini API.

## 🛠️ Tech Stack & Libraries Used

### Core Framework
*   **React 19**: The core UI library used for building the component-based interface.
*   **TypeScript**: Used for type safety, interfaces (`QuizData`, `Question`, etc.), and robust code structure.

### Artificial Intelligence
*   **Google GenAI SDK (`@google/genai`)**:
    *   **Model**: `gemini-2.5-flash` (Optimized for speed and free-tier availability).
    *   **Function**: Ingests text and images to generate structured JSON study sets containing questions, answers, summaries, and keywords.

### Styling & UI
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development and responsive design.
*   **Google Fonts**:
    *   `Kanit`: Used for headings and brand typography.
    *   `Inter`: Used for body text and readability.
*   **FontAwesome**: Icon library for UI elements (buttons, indicators, game assets).
*   **Custom CSS Variables**: Used for the "Earth Theme" color palette (`#544230`, `#A08267`, etc.).

### Animation & Interactivity
*   **GSAP (GreenSock Animation Platform)**:
    *   Used for smooth entrance animations of quiz cards.
    *   Used for the score counting animation in the results view.

### Utilities
*   **LZ-String**:
    *   Used to compress large JSON quiz data into URL-safe strings.
    *   Enables the "Share Quiz" functionality without a backend database.
*   **LocalStorage API**: Persists user history, XP/Level stats, and preferences in the browser.
*   **Clipboard API**: Handles copying shareable links (includes a textarea fallback for non-secure contexts).

### Media Handling
*   **FileReader API**: Converts uploaded images/files to Base64 for the AI model.
*   **SpeechSynthesis API**: Native browser API used in Flashcard mode to read questions and answers aloud.

## 🚀 Key Features

1.  **Multi-Modal Ingestion**: Upload text, PDFs, or Images to generate content.
2.  **Study Modes**:
    *   **Quiz**: Multiple choice, True/False, Fill in the blank.
    *   **Flashcards**: Interactive flip cards with text-to-speech.
    *   **Memory Match**: A gamified pair-matching exercise.
3.  **Gamification**: XP system, leveling, and streak tracking.
4.  **Sharing System**: Generate unique, compressed links to share generated quizzes with others instantly.
5.  **Export**: Download results as CSV or full Quiz data as JSON.