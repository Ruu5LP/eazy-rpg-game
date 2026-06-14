import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Panel = 'howto' | 'records' | 'settings' | 'credits';
type Difficulty = 'Casual' | 'Normal' | 'Hard';

const TitleScreen: React.FC = () => {
  const [activePanel, setActivePanel] = useState<Panel>('howto');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const navigate = useNavigate();

  const hasSaveData = useMemo(() => {
    return Boolean(window.localStorage.getItem('easy-rpg-save'));
  }, []);

  const handleStart = () => {
    navigate('/game');
  };

  const panelButtonClass = (panel: Panel) =>
    `title-tab ${activePanel === panel ? 'title-tab-active' : ''}`;

  return (
    <main className="title-screen">
      <div className="title-stars" />
      <section className="title-shell" aria-label="EASY RPG title screen">
        <div className="title-hero">
          <div className="title-brand">
            <div className="title-kicker">Browser Adventure Game</div>
            <h1>EASY RPG</h1>
            <p>
              小さな選択で、世界が少しずつ変わる。探索、戦闘、成長をブラウザだけで遊べる
              シンプルなコマンドRPG。
            </p>
          </div>

          <div className="title-scene" aria-hidden="true">
            <div className="moon" />
            <div className="castle">
              <span />
              <span />
              <span />
            </div>
            <div className="hero-silhouette" />
            <div className="ground" />
          </div>
        </div>

        <div className="title-grid">
          <nav className="title-menu" aria-label="Main menu">
            <button className="title-action title-action-primary" onClick={handleStart}>
              <span className="action-mark">▶</span>
              <span>
                <strong>GAME START</strong>
                <small>新しい冒険を始める</small>
              </span>
            </button>

            <button
              className="title-action"
              onClick={handleStart}
              disabled={!hasSaveData}
              title={hasSaveData ? '保存データから再開' : '保存データがありません'}
            >
              <span className="action-mark">↻</span>
              <span>
                <strong>CONTINUE</strong>
                <small>{hasSaveData ? '保存データから再開' : 'No save data'}</small>
              </span>
            </button>

            <button className="title-action" onClick={() => setActivePanel('howto')}>
              <span className="action-mark">?</span>
              <span>
                <strong>HOW TO PLAY</strong>
                <small>操作とルールを見る</small>
              </span>
            </button>

            <button className="title-action" onClick={() => setActivePanel('settings')}>
              <span className="action-mark">⚙</span>
              <span>
                <strong>SETTINGS</strong>
                <small>音量と難易度</small>
              </span>
            </button>
          </nav>

          <section className="title-panel">
            <div className="title-tabs" role="tablist" aria-label="Title information">
              <button className={panelButtonClass('howto')} onClick={() => setActivePanel('howto')}>
                Guide
              </button>
              <button className={panelButtonClass('records')} onClick={() => setActivePanel('records')}>
                Records
              </button>
              <button className={panelButtonClass('settings')} onClick={() => setActivePanel('settings')}>
                Settings
              </button>
              <button className={panelButtonClass('credits')} onClick={() => setActivePanel('credits')}>
                Credits
              </button>
            </div>

            {activePanel === 'howto' && (
              <div className="panel-content">
                <h2>遊び方</h2>
                <div className="guide-list">
                  <article>
                    <span>01</span>
                    <h3>名前を決める</h3>
                    <p>スタート後に冒険者名を入力します。ログに物語が記録されます。</p>
                  </article>
                  <article>
                    <span>02</span>
                    <h3>探索する</h3>
                    <p>探索コマンドでイベント、敵、報酬を見つけます。</p>
                  </article>
                  <article>
                    <span>03</span>
                    <h3>戦う</h3>
                    <p>攻撃、防御、逃走を選び、HPを見ながら勝利を目指します。</p>
                  </article>
                  <article>
                    <span>04</span>
                    <h3>成長する</h3>
                    <p>経験値とゴールドを集め、より危険な場所に挑戦します。</p>
                  </article>
                </div>
              </div>
            )}

            {activePanel === 'records' && (
              <div className="panel-content">
                <h2>冒険記録</h2>
                <div className="record-grid">
                  <div>
                    <small>Best Level</small>
                    <strong>--</strong>
                  </div>
                  <div>
                    <small>Enemies Defeated</small>
                    <strong>--</strong>
                  </div>
                  <div>
                    <small>Gold Found</small>
                    <strong>-- G</strong>
                  </div>
                </div>
                <p className="panel-note">
                  保存機能が有効になると、ここに最高到達レベルや討伐数が表示されます。
                </p>
              </div>
            )}

            {activePanel === 'settings' && (
              <div className="panel-content">
                <h2>設定</h2>
                <label className="setting-row">
                  <span>
                    <strong>Sound</strong>
                    <small>効果音とBGM</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(event) => setSoundEnabled(event.target.checked)}
                  />
                </label>
                <div className="setting-row setting-row-stack">
                  <span>
                    <strong>Difficulty</strong>
                    <small>遊びやすさを選択</small>
                  </span>
                  <div className="difficulty-control">
                    {(['Casual', 'Normal', 'Hard'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        className={difficulty === level ? 'selected' : ''}
                        onClick={() => setDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'credits' && (
              <div className="panel-content">
                <h2>Credits</h2>
                <p>
                  EASY RPG GAME v1.0.0
                  <br />
                  Mode: Single Player / Type: Browser RPG
                </p>
                <p className="panel-note">© 2026 EASY RPG GAME. All Rights Reserved.</p>
              </div>
            )}
          </section>

          <aside className="title-news" aria-label="Adventure board">
            <h2>Adventure Board</h2>
            <ul>
              <li>
                <strong>Today's Quest</strong>
                <span>森の奥で失われた紋章を探せ。</span>
              </li>
              <li>
                <strong>Monster Report</strong>
                <span>スライムの群れが北の街道に出現中。</span>
              </li>
              <li>
                <strong>Hint</strong>
                <span>HPが減ったら防御で立て直そう。</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default TitleScreen;
