import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SignalData {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  timeframe?: string;
  timestamp: string;
  source?: string;
  note?: string;
}

interface SignalsTableProps {
  signals: SignalData[];
}

export default function SignalsTable({ signals }: SignalsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<SignalData>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-semibold"
            >
              Ticker
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("ticker")}</div>
        ),
      },
      {
        accessorKey: "signalType",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-semibold"
            >
              Signal
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const signalType = row.getValue("signalType") as string;
          return (
            <Badge
              variant={signalType === "buy" ? "default" : "destructive"}
              className="text-xs"
            >
              {signalType.toUpperCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-semibold"
            >
              Price
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const price = row.getValue("price") as number;
          return (
            <div className="font-bold text-base">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
      {
        accessorKey: "timeframe",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-semibold"
            >
              Timeframe
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const timeframe = row.getValue("timeframe") as string | undefined;
          return (
            <Badge variant="outline" className="font-mono">
              {timeframe || "N/A"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "timestamp",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-semibold"
            >
              Date
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const timestamp = row.getValue("timestamp") as string;
          try {
            return (
              <div className="text-sm">
                {format(new Date(timestamp), "PPpp")}
              </div>
            );
          } catch {
            return <div className="text-sm text-muted-foreground">Invalid date</div>;
          }
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue("timestamp") as string).getTime();
          const dateB = new Date(rowB.getValue("timestamp") as string).getTime();
          return dateA - dateB;
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const source = row.getValue("source") as string | undefined;
          const note = row.original.note;
          return (
            <div className="text-sm text-muted-foreground">
              {source || "N/A"}
              {note && (
                <div className="text-xs mt-1 italic">{note}</div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: signals,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    maxMultiSortColCount: 3,
  });

  if (signals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No signals available</p>
        <p className="text-sm text-muted-foreground mt-1">
          Check back later for trading opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sorting.length > 0 && (
        <div className="text-xs text-muted-foreground p-3 border-t bg-muted/50">
          Sorted by: {sorting.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ", then "}
              <span className="font-medium">{s.id}</span> ({s.desc ? "desc" : "asc"})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
