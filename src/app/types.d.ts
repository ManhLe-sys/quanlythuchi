declare module '../context/AuthContext' {
  interface User {
    fullName: string;
    email: string;
    role: string;
  }

  interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;
  }

  export function useAuth(): AuthContextType;
  export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element;
} 