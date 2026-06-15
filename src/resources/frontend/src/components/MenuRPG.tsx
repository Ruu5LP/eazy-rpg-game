import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CommandResponse, GameState } from '../services/api';

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

interface ModeOption {
  title: string;
  description: string;
  status: string;
  enabled: boolean;
}

interface MenuRPGProps {
  userName: string;
  onCommand: (command: string) => Promise<CommandResponse>;
  onLogout: () => Promise<void>;
}

type GameView = 'lobby' | 'playing';
type CommandAnimation = 'attack' | 'defend' | 'flee' | 'explore' | 'status' | 'help' | null;
type BurstCommand = Exclude<CommandAnimation, 'status' | 'help' | null>;

const modeOptions: ModeOption[] = [
  {
    title: 'ストーリーモード',
    description: '探索、戦闘、成長を進めながら小さな冒険を始めます。',
    status: 'Playable',
    enabled: true,
  },
  {
    title: 'フレンド',
    description: '仲間の冒険者とつながる機能です。',
    status: 'Coming soon',
    enabled: false,
  },
  {
    title: 'ランキング',
    description: '到達レベルや討伐記録を競える予定です。',
    status: 'Coming soon',
    enabled: false,
  },
  {
    title: 'イベント',
    description: '期間限定クエストや特別な報酬を準備中です。',
    status: 'Coming soon',
    enabled: false,
  },
];

