import MenuRPG from './components/MenuRPG';
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

  return <MenuRPG onCommand={handleCommand} />;
}

export default App;
