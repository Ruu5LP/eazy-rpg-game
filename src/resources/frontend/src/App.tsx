import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuRPG from './components/MenuRPG';
import TitleScreen from './components/TitleScreen';
import { apiService } from './services/api';

function App() {
  const handleCommand = async (command: string): Promise<string> => {
    try {
      const response = await apiService.executeCommand(command);
      return response.message;
    } catch (error) {
      if (error instanceof Error) {
        return `接続エラー: ${error.message}\n\nバックエンドAPIが起動していることを確認してください。`;
      }
      return '不明なエラーが発生しました';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/game" element={<MenuRPG onCommand={handleCommand} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
