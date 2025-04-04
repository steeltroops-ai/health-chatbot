import React from "react";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: {
    role: string;
    content: string;
  };
  isLast?: boolean;
  isLastMessage?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLast = false,
  isLastMessage = false,
}) => {
  const isUser = message.role === "user";
  const isTyping = message.content === "[TYPING]";
  const isSystemError =
    message.role === "system" && message.content.startsWith("Error:");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary-600 text-white rounded-br-none"
            : isSystemError
            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700 rounded-bl-none"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
        }`}
      >
        {isTyping ? (
          <div className="flex items-center space-x-1">
            <div
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
