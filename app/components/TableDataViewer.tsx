"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Text,
  Group,
  TextInput,
  Select,
  Pagination,
  Paper,
  Stack,
  ActionIcon,
  Tooltip,
  Badge,
  Box,
  ScrollArea,
  Loader,
  Alert,
} from "@mantine/core";
import {
  IconSortAscending,
  IconSortDescending,
  IconSearch,
} from "@tabler/icons-react";
import { API_BASE_URL } from "../config";

interface TableDataViewerProps {
  fileId: string;
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    not_null: boolean;
    primary_key: boolean;
  }>;
}

interface TableData {
  data: any[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function TableDataViewer({
  fileId,
  tableName,
  columns,
}: TableDataViewerProps) {
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!fileId || !tableName) {
      setError("Missing required parameters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/table-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
          table_name: tableName,
          page,
          page_size: pageSize,
          sort_column: sortColumn,
          sort_direction: sortDirection,
          filters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch table data");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching table data"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId && tableName) {
      fetchData();
    }
  }, [fileId, tableName, page, pageSize, sortColumn, sortDirection, filters]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
    }
  };

  const handleFilter = (column: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setPage(1); // Reset to first page when filtering
  };

  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Stack align="center" justify="center" h={200}>
          <Loader size="md" />
          <Text>Loading table data...</Text>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Alert
          color="red"
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {tableName}
          </Text>
          <Group>
            <Text size="sm" c="dimmed">
              {data.total_count} total rows
            </Text>
            <Select
              size="xs"
              value={pageSize.toString()}
              onChange={(value) => setPageSize(Number(value))}
              data={[
                { value: "10", label: "10 rows" },
                { value: "25", label: "25 rows" },
                { value: "50", label: "50 rows" },
                { value: "100", label: "100 rows" },
              ]}
            />
          </Group>
        </Group>

        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {columns.map((column) => (
                  <Table.Th key={column.name}>
                    <Group gap="xs">
                      <Text>{column.name}</Text>
                      {column.primary_key && (
                        <Badge size="xs" color="blue">
                          PK
                        </Badge>
                      )}
                      {column.not_null && (
                        <Badge size="xs" color="yellow">
                          NN
                        </Badge>
                      )}
                      <Box style={{ flex: 1 }} />
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => handleSort(column.name)}
                      >
                        {sortColumn === column.name ? (
                          sortDirection === "ASC" ? (
                            <IconSortAscending size={14} />
                          ) : (
                            <IconSortDescending size={14} />
                          )
                        ) : (
                          <IconSortAscending size={14} />
                        )}
                      </ActionIcon>
                    </Group>
                    <TextInput
                      size="xs"
                      placeholder="Filter..."
                      rightSection={<IconSearch size={14} />}
                      onChange={(e) =>
                        handleFilter(column.name, e.target.value)
                      }
                      value={filters[column.name] || ""}
                    />
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.data.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {columns.map((column) => (
                    <Table.Td key={column.name}>
                      {typeof row[column.name] === "object"
                        ? JSON.stringify(row[column.name])
                        : String(row[column.name])}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="center">
          <Pagination
            value={page}
            onChange={setPage}
            total={data.total_pages}
            siblings={1}
            boundaries={1}
          />
        </Group>
      </Stack>
    </Paper>
  );
}
