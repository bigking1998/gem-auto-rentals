import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Car, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { cn } from '@/lib/utils';

interface FavoriteVehicle {
  id: string;
  vehicleId: string;
  createdAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    dailyRate: number;
    status: string;
    images: string[];
    seats: number;
    transmission: string;
    fuelType: string;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        setError(null);
        const data = await api.favorites.list();
        setFavorites(data);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  const handleRemove = async (favorite: FavoriteVehicle) => {
    const vehicleId = favorite.vehicleId;
    setRemovingId(vehicleId);
    try {
      await removeFavorite(vehicleId);
      setFavorites((prev) => prev.filter((f) => f.vehicleId !== vehicleId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="mb-4 font-medium text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-1 text-gray-500">
            {favorites.length} saved vehicle{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/vehicles"
          className="bg-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
        >
          <Car className="h-4 w-4" />
          Browse More
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Heart className="mx-auto mb-4 h-16 w-16 text-gray-200" />
          <h2 className="mb-2 text-xl font-bold text-gray-900">No favorites yet</h2>
          <p className="mx-auto mb-6 max-w-md text-gray-500">
            Save vehicles you&apos;re interested in by clicking the heart icon. They&apos;ll appear
            here for easy access.
          </p>
          <Link
            to="/vehicles"
            className="bg-primary inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <Car className="h-5 w-5" />
            Browse Vehicles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <Link to={`/vehicles/${favorite.vehicle.id}`}>
                <div className="relative aspect-[16/10] bg-gray-100">
                  <img
                    src={favorite.vehicle.images[0] || '/placeholder-car.svg'}
                    alt={`${favorite.vehicle.year} ${favorite.vehicle.make} ${favorite.vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-bold',
                        favorite.vehicle.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {favorite.vehicle.status === 'AVAILABLE'
                        ? 'Available'
                        : favorite.vehicle.status}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/vehicles/${favorite.vehicle.id}`}>
                  <h3 className="hover:text-primary font-bold text-gray-900 transition-colors">
                    {favorite.vehicle.year} {favorite.vehicle.make} {favorite.vehicle.model}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {favorite.vehicle.category} &bull; {favorite.vehicle.seats} seats &bull;{' '}
                  {favorite.vehicle.transmission}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${favorite.vehicle.dailyRate}
                    </span>
                    <span className="text-sm text-gray-500">/day</span>
                  </div>

                  <button
                    onClick={() => handleRemove(favorite)}
                    disabled={removingId === favorite.vehicleId}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    {removingId === favorite.vehicleId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
