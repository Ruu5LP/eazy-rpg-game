import React, { useState, useEffect, useRef } from 'react';

interface Message {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: Date;
}

interface CommandTerminalProps {
  onCommand: (command: string) => Promise<string>;
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ onCommand }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      text: 'Easy RPG Game - コマンドを入力してください',
      timestamp: new Date(),
    },
    {
      type: 'system',
      text: 'ヘルプを表示するには "help" と入力してください',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');

    // Add user input to messages
    setMessages((prev) => [
      ...prev,
      { type: 'input', text: `> ${userInput}`, timestamp: new Date() },
    ]);

    setIsProcessing(true);

    try {
      const response = await onCommand(userInput);
      setMessages((prev) => [
        ...prev,
        { type: 'output', text: response, timestamp: new Date() },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          text: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMessageColor = (type: Message['type']) => {
    switch (type) {
      case 'input':
        return 'text-green-400';
      case 'output':
        return 'text-white';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 font-mono">
      {/* Terminal Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <h1 className="text-green-400 text-xl font-bold">🎮 Easy RPG Terminal</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => (
          <div key={index} className={`${getMessageColor(message.type)} whitespace-pre-wrap`}>
            {message.text}
          </div>
        ))}
        {isProcessing && (
          <div className="text-yellow-400 animate-pulse">処理中...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-green-400 disabled:opacity-50"
            placeholder="コマンドを入力..."
            autoFocus
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            実行
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommandTerminal;
