import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Calendar, DollarSign } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ProjectData {
  _id: Id<"projects">;
  name: string;
  status: "Planning" | "In Progress" | "Completed" | "Cancelled";
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  venueIds?: Id<"venues">[];
}

interface ProjectTableProps {
  projects: ProjectData[];
  venueMap: Map<Id<"venues">, string>;
  contactMap: Map<Id<"contacts">, string>;
  projectToContacts: Map<Id<"projects">, Id<"contacts">[]>;
  onProjectSelect: (projectId: Id<"projects">) => void;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Planning":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Completed":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Cancelled":
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function formatCurrency(value: number | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectTable({
  projects,
  venueMap,
  contactMap,
  projectToContacts,
  onProjectSelect,
}: ProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<ProjectData>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2"
            >
              Project Name
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <button
            onClick={() => onProjectSelect(row.original._id)}
            className="font-medium hover:text-primary transition-colors text-left"
          >
            {row.getValue("name")}
          </button>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2"
            >
              Status
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn("border-0", getStatusBadgeClass(row.getValue("status")))}
          >
            {row.getValue("status")}
          </Badge>
        ),
      },
      {
        accessorKey: "venueIds",
        header: "Venues",
        cell: ({ row }) => {
          const venueIds = row.original.venueIds || [];
          const venueNames = venueIds
            .map((id) => venueMap.get(id))
            .filter(Boolean);
          if (venueNames.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm">
              {venueNames.slice(0, 2).join(", ")}
              {venueNames.length > 2 && (
                <span className="text-muted-foreground ml-1">
                  +{venueNames.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "people",
        header: "People",
        cell: ({ row }) => {
          const contactIds = projectToContacts.get(row.original._id) || [];
          const contactNames = contactIds
            .map((id) => contactMap.get(id))
            .filter(Boolean);
          if (contactNames.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm">
              {contactNames.slice(0, 2).join(", ")}
              {contactNames.length > 2 && (
                <span className="text-muted-foreground ml-1">
                  +{contactNames.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => {
          const date = row.getValue("startDate") as string | undefined;
          if (!date) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {date}
            </div>
          );
        },
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => {
          const date = row.getValue("endDate") as string | undefined;
          if (!date) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {date}
            </div>
          );
        },
      },
      {
        accessorKey: "budget",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2"
            >
              Budget
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const budget = row.getValue("budget") as number | undefined;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {formatCurrency(budget)}
            </div>
          );
        },
      },
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.getValue("description") as string | undefined;
          if (!description)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm text-muted-foreground max-w-xs truncate">
              {description}
            </div>
          );
        },
      },
    ],
    [onProjectSelect, venueMap],
  );

  const table = useReactTable({
    data: projects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b bg-background flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s)
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onProjectSelect(row.original._id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
