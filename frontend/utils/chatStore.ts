import { create } from "zustand";
import axios from "axios";
import { getSession } from "next-auth/react";

// Types
interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id?: string;
  role: string;
  content: string;
  created_at?: string;
}

interface ChatState {
  // State
  sessions: ChatSession[];
  activeChatId: string | null;
  activeMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: () => Promise<void>;
  fetchMessages: (sessionId: string) => Promise<void>;
  createNewChat: (initialMessage?: string) => Promise<void>;
  sendMessage: (
    sessionId: string,
    message: string,
    tempMessage?: ChatMessage
  ) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  setActiveChatId: (sessionId: string | null) => void;
  clearError: () => void;
}

// API utilities
const getApiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeaders = async () => {
  const session = await getSession();

  return {
    Authorization: `Bearer ${session?.user?.accessToken}`,
  };
};

// Create store
const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  sessions: [],
  activeChatId: null,
  activeMessages: [],
  isLoading: false,
  error: null,

  // Fetch all chat sessions
  fetchSessions: async () => {
    try {
      set({ isLoading: true, error: null });

      const headers = await getAuthHeaders();
      const response = await axios.get(`${getApiUrl()}/chat/sessions`, {
        headers,
      });

      set({
        sessions: response.data.sessions,
        isLoading: false,
      });

      // Set active chat to the first session if none is selected
      const { activeChatId, sessions } = get();
      if (!activeChatId && sessions.length > 0) {
        set({ activeChatId: sessions[0].id });
      }
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      set({
        error: error.response?.data?.message || "Failed to load chat sessions",
        isLoading: false,
      });
    }
  },

  // Fetch messages for a specific chat session
  fetchMessages: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${getApiUrl()}/chat/sessions/${sessionId}`,
        { headers }
      );

      // Transform messages to the format we need
      const messages = response.data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      }));

      set({
        activeMessages: messages,
        activeChatId: sessionId,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      set({
        error: error.response?.data?.message || "Failed to load messages",
        isLoading: false,
      });
    }
  },

  // Create a new chat session
  createNewChat: async (initialMessage?: string) => {
    try {
      set({ isLoading: true, error: null });

      const headers = await getAuthHeaders();

      // Create a new session (the backend will create one if no session_id is provided)
      const response = await axios.post(
        `${getApiUrl()}/chat/send`,
        {
          message: initialMessage || "Hello, I need some medical advice.",
        },
        { headers }
      );

      // Refresh sessions and set active chat
      await get().fetchSessions();

      set({
        activeChatId: response.data.session_id,
        isLoading: false,
      });

      // Fetch messages for the new session
      await get().fetchMessages(response.data.session_id);
    } catch (error: any) {
      console.error("Error creating new chat:", error);
      set({
        error: error.response?.data?.message || "Failed to create new chat",
        isLoading: false,
      });
    }
  },

  // Send a message in a chat session
  sendMessage: async (
    sessionId: string,
    message: string,
    tempMessage?: ChatMessage
  ) => {
    try {
      // Don't set loading state here to avoid UI disruption
      set({ error: null });

      // Add user message to the UI immediately
      const userMessage: ChatMessage = {
        role: "user",
        content: message,
      };

      set((state) => ({
        activeMessages: [...state.activeMessages, userMessage],
      }));

      // Add temporary typing message if provided
      if (tempMessage) {
        set((state) => ({
          activeMessages: [...state.activeMessages, tempMessage],
        }));
      }

      // Send the message to the backend
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${getApiUrl()}/chat/send`,
        {
          message,
          session_id: sessionId,
        },
        { headers }
      );

      // Replace typing indicator with actual response or add response if no indicator
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.data.response,
      };

      set((state) => {
        if (tempMessage) {
          // Replace the last message (typing indicator) with the response
          const messages = [...state.activeMessages];
          messages[messages.length - 1] = assistantMessage;
          return { activeMessages: messages };
        } else {
          // Add the response as a new message
          return {
            activeMessages: [...state.activeMessages, assistantMessage],
          };
        }
      });

      // Refresh sessions to update the chat title
      await get().fetchSessions();
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Remove typing indicator if there was an error
      if (tempMessage) {
        set((state) => ({
          activeMessages: state.activeMessages.slice(0, -1),
          error: error.response?.data?.message || "Failed to send message",
        }));
      } else {
        set({
          error: error.response?.data?.message || "Failed to send message",
        });
      }
    }
  },

  // Delete a chat session
  deleteChat: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const headers = await getAuthHeaders();
      await axios.delete(`${getApiUrl()}/chat/sessions/${sessionId}`, {
        headers,
      });

      // Refresh sessions
      await get().fetchSessions();

      // If the deleted session was active, clear active chat
      if (get().activeChatId === sessionId) {
        set({
          activeChatId: null,
          activeMessages: [],
        });
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      set({
        error: error.response?.data?.message || "Failed to delete chat",
        isLoading: false,
      });
    }
  },

  // Set active chat session
  setActiveChatId: (sessionId: string | null) => {
    set({ activeChatId: sessionId });

    // If sessionId is not null, fetch messages
    if (sessionId) {
      get().fetchMessages(sessionId);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useChatStore;
