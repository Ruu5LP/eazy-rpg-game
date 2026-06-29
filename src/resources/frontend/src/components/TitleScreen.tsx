import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Panel = 'howto' | 'credits';

const TitleScreen: React.FC = () => {
  const [activePanel, setActivePanel] = useState<Panel>('howto');
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    navigate('/game');
    setIsStarting(false);
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
            <button className="title-action title-action-primary" onClick={handleStart} disabled={isStarting}>
              <span className="action-mark">▶</span>
              <span>
                <strong>GAME START</strong>
                <small>冒険を始める</small>
              </span>
            </button>

            <button className="title-action" onClick={() => setActivePanel('howto')}>
              <span className="action-mark">?</span>
              <span>
                <strong>HOW TO PLAY</strong>
                <small>操作とルールを見る</small>
              </span>
            </button>

            <button className="title-action" onClick={() => setActivePanel('credits')}>
              <span className="action-mark">★</span>
              <span>
                <strong>CREDITS</strong>
                <small>制作者情報</small>
              </span>
            </button>
          </nav>

          <section className="title-panel">
            <div className="title-tabs" role="tablist" aria-label="Title information">
              <button className={panelButtonClass('howto')} onClick={() => setActivePanel('howto')}>
                Guide
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
                    <h3>アカウント作成</h3>
                    <p>メールアドレスで登録してログインします。</p>
                  </article>
                  <article>
                    <span>02</span>
                    <h3>探索する</h3>
                    <p>「すすむ」コマンドで探索し、敵や宝を見つけます。</p>
                  </article>
                  <article>
                    <span>03</span>
                    <h3>戦う</h3>
                    <p>攻撃・防御・逃走を選びながらHPを管理して勝利を目指します。</p>
                  </article>
                  <article>
                    <span>04</span>
                    <h3>成長する</h3>
                    <p>経験値でレベルアップ。Lv5でボスに挑戦できます。</p>
                  </article>
                </div>
              </div>
            )}

            {activePanel === 'credits' && (
              <div className="panel-content">
                <h2>Credits</h2>
                <p>
                  EASY RPG GAME v0.1
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
                <span>森の奥の魔王を討伐せよ。</span>
              </li>
              <li>
                <strong>Monster Report</strong>
                <span>スライムの群れが北の街道に出現中。</span>
              </li>
              <li>
                <strong>Hint</strong>
                <span>HPが減ったら防御か宿屋で回復しよう。</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default TitleScreen;
