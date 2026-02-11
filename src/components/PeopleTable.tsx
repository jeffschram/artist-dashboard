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
import { ArrowUpDown, ChevronDown, Mail, Phone, Building2, Briefcase } from "lucide-react";
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
import { getPersonTypeBadgeClass } from "@/lib/personTypes";
import { cn } from "@/lib/utils";

interface PersonData {
  _id: Id<"contacts">;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  types?: string[];
  venueIds?: Id<"venues">[];
  notes?: string;
}

interface PeopleTableProps {
  contacts: PersonData[];
  venueMap: Map<Id<"venues">, string>;
  projectMap: Map<Id<"projects">, string>;
  contactToProjects: Map<Id<"contacts">, Id<"projects">[]>;
  onContactSelect: (contactId: Id<"contacts">) => void;
}

export function PeopleTable({
  contacts,
  venueMap,
  projectMap,
  contactToProjects,
  onContactSelect,
}: PeopleTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<PersonData>[]>(
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
              Name
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <button
            onClick={() => onContactSelect(row.original._id)}
            className="font-medium hover:text-primary transition-colors text-left"
          >
            {row.getValue("name")}
          </button>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2"
            >
              Role
              <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const role = row.getValue("role") as string | undefined;
          if (!role) return <span className="text-muted-foreground">—</span>;
          return <div className="text-sm">{role}</div>;
        },
      },
      {
        accessorKey: "types",
        header: "Types",
        cell: ({ row }) => {
          const types = row.original.types || [];
          if (types.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {types.slice(0, 2).map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={cn("text-xs border-0", getPersonTypeBadgeClass(type))}
                >
                  {type}
                </Badge>
              ))}
              {types.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{types.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const email = row.getValue("email") as string | undefined;
          if (!email) return <span className="text-muted-foreground">—</span>;
          return (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" />
              {email}
            </a>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phone = row.getValue("phone") as string | undefined;
          if (!phone) return <span className="text-muted-foreground">—</span>;
          return (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {phone}
            </a>
          );
        },
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
            <div className="flex items-center gap-1.5 text-sm">
              <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>
                {venueNames.slice(0, 2).join(", ")}
                {venueNames.length > 2 && (
                  <span className="text-muted-foreground ml-1">
                    +{venueNames.length - 2}
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        id: "projects",
        header: "Projects",
        cell: ({ row }) => {
          const projectIds = contactToProjects.get(row.original._id) || [];
          const projectNames = projectIds
            .map((id) => projectMap.get(id))
            .filter(Boolean);
          if (projectNames.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>
                {projectNames.slice(0, 2).join(", ")}
                {projectNames.length > 2 && (
                  <span className="text-muted-foreground ml-1">
                    +{projectNames.length - 2}
                  </span>
                )}
              </span>
            </div>
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
    [onContactSelect, venueMap, projectMap, contactToProjects],
  );

  const table = useReactTable({
    data: contacts,
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
                  onClick={() => onContactSelect(row.original._id)}
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
                  No people found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
