import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuRPG from './components/MenuRPG';
import TitleScreen from './components/TitleScreen';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { apiService, type AuthUser, type CommandResponse } from './services/api';

function App() {
  const handleLogout = async () => {
    await apiService.logout();
  };

  const handleCommand = async (command: string): Promise<CommandResponse> => {
    try {
      const response =
        command === 'start'
          ? await apiService.startNewGame()
          : await apiService.executeCommand(command);

      if (response.game_state) {
        return response;
      }

      try {
        return {
          ...response,
          game_state: await apiService.getGameState(),
        };
      } catch {
        return response;
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: `接続エラー: ${error.message}\n\nバックエンドAPIが起動していることを確認してください。`,
        };
      }

      return {
        success: false,
        message: '不明なエラーが発生しました',
      };
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              {(user: AuthUser) => (
                <MenuRPG userName={user.name} onCommand={handleCommand} onLogout={handleLogout} />
              )}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
