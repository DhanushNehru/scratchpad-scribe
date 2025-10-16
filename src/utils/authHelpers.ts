interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

type SetUser = (user: User) => void;

export const handleAuthResponse = (
  data: AuthResponse,
  setUser: SetUser,
  TOKEN_KEY: string,
  USER_KEY: string
) => {
  const { token, user: userData } = data;

  if (!token) {
    throw new Error("No token returned from server");
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  setUser(userData);

  return { success: true, user: userData };
};
