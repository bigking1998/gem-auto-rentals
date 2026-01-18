# @gem-auto-rentals/ui

Shared UI component library for Gem Auto Rentals, built with React, Tailwind CSS, and Radix UI primitives.

## Installation

```bash
pnpm add @gem-auto-rentals/ui
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@gem-auto-rentals/ui';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="gradient">Gradient</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon"><Icon /></Button>

// Loading state
<Button loading>Processing...</Button>

// As child (for routing)
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'link' \| 'destructive' \| 'gradient' \| 'success' \| 'warning'` | `'default'` | Visual style variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `asChild` | `boolean` | `false` | Render as child element (for composition) |

---

### Card

Container component with optional hover effects.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@gem-auto-rentals/ui';

<Card hover>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hover` | `boolean` | `false` | Enables lift and shadow effect on hover |

---

### Input

Form input component with consistent styling.

```tsx
import { Input } from '@gem-auto-rentals/ui';

<Input type="text" placeholder="Enter your name" />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled input" />
```

---

### Badge

Status indicator component.

```tsx
import { Badge } from '@gem-auto-rentals/ui';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>
```

---

### Avatar

User avatar component with fallback support.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@gem-auto-rentals/ui';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Dialog

Modal dialog component.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@gem-auto-rentals/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description text</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Select

Dropdown select component.

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@gem-auto-rentals/ui';

<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

---

### Accordion

Collapsible content sections.

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@gem-auto-rentals/ui';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>Content for section 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

---

### Table

Data table components.

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@gem-auto-rentals/ui';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell><Badge>Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### DataTable

Advanced data table with sorting, filtering, and pagination. Built on TanStack Table.

```tsx
import { DataTable, checkboxColumn } from '@gem-auto-rentals/ui';
import { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

const columns: ColumnDef<User>[] = [
  checkboxColumn,
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge>{row.getValue('status')}</Badge>,
  },
];

<DataTable
  columns={columns}
  data={users}
  searchKey="name"
  searchPlaceholder="Search users..."
  pageSize={10}
  pageSizeOptions={[10, 20, 50]}
  showPagination
  showSearch
  showRowCount
  emptyMessage="No users found."
  onRowClick={(row) => console.log(row.original)}
  isLoading={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | required | Column definitions |
| `data` | `TData[]` | required | Data array |
| `searchKey` | `string` | - | Column key for search filtering |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `pageSize` | `number` | `10` | Default items per page |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 50]` | Available page sizes |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `showSearch` | `boolean` | `true` | Show search input |
| `showRowCount` | `boolean` | `true` | Show row count |
| `emptyMessage` | `string` | `'No results found.'` | Message when no data |
| `onRowClick` | `(row: Row<TData>) => void` | - | Row click handler |
| `isLoading` | `boolean` | `false` | Show loading skeleton |

---

### Skeleton

Loading placeholder component.

```tsx
import { Skeleton } from '@gem-auto-rentals/ui';

// Basic skeleton
<Skeleton className="h-4 w-[200px]" />

// Card skeleton
<div className="space-y-2">
  <Skeleton className="h-[200px] w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

---

### Progress

Progress bar component.

```tsx
import { Progress } from '@gem-auto-rentals/ui';

<Progress value={33} />
<Progress value={66} className="h-2" />
```

---

### Label

Form label component.

```tsx
import { Label } from '@gem-auto-rentals/ui';

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

---

### Separator

Visual divider component.

```tsx
import { Separator } from '@gem-auto-rentals/ui';

<div>Content above</div>
<Separator className="my-4" />
<div>Content below</div>
```

---

### Pagination

Standalone pagination controls.

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@gem-auto-rentals/ui';

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## Utility Functions

### cn

Class name utility for merging Tailwind classes with conditional logic.

```tsx
import { cn } from '@gem-auto-rentals/ui';

// Basic usage
cn('text-red-500', 'font-bold')
// => 'text-red-500 font-bold'

// Conditional classes
cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class')

// Object syntax
cn({
  'text-red-500': hasError,
  'text-green-500': isSuccess,
})
```

---

## Design Tokens

The library uses CSS variables for theming. Configure these in your Tailwind config:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --destructive: 0 72% 51%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

---

## Best Practices

1. **Consistent spacing**: Use Tailwind's spacing scale (p-4, m-2, gap-4)
2. **Semantic variants**: Use appropriate button variants (destructive for delete, success for confirm)
3. **Loading states**: Always show loading states for async operations
4. **Accessibility**: All components support keyboard navigation and screen readers
5. **Responsive design**: Use responsive prefixes (sm:, md:, lg:) for different screen sizes

---

## License

MIT
