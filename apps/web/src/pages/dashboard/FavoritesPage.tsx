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
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const data = await api.favorites.list();
        setFavorites(data);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  const handleRemove = async (vehicleId: string) => {
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-500 mt-1">
            {favorites.length} saved vehicle{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <Car className="w-4 h-4" />
          Browse More
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Save vehicles you're interested in by clicking the heart icon. They'll appear here for easy access.
          </p>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            <Car className="w-5 h-5" />
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
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link to={`/vehicles/${favorite.vehicle.id}`}>
                <div className="relative aspect-[16/10] bg-gray-100">
                  <img
                    src={favorite.vehicle.images[0] || '/placeholder-car.jpg'}
                    alt={`${favorite.vehicle.year} ${favorite.vehicle.make} ${favorite.vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold',
                      favorite.vehicle.status === 'AVAILABLE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {favorite.vehicle.status === 'AVAILABLE' ? 'Available' : favorite.vehicle.status}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/vehicles/${favorite.vehicle.id}`}>
                  <h3 className="font-bold text-gray-900 hover:text-primary transition-colors">
                    {favorite.vehicle.year} {favorite.vehicle.make} {favorite.vehicle.model}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {favorite.vehicle.category} &bull; {favorite.vehicle.seats} seats &bull; {favorite.vehicle.transmission}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${favorite.vehicle.dailyRate}
                    </span>
                    <span className="text-gray-500 text-sm">/day</span>
                  </div>

                  <button
                    onClick={() => handleRemove(favorite.vehicle.id)}
                    disabled={removingId === favorite.vehicle.id}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {removingId === favorite.vehicle.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
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
