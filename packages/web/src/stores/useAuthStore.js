import { create } from 'zustand';
import useHierarchyStore from './useHierarchyStore';
import useInstanceStore from './useInstanceStore';

export const useAuthStore = create(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isSuperAdmin: false, // Add super admin flag
      setUser: (user) => {
        set({ user, isSuperAdmin: user ? user.isSuperAdmin : false });
      },
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            // After login, check the full session to get user and org data
            await get().checkAuth();
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
      },

      register: async (email, password, { useMagicLink = false } = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, useMagicLink }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            // If using magic link, don't set user, just return the message
            if (useMagicLink) {
                set({ isLoading: false });
                return data;
            }
             // After registration, check the full session to get user and org data
            await get().checkAuth();
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            // Clear both auth and instance stores
            set({ user: null, isSuperAdmin: false, isLoading: false, error: null });
            useInstanceStore.getState().clearInstance();
            useHierarchyStore.getState().clearHierarchy();
        }
      },
      acceptInvitation: async (token, password, { useMagicLink = false } = {}) => {
        set({ isLoading: true, error: null });
        try {
        const response = await fetch('/api/v1/auth/accept-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, useMagicLink }),
        });
            const data = await response.json();
        if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
        }
            // If using magic link, don't log in, just return the success message
            if (useMagicLink) {
                set({ isLoading: false });
                return data;
            }
            // Otherwise, log the user in by checking the session
            await get().checkAuth();
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
      },
      checkAuth: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch('/api/v1/auth/session');
            if (response.ok) {
                const { user, organization } = await response.json();
                set({ user, isSuperAdmin: user.isSuperAdmin, isAuthenticated: true, isLoading: false });
                if (organization) {
                    useInstanceStore.getState().setInstance(organization);
                } else {
                    useInstanceStore.getState().clearInstance();
                }
            } else {
                get().logout(); // If session is invalid, trigger a full logout
            }
        } catch (error) {
            console.log("Error checking auth", error);
            get().logout(); // On error, trigger a full logout
        }
      },
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Email verification failed.');
          }
          // Update user in store, don't need to re-fetch session
          set({ user: data, isLoading: false });
          useHierarchyStore.getState().fetchHierarchy();
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      resendVerificationCode: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/resend-verification', {
            method: 'POST',
          });
          const data = await response.json();
           if (!response.ok) {
            throw new Error(data.error || 'Failed to resend code.');
          }
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      forgotPassword: async (email) => {
        const response = await fetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to send password reset link.');
        }
        return response.json();
      },
      requestMagicLink: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to send magic link.');
          }
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      verifyMagicLink: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/v1/auth/magic-link/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Magic link login failed.');
          }
          // After magic link verification, check the full session
          await get().checkAuth();
          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      resetPassword: async ({ token, password }) => {
        const response = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to reset password.');
        }
        return response.json();
      },
    }),
); 

export default useAuthStore; 