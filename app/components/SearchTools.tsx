'use client';

import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Button, 
  Tabs, 
  Box,
  Text,
  Title,
  Paper,
  Stack,
  Group,
  ActionIcon,
  Badge,
  Tooltip,
  Divider
} from '@mantine/core';
import { 
  IconSearch, 
  IconBookmark, 
  IconHistory, 
  IconTrash,
  IconArrowRight,
  IconBookmarkFilled,
  IconExternalLink
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface SearchToolsProps {
  fileId: string | null;
  currentOffset: number;
  onGoToOffset: (offset: number) => void;
}

interface Bookmark {
  id: string;
  offset: number;
  label: string;
  timestamp: number;
}

interface HistoryItem {
  offset: number;
  timestamp: number;
}

interface SearchResult {
  offset: number;
  offset_hex: string;
  context: string;
  context_ascii: string;
}

interface SearchResponse {
  results: SearchResult[];
  count: number;
  error: string | null;
}

const SearchTools: React.FC<SearchToolsProps> = ({ fileId, currentOffset, onGoToOffset }) => {
  const [searchMode, setSearchMode] = useState<'hex' | 'text'>('hex');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('search');
  const [targetOffset, setTargetOffset] = useState('');

  // Load bookmarks and history from localStorage
  useEffect(() => {
    if (fileId) {
      const savedBookmarks = localStorage.getItem(`bookmarks-${fileId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }

      const savedHistory = localStorage.getItem(`history-${fileId}`);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, [fileId]);

  // Save bookmarks to localStorage
  useEffect(() => {
    if (fileId && bookmarks.length > 0) {
      localStorage.setItem(`bookmarks-${fileId}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, fileId]);

  // Save history to localStorage
  useEffect(() => {
    if (fileId && history.length > 0) {
      localStorage.setItem(`history-${fileId}`, JSON.stringify(history));
    }
  }, [history, fileId]);

  // Add to history when navigating to a new offset
  useEffect(() => {
    if (fileId && currentOffset !== undefined && currentOffset >= 0) {
      // Only add to history if it's different from the last entry
      const lastHistoryItem = history[0];
      if (!lastHistoryItem || lastHistoryItem.offset !== currentOffset) {
        const newHistory = [
          { offset: currentOffset, timestamp: Date.now() },
          ...history,
        ].slice(0, 20); // Limit history to 20 items
        setHistory(newHistory);
      }
    }
  }, [currentOffset, fileId]);

  const addBookmark = () => {
    if (fileId && currentOffset !== undefined) {
      const label = prompt('Enter a label for this bookmark:', `Offset 0x${currentOffset.toString(16).toUpperCase()}`);
      if (label) {
        const newBookmark: Bookmark = {
          id: Date.now().toString(),
          offset: currentOffset,
          label: label,
          timestamp: Date.now()
        };
        setBookmarks([newBookmark, ...bookmarks]);
        notifications.show({
          title: 'Bookmark Added',
          message: `Added bookmark at offset 0x${currentOffset.toString(16).toUpperCase()}`,
          color: 'blue'
        });
      }
    }
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleSearch = async () => {
    if (!fileId || !searchQuery) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // For hex search, ensure the input is valid hex
      if (searchMode === 'hex') {
        const hexRegex = /^[0-9A-Fa-f]+$/;
        if (!hexRegex.test(searchQuery)) {
          throw new Error('Invalid hex value. Only hexadecimal characters (0-9, A-F) are allowed.');
        }
      }

      // Send search request to backend
      const formData = new FormData();
      formData.append('file_id', fileId);
      
      // For hex search, just use the hex pattern directly
      // For text search, convert to hex
      if (searchMode === 'hex') {
        formData.append('pattern', searchQuery);
      } else {
        // Convert text to hex
        const hexArray = [];
        for (let i = 0; i < searchQuery.length; i++) {
          hexArray.push(searchQuery.charCodeAt(i).toString(16).padStart(2, '0'));
        }
        formData.append('pattern', hexArray.join(''));
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        body: formData
      });

      const data: SearchResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSearchResults(data.results);
      
      if (data.results.length === 0) {
        notifications.show({
          title: 'No Results',
          message: 'No matches found for your search query.',
          color: 'yellow'
        });
      } else {
        notifications.show({
          title: 'Search Complete',
          message: `Found ${data.results.length} matches.`,
          color: 'green'
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Search Error',
        message: error instanceof Error ? error.message : 'An error occurred during search',
        color: 'red'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToOffset = () => {
    try {
      let offset: number;
      
      // Handle hex input
      if (targetOffset.toLowerCase().startsWith('0x')) {
        offset = parseInt(targetOffset.substring(2), 16);
      } 
      // Handle decimal input
      else {
        offset = parseInt(targetOffset, 10);
      }
      
      if (isNaN(offset) || offset < 0) {
        throw new Error('Invalid offset. Please enter a valid number.');
      }
      
      onGoToOffset(offset);
      notifications.show({
        title: 'Navigation',
        message: `Jumped to offset ${offset} (0x${offset.toString(16).toUpperCase()})`,
        color: 'blue'
      });
    } catch (error) {
      notifications.show({
        title: 'Navigation Error',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red'
      });
    }
  };

  return (
    <Paper p="md" withBorder h="100%">
      <Stack gap="md">
        <Title order={4}>Search & Navigation</Title>
        
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              Search
            </Tabs.Tab>
            <Tabs.Tab value="bookmarks" leftSection={<IconBookmark size={16} />}>
              Bookmarks
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search" pt="xs">
            <Stack gap="sm">
              <Tabs
                value={searchMode}
                onChange={(value) => setSearchMode(value as 'hex' | 'text')}
              >
                <Tabs.List>
                  <Tabs.Tab value="hex">Hex</Tabs.Tab>
                  <Tabs.Tab value="text">Text</Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <TextInput
                label={searchMode === 'hex' ? 'Hex Pattern' : 'Text Pattern'}
                placeholder={searchMode === 'hex' ? '53514C697465' : 'SQLite'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rightSection={
                  <ActionIcon 
                    variant="filled" 
                    color="blue" 
                    onClick={handleSearch}
                    loading={isSearching}
                    disabled={!fileId || !searchQuery}
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                }
              />

              <Divider label="Jump to Offset" labelPosition="center" />

              <TextInput
                placeholder="Enter offset (e.g., 0xFF or 255)"
                label="Go to Offset"
                value={targetOffset}
                onChange={(e) => setTargetOffset(e.target.value)}
                rightSection={
                  <ActionIcon 
                    variant="filled" 
                    color="blue" 
                    onClick={handleGoToOffset}
                    disabled={!fileId || !targetOffset}
                  >
                    <IconArrowRight size={16} />
                  </ActionIcon>
                }
              />

              <Button 
                fullWidth
                variant="light"
                leftSection={<IconBookmarkFilled size={16} />}
                onClick={addBookmark}
                disabled={!fileId || currentOffset === undefined}
              >
                Bookmark Current Offset
              </Button>

              {searchResults.length > 0 && (
                <Box>
                  <Text fw={500} mb="xs">Search Results ({searchResults.length})</Text>
                  <Stack gap="xs">
                    {searchResults.map((result, index) => (
                      <Paper key={index} p="xs" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Badge color="blue">Offset: {result.offset_hex}</Badge>
                          <Button 
                            variant="light" 
                            size="compact" 
                            onClick={() => onGoToOffset(result.offset)}
                          >
                            Go to
                          </Button>
                        </Group>
                        <Text size="xs" ff="monospace" mb="xs">
                          Context: {result.context.replace(/(.{2})/g, '$1 ')}
                        </Text>
                        <Text size="xs" ff="monospace">
                          ASCII: {result.context_ascii}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="bookmarks" pt="xs">
            {bookmarks.length === 0 ? (
              <Text c="dimmed">No bookmarks yet. Add bookmarks to keep track of important offsets.</Text>
            ) : (
              <Stack gap="xs">
                {bookmarks.map(bookmark => (
                  <Paper key={bookmark.id} p="xs" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text fw={500}>{bookmark.label}</Text>
                        <Text size="xs" c="dimmed">
                          Offset: 0x{bookmark.offset.toString(16).toUpperCase()} ({bookmark.offset})
                        </Text>
                        <Text size="xs" c="dimmed">
                          Added: {formatTimestamp(bookmark.timestamp)}
                        </Text>
                      </Box>
                      <Group gap="xs">
                        <Tooltip label="Go to offset">
                          <ActionIcon 
                            color="blue" 
                            variant="light"
                            onClick={() => onGoToOffset(bookmark.offset)}
                          >
                            <IconExternalLink size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Remove bookmark">
                          <ActionIcon 
                            color="red" 
                            variant="light" 
                            onClick={() => removeBookmark(bookmark.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="xs">
            {history.length === 0 ? (
              <Text c="dimmed">No navigation history yet.</Text>
            ) : (
              <Stack gap="xs">
                {history.map((item, index) => (
                  <Paper key={index} p="xs" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text>Offset: 0x{item.offset.toString(16).toUpperCase()} ({item.offset})</Text>
                        <Text size="xs" c="dimmed">{formatTimestamp(item.timestamp)}</Text>
                      </Box>
                      <ActionIcon 
                        color="blue" 
                        variant="light"
                        onClick={() => onGoToOffset(item.offset)}
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  );
};

export default SearchTools; 