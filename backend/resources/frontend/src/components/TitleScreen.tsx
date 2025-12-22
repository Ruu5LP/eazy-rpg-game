import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TitleScreen: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-200 font-sans">
      <div className="max-w-md w-full bg-gray-100 shadow-2xl rounded-xl overflow-hidden border border-gray-300">
        {/* Main Card */}
        <div className="bg-white p-8 mb-0 text-center rounded-none border-none">
          <div className="mb-8">
            <span className="text-6xl inline-block mb-4">⚔️</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2 tracking-tight">
              EASY RPG
            </h1>
            <p className="text-xl text-gray-500 font-medium">
              Browser Adventure Game
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center max-w-lg mx-auto mb-12">
            <button
              onClick={handleStart}
              className="btn-primary text-lg w-full"
            >
              <span>▶</span>
              <span>GAME START</span>
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="btn-secondary text-lg w-full md:w-auto flex-1"
            >
              <span>?</span>
              <span>{showHelp ? 'CLOSE HELP' : 'HOW TO PLAY'}</span>
            </button>
          </div>

          {/* Help Section */}
          {showHelp && (
            <div className="bg-blue-50 rounded-xl p-8 mb-8 text-left animate-fade-in border border-blue-100">
              <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
                冒険の始め方
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">01</span> 名前を決める
                  </h3>
                  <p className="text-gray-600 text-sm">
                    まずはあなたの分身となるヒーローの名前を入力してください。
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">02</span> 探索する
                  </h3>
                  <p className="text-gray-600 text-sm">
                    「すすむ」ボタンで世界を探索し、モンスターを見つけましょう。
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">03</span> 戦う
                  </h3>
                  <p className="text-gray-600 text-sm">
                    モンスターと戦って経験値を獲得し、レベルアップを目指します。
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">04</span> 強くなる
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ステータスを上げて、より強力なボスに挑戦しましょう。
                  </p>
                </div>
              </div>

              <div className="border-t border-blue-200 pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-red-500 text-2xl mb-1 font-bold">HP</div>
                    <div className="text-gray-500 text-xs">体力</div>
                  </div>
                  <div>
                    <div className="text-blue-500 text-2xl mb-1 font-bold">ATK</div>
                    <div className="text-gray-500 text-xs">攻撃力</div>
                  </div>
                  <div>
                    <div className="text-green-500 text-2xl mb-1 font-bold">DEF</div>
                    <div className="text-gray-500 text-xs">防御力</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="border-t border-gray-100 pt-8 text-gray-400 text-sm">
            <div className="flex justify-center gap-8 mb-4">
              <div>
                <span className="block text-xs uppercase tracking-wider mb-1">Version</span>
                <span className="font-bold text-gray-600">1.0.0</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider mb-1">Type</span>
                <span className="font-bold text-gray-600">Browser RPG</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider mb-1">Mode</span>
                <span className="font-bold text-gray-600">Single Player</span>
              </div>
            </div>
            <p>© 2025 EASY RPG GAME. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
