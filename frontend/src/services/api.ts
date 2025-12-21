const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface GameState {
  player: {
    id: number;
    name: string;
    level: number;
    hp: number;
    max_hp: number;
    mp: number;
    max_mp: number;
    attack: number;
    defense: number;
    experience: number;
    gold: number;
  } | null;
  inBattle: boolean;
  currentEnemy: {
    name: string;
    hp: number;
    max_hp: number;
    level: number;
  } | null;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  game_state?: GameState;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async executeCommand(command: string): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/command', 'POST', { command });
  }

  async getGameState(): Promise<GameState> {
    return this.request<GameState>('/api/game/state');
  }

  async startNewGame(playerName: string): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/new', 'POST', { player_name: playerName });
  }

  async saveGame(): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/save', 'POST');
  }

  async loadGame(): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/load', 'POST');
  }
}

export const apiService = new ApiService();
