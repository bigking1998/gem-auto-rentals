# Gem Auto Rentals - Custom React Hooks

This directory contains custom React hooks for data fetching, caching, and state management.

## Core Hooks

### useQuery

A custom hook for data fetching with caching support, similar to React Query but simpler.

```tsx
import { useQuery } from '@/hooks';

function VehiclesPage() {
  const { data, isLoading, error, refetch, invalidate } = useQuery(
    () => api.vehicles.list(),
    {
      cacheKey: 'vehicles',
      ttl: 300000, // 5 minutes
      staleWhileRevalidate: true,
      onSuccess: (data) => console.log('Loaded:', data),
      onError: (error) => console.error('Failed:', error),
    }
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return <VehicleGrid vehicles={data} />;
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cacheKey` | `string` | required | Unique cache key for this query |
| `ttl` | `number` | `300000` | Cache time-to-live in milliseconds |
| `enabled` | `boolean` | `true` | Whether to enable the query |
| `fetchOnMount` | `boolean` | `true` | Fetch data when component mounts |
| `staleWhileRevalidate` | `boolean` | `true` | Return stale data while fetching |
| `onSuccess` | `(data: T) => void` | - | Callback on successful fetch |
| `onError` | `(error: Error) => void` | - | Callback on fetch error |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| undefined` | The fetched data |
| `isLoading` | `boolean` | True during initial load |
| `isRevalidating` | `boolean` | True during background revalidation |
| `error` | `Error \| null` | Any error that occurred |
| `refetch` | `() => Promise<void>` | Manually refetch data |
| `invalidate` | `() => void` | Invalidate the cache |

---

### useMutation

A hook for mutations (POST, PUT, DELETE) with automatic cache invalidation.

```tsx
import { useMutation } from '@/hooks';

