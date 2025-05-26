import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface Character {
  name: string | null;
  class: string | null;
  goals: string[];
  inventory: string[];
  relationships: Record<string, string>;
  story_progress: number;
  current_location: string | null;
  active_quests: string[];
  completed_quests: string[];
}

const Index: React.FC = () => {
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeStory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8080/api/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: "I want to start a new adventure story.",
          session_id: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Server response:", data); // Debug log

      if (data.generated_text) {
        setMessages([
          {
            role: "assistant",
            content: data.generated_text,
          },
        ]);
        if (data.session_id) {
          setSessionId(data.session_id);
        }
        if (data.character) {
          setCharacter(data.character);
        }
      } else {
        throw new Error("No generated text in response");
      }
    } catch (err) {
      console.error("Error initializing story:", err);
      setError(err instanceof Error ? err.message : "Failed to start story");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeStory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage = inputText;
    setInputText("");

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("http://localhost:8080/api/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: userMessage,
          session_id: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Server response:", data); // Debug log

      if (data.generated_text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.generated_text,
          },
        ]);
        if (data.character) {
          setCharacter(data.character);
        }
      } else {
        throw new Error("No generated text in response");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Interactive Story Adventure
          </h1>
          <p className="text-gray-400">Write your own adventure</p>
        </header>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            Error: {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
          <div className="space-y-4 h-[60vh] overflow-y-auto mb-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-blue-600 ml-4"
                        : "bg-gray-700 mr-4"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex justify-center">
                <div className="animate-pulse text-gray-400">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {character && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-4">
            <h2 className="text-xl font-bold mb-2">Character Sheet</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="font-bold">{character.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400">Class</p>
                <p className="font-bold">{character.class || "Not set"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400">Goals</p>
                <div className="flex flex-wrap gap-2">
                  {character.goals.map((goal, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 px-2 py-1 rounded text-sm"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400">Inventory</p>
                <div className="flex flex-wrap gap-2">
                  {character.inventory.map((item, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 px-2 py-1 rounded text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400">Current Location</p>
                <p className="font-bold">{character.current_location || "Unknown"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400">Active Quests</p>
                <div className="flex flex-wrap gap-2">
                  {character.active_quests.map((quest, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 px-2 py-1 rounded text-sm"
                    >
                      {quest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
