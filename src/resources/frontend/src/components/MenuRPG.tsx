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
  onRefreshGameState: () => Promise<GameState>;
  onLogout: () => Promise<void>;
}

type GameView = 'lobby' | 'playing';
type GameLocation = 'adventure' | 'town';
type CommandAnimation =
  | 'attack'
  | 'defend'
  | 'flee'
  | 'explore'
  | 'status'
  | 'help'
  | 'items'
  | 'potion'
  | 'rest'
  | 'inn'
  | 'return_town'
  | 'leave_town'
  | 'equipment'
  | null;
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

const MenuRPG: React.FC<MenuRPGProps> = ({ userName, onCommand, onRefreshGameState, onLogout }) => {
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
  const [location, setLocation] = useState<GameLocation>('adventure');
  const [lobbyError, setLobbyError] = useState('');
  const [activeCommand, setActiveCommand] = useState<CommandAnimation>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [regenTick, setRegenTick] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logBodyRef = useRef<HTMLDivElement>(null);
  const gameStateReceivedAtRef = useRef(Date.now());
  const isRefreshingRegenRef = useRef(false);

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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRegenTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

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
      gameStateReceivedAtRef.current = Date.now();
      setRegenTick(Date.now());
      setInBattle(response.game_state.inBattle);
      if (response.game_state.location) {
        setLocation(response.game_state.location);
      }
      return;
    }

    updateBattleState(response.message);
    if (response.message.includes('街へ戻りました')) {
      setLocation('town');
    }
  };

  const getPercent = (value: number, max: number) => {
    if (max <= 0) return 0;

    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  };

  const formatDuration = (totalSeconds: number) => {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes <= 0) return `${remainingSeconds}秒`;

    return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`;
  };

  const player = gameState?.player;
  const maxHp = Math.max(player?.max_hp ?? 100, 1);
  const hp = Math.max(0, Math.min(player?.hp ?? maxHp, maxHp));
  const level = player?.level ?? 1;
  const experience = Math.max(player?.experience ?? 0, 0);
  const currentLevelStartExperience = Math.max((level - 1) * 100, 0);
  const nextLevelTotalExperience = Math.max(level * 100, 100);
  const experienceToNextLevel = nextLevelTotalExperience - currentLevelStartExperience;
  const experienceProgress = Math.max(
    0,
    Math.min(experience - currentLevelStartExperience, experienceToNextLevel),
  );
  const hpPercent = getPercent(hp, maxHp);
  const expPercent = getPercent(experienceProgress, experienceToNextLevel);
  const hpRegen = gameState?.hpRegen;
  const secondsSinceState = Math.floor((regenTick - gameStateReceivedAtRef.current) / 1000);
  const secondsUntilNextRegen = hpRegen?.is_active
    ? Math.max(0, hpRegen.seconds_until_next - secondsSinceState)
    : 0;
  const secondsUntilFullHp = hpRegen?.is_active
    ? Math.max(0, hpRegen.seconds_until_full - secondsSinceState)
    : 0;

  useEffect(() => {
    if (!hpRegen?.is_active || secondsUntilNextRegen > 0 || isRefreshingRegenRef.current) return;

    isRefreshingRegenRef.current = true;
    onRefreshGameState()
      .then((state) => {
        setGameState(state);
        gameStateReceivedAtRef.current = Date.now();
        setRegenTick(Date.now());
        setInBattle(state.inBattle);
        if (state.location) {
          setLocation(state.location);
        }
      })
      .catch(() => {
        gameStateReceivedAtRef.current = Date.now();
      })
      .finally(() => {
        isRefreshingRegenRef.current = false;
      });
  }, [hpRegen?.is_active, onRefreshGameState, secondsUntilNextRegen]);

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

    if (command === 'return_town' || command === 'leave_town' || command === 'equipment') {
      setActiveCommand(command as CommandAnimation);
      setAnimationKey((current) => current + 1);
      setMessages((prev) => [
        ...prev,
        { type: 'action', text: `▶ ${commandLabel}`, timestamp: new Date() },
      ]);

      if (command === 'return_town') {
        setLocation('town');
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            text: '街に戻りました。宿屋で回復したり、装備や冒険者情報を確認できます。',
            timestamp: new Date(),
          },
        ]);
      }

      if (command === 'leave_town') {
        setLocation('adventure');
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            text: '街を出て、ふたたび冒険に向かいます。',
            timestamp: new Date(),
          },
        ]);
      }

      if (command === 'equipment') {
        setMessages((prev) => [
          ...prev,
          {
            type: 'output',
            text: '=== 装備 ===\n武器: 旅人の剣\n防具: 布の服\nアクセサリ: なし\n\n装備変更機能は街の機能として準備中です。',
            timestamp: new Date(),
          },
        ]);
      }

      return;
    }

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
        { label: 'ポーション', command: 'potion', enabled: true },
        { label: 'にげる', command: 'flee', enabled: true },
        { label: 'ステータス', command: 'status', enabled: true },
      ];
    }

    if (location === 'town') {
      return [
        { label: '冒険に出る', command: 'leave_town', enabled: true },
        { label: '宿屋 30G', command: 'inn', enabled: true },
        { label: 'アイテム', command: 'items', enabled: true },
        { label: 'ステータス', command: 'status', enabled: true },
        { label: '装備', command: 'equipment', enabled: true },
      ];
    }

    return [
      { label: 'すすむ', command: 'explore', enabled: true },
      { label: 'アイテム', command: 'items', enabled: true },
      { label: 'ステータス', command: 'status', enabled: true },
      { label: '街に戻る', command: 'return_town', enabled: true },
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
              <span
                className={`game-mode-badge ${
                  inBattle ? 'game-mode-battle' : location === 'town' ? 'game-mode-town' : 'game-mode-explore'
                }`}
              >
                {inBattle ? 'Battle Mode' : location === 'town' ? 'Town Mode' : 'Explore Mode'}
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
              {hpRegen && (
                <div className="game-regen-status" aria-live="polite">
                  {hpRegen.is_full ? (
                    <span>自動回復: HP満タン</span>
                  ) : hpRegen.is_active ? (
                    <>
                      <span>
                        次回 {formatDuration(secondsUntilNextRegen)}後に HP +{hpRegen.amount}
                      </span>
                      <span>満タンまで {formatDuration(secondsUntilFullHp)}</span>
                    </>
                  ) : (
                    <span>自動回復: 停止中</span>
                  )}
                </div>
              )}
            </div>
            <div className="game-vital-row">
              <div className="game-vital-label">
                <span>EXP</span>
                <strong>{experienceProgress}/{experienceToNextLevel}</strong>
              </div>
              <div className="game-meter" aria-label={`Experience ${experienceProgress}/${experienceToNextLevel}`}>
                <div className="game-meter-fill game-meter-exp" style={{ width: `${expPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <section
          className={`game-log-panel ${location === 'town' && !inBattle ? 'game-town-mode' : ''} ${
            activeCommand ? `game-log-animating game-log-${activeCommand}` : ''
          }`}
        >
          <div className="game-log-title">{location === 'town' && !inBattle ? 'Town Log' : 'Adventure Log'}</div>
          {shouldShowActionBurst(activeCommand) && (
            <div key={`${activeCommand}-${animationKey}`} className={`game-action-burst game-action-${activeCommand}`}>
              <span className="game-action-line game-action-line-one" />
              <span className="game-action-line game-action-line-two" />
              <span className="game-action-spark game-action-spark-one" />
              <span className="game-action-spark game-action-spark-two" />
            </div>
          )}
          {location === 'town' && !inBattle && (
            <div className="game-town-scene" aria-label="Town hub">
              <div className="game-town-summary">
                <span>Home Town</span>
                <strong>はじまりの街</strong>
                <p>冒険の準備を整える拠点です。</p>
              </div>
              <div className="game-town-facilities">
                <article>
                  <span>Inn</span>
                  <strong>宿屋 30G</strong>
                  <p>HPとMPを全回復できます。</p>
                </article>
                <article>
                  <span>Gear</span>
                  <strong>装備</strong>
                  <p>武器や防具の確認場所です。</p>
                </article>
                <article>
                  <span>Profile</span>
                  <strong>冒険者情報</strong>
                  <p>Lv.{level} / {player?.gold ?? 0}G</p>
                </article>
              </div>
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

        <nav className={`game-command-panel ${inBattle ? 'game-command-panel-battle' : ''}`} aria-label="Story commands">
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
