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

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  requires_2fa?: boolean;
  email?: string;
  message: string;
  user?: AuthUser;
  dev_two_factor_code?: string | null;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const options: RequestInit = {
      method,
      credentials: 'include',
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
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.message ||
        Object.values(errorBody?.errors || {}).flat().join('\n') ||
        `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', 'POST', payload);
  }

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', 'POST', payload);
  }

  async verifyTwoFactor(code: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/verify-2fa', 'POST', { code });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/logout', 'POST');
  }

  async me(): Promise<{ user: AuthUser }> {
    return this.request<{ user: AuthUser }>('/api/auth/me');
  }

  async getGoogleRedirect(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/api/auth/google/redirect');
  }

  async executeCommand(command: string): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/command', 'POST', { command });
  }

  async getGameState(): Promise<GameState> {
    return this.request<GameState>('/api/game/state');
  }

  async startNewGame(): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/new', 'POST');
  }

  async saveGame(): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/save', 'POST');
  }

  async loadGame(): Promise<CommandResponse> {
    return this.request<CommandResponse>('/api/game/load', 'POST');
  }
}

export const apiService = new ApiService();
