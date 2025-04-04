import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import useChatStore from "../utils/chatStore";

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    activeChatId,
    activeMessages,
    sendMessage,
    fetchMessages,
    isLoading,
  } = useChatStore();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  // Auto-focus the input field
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChatId]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !activeChatId || isTyping) return;

    // Clear input and set typing state
    const message = input;
    setInput("");
    setIsTyping(true);

    // Add a temporary typing indicator message
    const tempMessage = { role: "assistant", content: "[TYPING]" };

    try {
      // Send the message
      const response = await sendMessage(activeChatId, message, tempMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Check if this is a rate limit error with fallback response
      if (
        error.response?.status === 429 ||
        (error.response?.data?.error_type &&
          (error.response?.data?.error_type === "rate_limited" ||
            error.response?.data?.error_type === "quota_exceeded"))
      ) {
        // Get the error message and error type
        const errorMessage =
          error.response?.data?.message ||
          "Rate limit exceeded. Please try again later.";

        // Get the error type
        const errorType = error.response?.data?.error_type || "rate_limited";

        // Create a more user-friendly message based on error type
        let userFriendlyMessage = errorMessage;
        if (errorType === "quota_exceeded") {
          userFriendlyMessage =
            "The AI service quota has been exceeded. Using fallback responses for now.";
        } else if (errorType === "rate_limited") {
          userFriendlyMessage =
            "The AI service is currently rate limited. Using fallback responses for now.";
        }

        // If there's a fallback response available, use it
        if (
          error.response?.data?.response &&
          error.response?.data?.is_fallback
        ) {
          // Replace typing indicator with fallback response
          const fallbackMsg = {
            role: "assistant",
            content:
              error.response.data.response +
              "\n\n*Note: This is a fallback response due to AI service limitations.*",
          };

          useChatStore.setState((state) => {
            const messages = [...state.activeMessages];
            // Replace typing indicator if it exists
            if (
              messages.length > 0 &&
              messages[messages.length - 1].content === "[TYPING]"
            ) {
              messages[messages.length - 1] = fallbackMsg;
            } else {
              messages.push(fallbackMsg);
            }
            return { activeMessages: messages };
          });

          // Show a notification about the rate limit or quota exceeded
          const systemMsg = {
            role: "system",
            content: `System: ${userFriendlyMessage}`,
          };

          useChatStore.setState((state) => {
            return { activeMessages: [...state.activeMessages, systemMsg] };
          });

          return; // Exit early since we've handled the response
        }

        // If no fallback, show error message
        const errorMsg = {
          role: "system",
          content: `Error: ${userFriendlyMessage}`,
        };

        useChatStore.setState((state) => {
          const messages = [...state.activeMessages];
          // Replace typing indicator if it exists
          if (
            messages.length > 0 &&
            messages[messages.length - 1].content === "[TYPING]"
          ) {
            messages[messages.length - 1] = errorMsg;
          } else {
            messages.push(errorMsg);
          }
          return { activeMessages: messages };
        });
      } else {
        // Display error message in chat for other errors
        const errorMessage =
          error.response?.data?.message ||
          "Failed to get a response from the server.";

        const errorMsg = {
          role: "system",
          content: `Error: ${errorMessage}`,
        };

        useChatStore.setState((state) => {
          const messages = [...state.activeMessages];
          // Replace typing indicator if it exists
          if (
            messages.length > 0 &&
            messages[messages.length - 1].content === "[TYPING]"
          ) {
            messages[messages.length - 1] = errorMsg;
          } else {
            messages.push(errorMsg);
          }
          return { activeMessages: messages };
        });
      }

      // We've handled the error message display above, so we can return early
      return;
    } finally {
      setIsTyping(false);
    }
  };

  // Handle textarea input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Medical Assistant
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Providing health information & guidance
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <svg
              className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          <>
            {/* Welcome message */}
            <div className="mb-6 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 border-l-4 border-primary-500">
              <p className="font-medium text-primary-700 dark:text-primary-400 mb-1">
                Welcome to Medical Chatbot!
              </p>
              <p>
                I can provide health information and guidance. Remember, I'm not
                a substitute for professional medical advice. Always consult a
                healthcare provider for serious concerns.
              </p>
            </div>

            {/* Message bubbles */}
            {activeMessages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isLastMessage={index === activeMessages.length - 1}
              />
            ))}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <form
          onSubmit={handleSendMessage}
          className="flex flex-col space-y-2 max-w-4xl mx-auto"
        >
          <div className="relative flex items-end gap-3 w-full">
            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type your message..."
                className="block w-full rounded-2xl border border-gray-200 dark:border-gray-600 shadow-md focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none overflow-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3.5 px-4 pr-12 transition-all duration-200"
                disabled={isLoading || isTyping}
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400 pointer-events-none">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                  Shift+Enter
                </kbd>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim() || isLoading || isTyping}
              className="inline-flex items-center justify-center p-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed h-12 w-12 transition-all duration-200 ease-in-out"
              aria-label="Send message"
            >
              {isTyping ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 transform rotate-45"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Not a substitute for professional medical advice. Always consult a
            healthcare provider.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