const MenuRPG: React.FC<MenuRPGProps> = ({ userName, onCommand, onLogout }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<GameView>('lobby');
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      text: 'Easy RPG Game へようこそ！',
      timestamp: new Date(),
    },
    {
      type: 'system',
      text: 'ストーリーモードを選ぶと冒険が始まります。',
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [lobbyError, setLobbyError] = useState('');
  const [activeCommand, setActiveCommand] = useState<CommandAnimation>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logBodyRef.current) return;

    logBodyRef.current.scrollTo({
      top: logBodyRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    if (!activeCommand) return undefined;

    const timerId = window.setTimeout(() => {
      setActiveCommand(null);
    }, 920);

    return () => window.clearTimeout(timerId);
  }, [activeCommand, animationKey]);

  const updateBattleState = (response: string) => {
    if (response.includes('現れた') || response.includes('戦闘') || response.includes('敵')) {
      setInBattle(true);
    }

    if (response.includes('倒した') || response.includes('逃げ') || response.includes('ゲームオーバー')) {
      setInBattle(false);
    }
  };

  const applyCommandResponse = (response: CommandResponse) => {
    if (response.game_state) {
      setGameState(response.game_state);
      setInBattle(response.game_state.inBattle);
      return;
    }

    updateBattleState(response.message);
  };

  const getPercent = (value: number, max: number) => {
    if (max <= 0) return 0;

    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  };

  const player = gameState?.player;
  const maxHp = Math.max(player?.max_hp ?? 100, 1);
  const hp = Math.max(0, Math.min(player?.hp ?? maxHp, maxHp));
  const level = player?.level ?? 1;
  const experience = Math.max(player?.experience ?? 0, 0);
  const nextLevelExperience = Math.max(level * 100, 100);
  const experienceProgress = experience % nextLevelExperience;
  const hpPercent = getPercent(hp, maxHp);
  const expPercent = getPercent(experienceProgress, nextLevelExperience);

  const startStoryMode = async () => {
    if (isProcessing) return;

    setLobbyError('');
    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { type: 'action', text: '▶ ストーリーモード', timestamp: new Date() },
    ]);

    try {
      const response = await onCommand('start');
      setMessages((prev) => [
        ...prev,
        { type: 'output', text: response.message, timestamp: new Date() },
      ]);
      setGameStarted(true);
      setInBattle(false);
      applyCommandResponse(response);
      setView('playing');
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      setLobbyError(`ゲームを開始できませんでした: ${message}`);
      setMessages((prev) => [
        ...prev,
        { type: 'error', text: `エラー: ${message}`, timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCommand = async (commandLabel: string, command: string) => {
    if (isProcessing) return;

    if (command !== 'items') {
      setActiveCommand(command as CommandAnimation);
      setAnimationKey((current) => current + 1);
    }

    setMessages((prev) => [
      ...prev,
      { type: 'action', text: `▶ ${commandLabel}`, timestamp: new Date() },
    ]);
    setIsProcessing(true);

    try {
      const response = await onCommand(command);
      setMessages((prev) => [
        ...prev,
        { type: 'output', text: response.message, timestamp: new Date() },
      ]);
      applyCommandResponse(response);
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

  const handleLogout = async () => {
    await onLogout();
    navigate('/', { replace: true });
  };

  const getMessageClass = (type: Message['type']) => {
    switch (type) {
      case 'action':
        return 'game-log-message game-log-action';
      case 'output':
        return 'game-log-message game-log-output';
      case 'error':
        return 'game-log-message game-log-error';
      case 'system':
        return 'game-log-message game-log-system';
      default:
        return 'game-log-message';
    }
  };

  const getMenuOptions = (): MenuOption[] => {
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
      { label: 'アイテム', command: 'items', enabled: false },
      { label: 'ヘルプ', command: 'help', enabled: true },
    ];
  };

  const shouldShowActionBurst = (command: CommandAnimation): command is BurstCommand => {
    return command === 'attack' || command === 'defend' || command === 'flee' || command === 'explore';
  };

  const menuOptions = getMenuOptions();

  if (view === 'lobby') {
    return (
      <main className="game-screen">
        <section className="game-lobby" aria-label="Game mode select">
          <header className="game-lobby-header">
            <div>
              <p className="game-kicker">Logged in as {userName}</p>
              <h1>EASY RPG</h1>
              <p>遊ぶモードを選んでください。今はストーリーモードだけプレイできます。</p>
            </div>
            <button type="button" className="game-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </header>

          {lobbyError && <div className="game-lobby-error">{lobbyError}</div>}

          <div className="mode-grid">
            {modeOptions.map((mode) => (
              <button
                key={mode.title}
                type="button"
                className={`mode-card ${mode.enabled ? 'mode-card-active' : 'mode-card-disabled'}`}
                onClick={mode.enabled ? startStoryMode : undefined}
                disabled={!mode.enabled || isProcessing}
              >
                <span className="mode-status">{isProcessing && mode.enabled ? 'Starting...' : mode.status}</span>
                <strong>{mode.title}</strong>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>

          <aside className="game-lobby-note">
            <strong>Adventure Log</strong>
            <span>ストーリーモード開始後に、探索ログとコマンドメニューへ切り替わります。</span>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen">
      <section className="game-play-shell" aria-label="Story mode">
        <header className="game-play-header">
          <div>
            <p className="game-kicker">Story Mode</p>
            <h1>EASY RPG</h1>
          </div>
          <div className="game-header-actions">
            {gameStarted && (
              <span className={`game-mode-badge ${inBattle ? 'game-mode-battle' : 'game-mode-explore'}`}>
                {inBattle ? 'Battle Mode' : 'Explore Mode'}
              </span>
            )}
            <button type="button" className="game-subtle-button" onClick={() => setView('lobby')}>
              モード選択
            </button>
            <button type="button" className="game-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="game-status-board">
          <div className="game-status-identity">
            <div>
              <span>Name</span>
              <strong>{player?.name ?? userName}</strong>
            </div>
            <div>
              <span>Level</span>
              <strong>{level}</strong>
            </div>
            <div>
              <span>Gold</span>
              <strong>{player?.gold ?? 0} G</strong>
            </div>
          </div>

          <div className="game-vitals">
            <div className="game-vital-row">
              <div className="game-vital-label">
                <span>HP</span>
                <strong>{hp}/{maxHp}</strong>
              </div>
              <div className="game-meter" aria-label={`HP ${hp}/${maxHp}`}>
                <div className="game-meter-fill game-meter-hp" style={{ width: `${hpPercent}%` }} />
              </div>
            </div>
            <div className="game-vital-row">
              <div className="game-vital-label">
                <span>EXP</span>
                <strong>{experienceProgress}/{nextLevelExperience}</strong>
              </div>
              <div className="game-meter" aria-label={`Experience ${experienceProgress}/${nextLevelExperience}`}>
                <div className="game-meter-fill game-meter-exp" style={{ width: `${expPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <section className={`game-log-panel ${activeCommand ? `game-log-animating game-log-${activeCommand}` : ''}`}>
          <div className="game-log-title">Adventure Log</div>
          {shouldShowActionBurst(activeCommand) && (
            <div key={`${activeCommand}-${animationKey}`} className={`game-action-burst game-action-${activeCommand}`}>
              <span className="game-action-line game-action-line-one" />
              <span className="game-action-line game-action-line-two" />
              <span className="game-action-spark game-action-spark-one" />
              <span className="game-action-spark game-action-spark-two" />
            </div>
          )}
          <div className="game-log-body" ref={logBodyRef}>
            {messages.map((message, index) => (
              <div key={`${message.timestamp.toISOString()}-${index}`} className={getMessageClass(message.type)}>
                {message.text}
              </div>
            ))}
            {isProcessing && <div className="game-processing">Processing...</div>}
            <div ref={messagesEndRef} />
          </div>
        </section>

        <nav className="game-command-panel" aria-label="Story commands">
          {menuOptions.map((option) => (
            <button
              key={option.command}
              type="button"
              onClick={() => executeCommand(option.label, option.command)}
              disabled={!option.enabled || isProcessing}
              className={`game-command-button ${activeCommand === option.command ? 'game-command-button-active' : ''}`}
            >
              <strong>{option.label}</strong>
              {!option.enabled && <span>Coming soon</span>}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
};

export default MenuRPG;
