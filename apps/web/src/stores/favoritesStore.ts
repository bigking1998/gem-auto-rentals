import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

interface FavoritesState {
  favoriteIds: string[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface FavoritesActions {
  addFavorite: (vehicleId: string) => Promise<void>;
  removeFavorite: (vehicleId: string) => Promise<void>;
  toggleFavorite: (vehicleId: string) => Promise<void>;
  isFavorited: (vehicleId: string) => boolean;
  fetchFavorites: () => Promise<void>;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState & FavoritesActions>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      addFavorite: async (vehicleId: string) => {
        // Optimistic update
        set((state) => ({
          favoriteIds: [...state.favoriteIds, vehicleId],
          error: null,
        }));

        try {
          await api.favorites.add(vehicleId);
        } catch (err) {
          // Revert on error
          set((state) => ({
            favoriteIds: state.favoriteIds.filter((id) => id !== vehicleId),
            error: err instanceof Error ? err.message : 'Failed to add favorite',
          }));
          throw err;
        }
      },

      removeFavorite: async (vehicleId: string) => {
        // Optimistic update
        const previousIds = get().favoriteIds;
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((id) => id !== vehicleId),
          error: null,
        }));

        try {
          await api.favorites.remove(vehicleId);
        } catch (err) {
          // Revert on error
          set({
            favoriteIds: previousIds,
            error: err instanceof Error ? err.message : 'Failed to remove favorite',
          });
          throw err;
        }
      },

      toggleFavorite: async (vehicleId: string) => {
        const isFavorited = get().favoriteIds.includes(vehicleId);
        if (isFavorited) {
          await get().removeFavorite(vehicleId);
        } else {
          await get().addFavorite(vehicleId);
        }
      },

      isFavorited: (vehicleId: string) => {
        return get().favoriteIds.includes(vehicleId);
      },

      fetchFavorites: async () => {
        set({ isLoading: true, error: null });

        try {
          const ids = await api.favorites.getIds();
          set({ favoriteIds: ids, isLoading: false, isInitialized: true });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to fetch favorites',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      clearFavorites: () => {
        set({ favoriteIds: [], isInitialized: false, error: null });
      },
    }),
    {
      name: 'gem-favorites-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
      }),
    }
  )
);

// Selector hooks
export const useFavoriteIds = () => useFavoritesStore((state) => state.favoriteIds);
export const useIsFavorited = (vehicleId: string) =>
  useFavoritesStore((state) => state.favoriteIds.includes(vehicleId));
