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
import { ArrowUpDown, ChevronDown, ExternalLink } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { VenueData } from "./VenueCard";
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

interface VenueTableProps {
  venues: VenueData[];
  onVenueSelect: (venueId: Id<"venues">) => void;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Contacted":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "To Contact":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Ignore":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    case "Previous Client":
      return "bg-teal-100 text-teal-800 hover:bg-teal-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "Ultimate Dream Goal":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "Accessible":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Unconventional":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "For Review":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

export function VenueTable({ venues, onVenueSelect }: VenueTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<VenueData>[]>(
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
              Venue Name
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <button
            onClick={() => onVenueSelect(row.original._id)}
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
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2"
            >
              Category
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn(
              "border-0",
              getCategoryBadgeClass(row.getValue("category")),
            )}
          >
            {row.getValue("category")}
          </Badge>
        ),
      },
      {
        accessorKey: "locations",
        header: "Location",
        cell: ({ row }) => {
          const locations = row.original.locations;
          const firstLocation = locations[0];
          if (!firstLocation) return <span className="text-muted-foreground">—</span>;
          const parts = [
            firstLocation.city,
            firstLocation.state,
            firstLocation.country,
          ].filter(Boolean);
          return (
            <div className="text-sm">
              {parts.join(", ")}
              {locations.length > 1 && (
                <span className="text-muted-foreground ml-1">
                  +{locations.length - 1}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "url",
        header: "Website",
        cell: ({ row }) => {
          const url = row.getValue("url") as string | undefined;
          if (!url) return <span className="text-muted-foreground">—</span>;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Link
            </a>
          );
        },
      },
      {
        accessorKey: "contactIds",
        header: "Contacts",
        cell: ({ row }) => {
          const contactIds = row.original.contactIds || [];
          return (
            <span className="text-sm text-muted-foreground">
              {contactIds.length || "—"}
            </span>
          );
        },
      },
      {
        id: "notes",
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const notes = row.getValue("notes") as string | undefined;
          if (!notes) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm text-muted-foreground max-w-xs truncate">
              {notes}
            </div>
          );
        },
      },
    ],
    [onVenueSelect],
  );

  const table = useReactTable({
    data: venues,
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
                  onClick={() => onVenueSelect(row.original._id)}
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
                  No venues found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
