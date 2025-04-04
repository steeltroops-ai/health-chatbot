import { create } from "zustand";
import { getSession } from "next-auth/react";
import api from "./api";

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

// Helper to handle errors consistently
const handleApiError = (error: any): string => {
  console.error("API Error:", error);

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "An unknown error occurred";
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

      const response = await api.get(`/chat/sessions`);

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
      set({
        error: handleApiError(error),
        isLoading: false,
      });
    }
  },

  // Fetch messages for a specific chat session
  fetchMessages: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.get(`/chat/sessions/${sessionId}`);

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
      set({
        error: handleApiError(error),
        isLoading: false,
      });
    }
  },

  // Create a new chat session
  createNewChat: async (initialMessage?: string) => {
    try {
      set({ isLoading: true, error: null });

      // Use a default message if none provided
      const message = initialMessage || "Hello, I need some medical advice.";

      console.log("Creating new chat with message:", message);

      // Create a new session (the backend will create one if no session_id is provided)
      const response = await api.post(`/chat/send`, { message });

      console.log("Server response:", response.data);

      if (!response.data || !response.data.session_id) {
        throw new Error("Invalid response from server");
      }

      // Update our sessions list
      await get().fetchSessions();

      // Set the active chat to the new session
      set({
        activeChatId: response.data.session_id,
        isLoading: false,
      });

      // Fetch messages for the new session
      await get().fetchMessages(response.data.session_id);
    } catch (error: any) {
      console.error("Error creating new chat:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      set({
        error: handleApiError(error),
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
      // Don't set isLoading to true here to avoid UI disruption
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

      // Create the payload object
      const payload = { message, session_id: sessionId };

      // Send the message to the backend
      const response = await api.post(`/chat/send`, payload);

      // Check if this is a fallback response due to rate limiting or quota exceeded
      const isFallback = response.data?.is_fallback === true;
      const errorType = response.data?.error_type;

      if (!response.data || !response.data.response) {
        throw new Error("Invalid response from server");
      }

      // Replace typing indicator with actual response or add response if no indicator
      let content = response.data.response;

      // Note: The backend already adds the fallback note to the response content

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: content,
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

      // If there was a rate limit issue but we got a fallback response,
      // show a system message explaining the situation
      if (isFallback && response.data?.message) {
        const systemMessage: ChatMessage = {
          role: "system",
          content: `System: ${response.data.message}`,
        };

        set((state) => ({
          activeMessages: [...state.activeMessages, systemMessage],
        }));
      }

      // Refresh sessions to update the chat title
      await get().fetchSessions();
    } catch (error: any) {
      // Let the ChatInterface component handle the error display
      // since it has more context about the UI state
      throw error;
    }
  },

  // Delete a chat session
  deleteChat: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });

      await api.delete(`/chat/sessions/${sessionId}`);

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
      set({
        error: handleApiError(error),
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