function CreateBookingButton() {
  const { mutate, isLoading, error } = useMutation(
    (data: CreateBookingData) => api.bookings.create(data),
    {
      invalidateKeys: ['bookings', 'vehicles'],
      onSuccess: (booking) => {
        toast.success('Booking created!');
        navigate(`/bookings/${booking.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  return (
    <Button
      onClick={() => mutate({ vehicleId: '123', startDate, endDate })}
      loading={isLoading}
    >
      Book Now
    </Button>
  );
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `invalidateKeys` | `string[]` | Cache keys to invalidate on success |
| `onSuccess` | `(data: T, variables: V) => void` | Callback on success |
| `onError` | `(error: Error, variables: V) => void` | Callback on error |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `mutate` | `(variables: V) => Promise<T \| undefined>` | Execute the mutation |
| `data` | `T \| undefined` | The mutation result |
| `isLoading` | `boolean` | True during mutation |
| `error` | `Error \| null` | Any error that occurred |
| `reset` | `() => void` | Reset mutation state |

---

### usePaginatedQuery

A hook for paginated data fetching with navigation helpers.

```tsx
import { usePaginatedQuery } from '@/hooks';

function CustomerList() {
  const {
    data,
    isLoading,
    page,
    setPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedQuery(
    (page, pageSize) => api.customers.list({ page, pageSize }),
    {
      baseCacheKey: 'customers',
      pageSize: 20,
    }
  );

  return (
    <div>
      {data?.items.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}

      <div className="flex gap-2">
        <Button onClick={prevPage} disabled={!hasPrevPage}>
          Previous
        </Button>
        <span>Page {page}</span>
        <Button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

## Domain-Specific Hooks

### useVehicles

Fetch a list of vehicles with optional filters.

```tsx
import { useVehicles } from '@/hooks';

function VehicleGrid() {
  const { data, isLoading, error } = useVehicles({
    category: 'SUV',
    minPrice: 50,
    maxPrice: 150,
  });

  if (isLoading) return <VehicleGridSkeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.items.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

### useVehicle

Fetch a single vehicle by ID.

```tsx
import { useVehicle } from '@/hooks';

function VehicleDetailPage({ id }: { id: string }) {
  const { data: vehicle, isLoading, error } = useVehicle(id);

  if (isLoading) return <VehicleDetailSkeleton />;
  if (error) return <ErrorPage error={error} />;

  return <VehicleDetail vehicle={vehicle} />;
}
```

### useVehicleAvailability

Check vehicle availability for date range.

```tsx
import { useVehicleAvailability } from '@/hooks';

function AvailabilityChecker({ vehicleId }: { vehicleId: string }) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data, isLoading } = useVehicleAvailability(
    vehicleId,
    startDate,
    endDate
  );

  return (
    <div>
      <DatePicker value={startDate} onChange={setStartDate} />
      <DatePicker value={endDate} onChange={setEndDate} />

      {data?.available ? (
        <Badge variant="success">Available</Badge>
      ) : (
        <Badge variant="destructive">Not Available</Badge>
      )}
    </div>
  );
}
```

### usePrefetchVehicles

Prefetch vehicles for faster navigation.

```tsx
import { usePrefetchVehicles } from '@/hooks';

function Navigation() {
  const prefetch = usePrefetchVehicles();

  return (
    <Link
      to="/vehicles"
      onMouseEnter={prefetch} // Prefetch on hover
    >
      Browse Vehicles
    </Link>
  );
}
```

---

### useBookings

Fetch user's bookings with optional filters.

```tsx
import { useBookings } from '@/hooks';

function MyBookings() {
  const { data, isLoading } = useBookings({
    status: 'ACTIVE',
  });

  return (
    <div>
      {data?.items.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
```

### useBooking

Fetch a single booking by ID.

```tsx
import { useBooking } from '@/hooks';

function BookingDetailPage({ id }: { id: string }) {
  const { data: booking, isLoading } = useBooking(id);

  if (isLoading) return <BookingDetailSkeleton />;

  return <BookingDetail booking={booking} />;
}
```

### useCreateBooking

Create a new booking.

```tsx
import { useCreateBooking } from '@/hooks';

function BookingForm() {
  const { mutate: createBooking, isLoading } = useCreateBooking();

  const handleSubmit = async (data: CreateBookingData) => {
    const booking = await createBooking(data);
    if (booking) {
      navigate(`/bookings/${booking.id}/confirmation`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" loading={isLoading}>
        Complete Booking
      </Button>
    </form>
  );
}
```

### useCancelBooking

Cancel an existing booking.

```tsx
import { useCancelBooking } from '@/hooks';

function CancelButton({ bookingId }: { bookingId: string }) {
  const { mutate: cancel, isLoading } = useCancelBooking();

  return (
    <Button
      variant="destructive"
      onClick={() => cancel(bookingId)}
      loading={isLoading}
    >
      Cancel Booking
    </Button>
  );
}
```

---

## Caching

### Cache Keys

Use consistent cache keys defined in `@/lib/cache`:

```tsx
import { cacheKeys } from '@/lib/cache';

cacheKeys.vehicles()           // 'vehicles'
cacheKeys.vehicle('123')       // 'vehicle:123'
cacheKeys.bookings()           // 'bookings'
cacheKeys.booking('456')       // 'booking:456'
cacheKeys.availability('123', start, end)  // 'availability:123:...'
```

### Cache TTL

Predefined TTL values:

```tsx
import { cacheTTL } from '@/lib/cache';

cacheTTL.short      // 60000 (1 minute)
cacheTTL.medium     // 300000 (5 minutes)
cacheTTL.long       // 900000 (15 minutes)
cacheTTL.veryLong   // 3600000 (1 hour)
```

### Manual Cache Operations

```tsx
import { apiCache } from '@/lib/cache';

// Get cache stats
const stats = apiCache.getStats();
console.log(stats.size, stats.keys);

// Invalidate specific key
apiCache.invalidate('vehicles');

// Invalidate by pattern
apiCache.invalidatePattern('vehicle:');  // All vehicle:* keys
apiCache.invalidatePattern(/booking:/);  // Regex pattern

// Clear entire cache
apiCache.clear();
```

---

## Best Practices

1. **Use domain hooks**: Prefer `useVehicles()` over raw `useQuery()` for consistency
2. **Handle loading states**: Always show loading indicators
3. **Handle errors**: Display user-friendly error messages
4. **Invalidate on mutations**: Use `invalidateKeys` to keep data fresh
5. **Prefetch on hover**: Improve perceived performance with prefetching
6. **Use appropriate TTL**: Shorter for frequently changing data, longer for static

---

## Examples

### Complete Page Example

```tsx
import { useVehicles, useCreateBooking, useInvalidateVehicles } from '@/hooks';
import { VehicleCard, VehicleGridSkeleton, Button } from '@/components';

export default function VehiclesPage() {
  const { data, isLoading, error, refetch } = useVehicles();
  const invalidate = useInvalidateVehicles();
  const { mutate: createBooking } = useCreateBooking();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error.message}</p>
        <Button onClick={refetch} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Available Vehicles</h1>
        <Button onClick={invalidate} variant="outline">
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <VehicleGridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.items.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onBook={() => createBooking({ vehicleId: vehicle.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```
