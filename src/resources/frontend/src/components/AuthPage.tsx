import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

type AuthMode = 'login' | 'register';
type AuthStep = 'credentials' | 'twoFactor';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/game';
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>(searchParams.get('twoFactor') ? 'twoFactor' : 'credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(() => (step === 'twoFactor' ? 'メールコード確認' : '冒険者アカウント'), [step]);

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevCode(null);
    setIsSubmitting(true);

    try {
      const response =
        mode === 'register'
          ? await apiService.register({
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
            })
          : await apiService.login({ email, password });

      setEmail(response.email || email);
      setMessage(response.message);
      setDevCode(response.dev_two_factor_code || null);
      setStep('twoFactor');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevCode(null);
    setIsSubmitting(true);

    try {
      await apiService.verifyTwoFactor(code);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コード確認に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiService.getGoogleRedirect();
      window.location.href = response.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Googleログインを開始できませんでした。');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-label={title}>
        <div className="auth-card-header">
          <button className="auth-back" type="button" onClick={() => navigate('/')}>
            ←
          </button>
          <div>
            <p>EASY RPG</p>
            <h1>{title}</h1>
          </div>
        </div>

        {step === 'credentials' && (
          <>
            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => setMode('login')}
              >
                ログイン
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => setMode('register')}
              >
                新規登録
              </button>
            </div>

            <form className="auth-form" onSubmit={handleCredentialsSubmit}>
              {mode === 'register' && (
                <label>
                  ユーザー名
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="username"
                    maxLength={32}
                    required
                  />
                </label>
              )}

              <label>
                メールアドレス
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                パスワード
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                />
              </label>

              {mode === 'register' && (
                <label>
                  パスワード確認
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              )}

              {error && <div className="auth-error">{error}</div>}
              {message && <div className="auth-message">{message}</div>}

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? '送信中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
              </button>
            </form>

            <div className="auth-divider">or</div>
            <button className="auth-google" type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>
              Googleで続ける
            </button>
          </>
        )}

        {step === 'twoFactor' && (
          <form className="auth-form" onSubmit={handleTwoFactorSubmit}>
            <p className="auth-copy">{email} に送信された6桁のコードを入力してください。</p>
            <label>
              認証コード
              <input
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-message">{message}</div>}
            {devCode && (
              <div className="auth-dev-code">
                Dev code: <strong>{devCode}</strong>
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? '確認中...' : 'コードを確認'}
            </button>
            <button className="auth-link-button" type="button" onClick={() => setStep('credentials')}>
              メールアドレスからやり直す
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default AuthPage;
