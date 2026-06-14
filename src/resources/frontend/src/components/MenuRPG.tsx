import React, { useState, useEffect, useRef } from 'react';

interface Message {
  type: 'output' | 'error' | 'system' | 'action';
  text: string;
  timestamp: Date;
}

interface MenuOption {
  label: string;
  command: string;
  enabled: boolean;
}

interface MenuRPGProps {
  onCommand: (command: string) => Promise<string>;
}

const MenuRPG: React.FC<MenuRPGProps> = ({ onCommand }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      text: 'Easy RPG Game へようこそ！',
      timestamp: new Date(),
    },
    {
      type: 'system',
      text: '下のメニューから行動を選んでください',
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeCommand = async (commandLabel: string, command: string) => {
    if (isProcessing) return;

    // Add action message
    setMessages((prev) => [
      ...prev,
      { type: 'action', text: `▶ ${commandLabel}`, timestamp: new Date() },
    ]);

    setIsProcessing(true);

    try {
      const response = await onCommand(command);
      setMessages((prev) => [
        ...prev,
        { type: 'output', text: response, timestamp: new Date() },
      ]);

      // Update game state based on response
      if (command.startsWith('start') || command.startsWith('はじめる')) {
        setGameStarted(true);
      }

      // Check if in battle (simple heuristic - check for battle-related keywords)
      if (response.includes('現れた') || response.includes('戦闘') || response.includes('敵')) {
        setInBattle(true);
      }

      if (response.includes('倒した') || response.includes('逃げ') || response.includes('ゲームオーバー')) {
        setInBattle(false);
      }
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

  const handleStartGame = () => {
    setShowNameInput(true);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setShowNameInput(false);
    executeCommand(`ゲーム開始（${playerName}）`, `start ${playerName}`);
  };

  const getMessageColor = (type: Message['type']) => {
    switch (type) {
      case 'action':
        return 'text-blue-600 font-bold bg-blue-50 border-l-4 border-blue-500 pl-2';
      case 'output':
        return 'text-gray-800';
      case 'error':
        return 'text-red-600 font-bold bg-red-50 border-l-4 border-red-500 pl-2';
      case 'system':
        return 'text-green-700 font-bold bg-green-50 border-l-4 border-green-500 pl-2';
      default:
        return 'text-gray-600';
    }
  };

  // Menu options based on game state
  const getMenuOptions = (): MenuOption[] => {
    if (!gameStarted) {
      return [
        { label: 'ゲームを始める', command: 'start', enabled: true },
        { label: 'ヘルプ', command: 'help', enabled: true },
      ];
    }

    if (inBattle) {
      return [
        { label: 'たたかう', command: 'attack', enabled: true },
        { label: 'ぼうぎょ', command: 'defend', enabled: true },
        { label: 'にげる', command: 'flee', enabled: true },
        { label: 'ステータス', command: 'status', enabled: true },
      ];
    }

    return [
      { label: 'すすむ（探索）', command: 'explore', enabled: true },
      { label: 'ステータス', command: 'status', enabled: true },
      { label: 'アイテム', command: 'items', enabled: false }, // Not implemented yet
      { label: 'ヘルプ', command: 'help', enabled: true },
    ];
  };

  const menuOptions = getMenuOptions();

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-gray-100 h-[90vh] shadow-2xl rounded-xl overflow-hidden flex flex-col relative border border-gray-300">
        {/* Game Header & Status Bar */}
        <div className="game-card bg-white mb-4 overflow-hidden flex-shrink-0 rounded-none border-x-0 border-t-0">
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-gray-50">
            <h1 className="text-gray-800 text-xl font-bold flex items-center gap-2">
              <span>🎮</span> EASY RPG
            </h1>
            {gameStarted && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${inBattle ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {inBattle ? '⚔️ BATTLE MODE' : '🗺️ EXPLORE MODE'}
              </div>
            )}
          </div>

          {/* Status Bar */}
          {gameStarted && (
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold">Name</span>
                <span className="text-lg font-bold text-gray-800">{playerName || 'HERO'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold">Level</span>
                <span className="text-lg font-bold text-green-600">1</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold">HP</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">100/100</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                    <div className="h-full bg-red-500 w-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold">Gold</span>
                <span className="text-lg font-bold text-yellow-600">0 G</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages Display Area */}
        <div className="flex-1 game-card bg-white mb-4 overflow-hidden flex flex-col shadow-inner">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Adventure Log
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white font-mono text-sm leading-relaxed">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${getMessageColor(message.type)} p-3 rounded`}
              >
                {message.text}
              </div>
            ))}
            {isProcessing && (
              <div className="text-blue-500 text-center py-4 animate-pulse font-bold flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                Processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="game-card bg-white p-8 max-w-md w-full shadow-2xl animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Welcome, Hero!
              </h2>
              <p className="text-gray-500 text-center mb-6">
                冒険を始める前に、あなたの名前を教えてください。
              </p>

              <form onSubmit={handleNameSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg"
                    placeholder="Enter your name..."
                    autoFocus
                    maxLength={20}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!playerName.trim()}
                    className="btn-primary flex-1"
                  >
                    Start Adventure
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNameInput(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Area */}
        <div className="game-card bg-white p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {menuOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (option.command === 'start') {
                      handleStartGame();
                    } else {
                      executeCommand(option.label, option.command);
                    }
                  }}
                  disabled={!option.enabled || isProcessing}
                  className={`
                    ${option.enabled ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}
                    h-16 text-lg
                  `}
                >
                  <span className="text-2xl">
                    {option.command === 'attack' && '⚔️'}
                    {option.command === 'defend' && '🛡️'}
                    {option.command === 'flee' && '🏃'}
                    {option.command === 'explore' && '🗺️'}
                    {option.command === 'status' && '📊'}
                    {option.command === 'start' && '▶'}
                    {option.command === 'help' && '?'}
                  </span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            {!gameStarted && (
              <div className="text-center text-gray-500 text-sm mt-4 animate-pulse">
                ↑ 「ゲームを始める」を選択して冒険を開始してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuRPG;
