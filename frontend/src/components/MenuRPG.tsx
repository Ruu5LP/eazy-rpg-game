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
        return 'text-cyan-400 font-bold';
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Game Header */}
      <div className="bg-gray-800 border-b-2 border-yellow-600 px-6 py-4 shadow-lg">
        <h1 className="text-yellow-400 text-2xl font-bold text-center">
          🎮 Easy RPG Game
        </h1>
        {gameStarted && (
          <div className="text-center text-gray-400 text-sm mt-1">
            {inBattle ? '⚔️ 戦闘中' : '🗺️ 探索中'}
          </div>
        )}
      </div>

      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${getMessageColor(message.type)} leading-relaxed whitespace-pre-wrap p-3 rounded ${
              message.type === 'output' ? 'bg-gray-800 bg-opacity-50' : ''
            }`}
          >
            {message.text}
          </div>
        ))}
        {isProcessing && (
          <div className="text-yellow-400 animate-pulse text-center py-2">
            処理中...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Name Input Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-yellow-600 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-yellow-400 text-xl font-bold mb-4 text-center">
              プレイヤー名を入力してください
            </h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-gray-900 text-white border-2 border-gray-600 rounded px-4 py-3 mb-4 focus:outline-none focus:border-yellow-500"
                placeholder="名前を入力..."
                autoFocus
                maxLength={20}
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!playerName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  決定
                </button>
                <button
                  type="button"
                  onClick={() => setShowNameInput(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Area */}
      <div className="bg-gray-800 border-t-2 border-yellow-600 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  py-4 px-6 rounded-lg font-bold text-lg transition-all transform
                  ${
                    option.enabled
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white shadow-lg'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  border-2 border-blue-400
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {!gameStarted && (
            <div className="text-center text-gray-400 text-sm mt-4">
              まずは「ゲームを始める」を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuRPG;
