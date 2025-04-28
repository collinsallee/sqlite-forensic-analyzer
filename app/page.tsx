'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Text,
  Card,
  Tabs,
  Group,
  List,
  Code,
  Alert,
  Loader,
  Divider,
  Badge,
  Paper,
  ActionIcon,
  CopyButton,
  ScrollArea,
  FileInput,
  Progress,
  Table,
  Grid,
  JsonInput,
  Accordion,
  ThemeIcon,
  Box,
  TextInput,
  LoadingOverlay,
  FileButton,
  Stack,
  SegmentedControl,
  Slider,
  ColorSwatch,
} from '@mantine/core';
import { 
  IconCheck, 
  IconCopy, 
  IconDatabase, 
  IconUpload, 
  IconShieldLock, 
  IconAlertCircle, 
  IconChartBar, 
  IconFingerprint, 
  IconSearch, 
  IconHistory,
  IconInfoCircle,
  IconFileCode,
  IconHexagon,
  IconEdit,
  IconSettings,
  IconTable,
  IconLink,
  IconArrowRight,
  IconChartHistogram,
  IconEye,
} from '@tabler/icons-react';
import { Notifications, notifications } from '@mantine/notifications';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { API_BASE_URL } from './config';

// Dynamically import the HexEditor component to avoid SSR issues
const HexEditor = dynamic(() => import('./components/HexEditor'), {
  ssr: false,
  loading: () => <div style={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader size="xl" type="dots" /></div>,
});

// Types based on our updated backend API
interface ValidationResponse {
  is_valid: boolean;
  errors: string[] | null;
  md5_hash: string;
  sha1_hash: string;
  sha256_hash: string;
  file_size: number;
  header_signature: string;
  file_id: string;
  artifact_type: string | null;
}

interface ForensicMetadata {
  sqlite_version: string;
  page_size: number;
  encoding: string;
  creation_time: string;
  last_modified_time: string;
  write_format: number;
  journal_mode: string;
  application_id: string | null;
  user_version: number;
}

interface TableInfo {
  name: string;
  rows: number;
  columns: Array<{
    name: string;
    type: string;
    not_null: boolean;
    primary_key: boolean;
  }>;
  sample_data: any[] | null;
  offset?: number;
  page_number?: number;
}

interface RecordInfo {
  type: string;
  offset?: string;
  count?: number;
  size?: number;
  note: string;
}

interface DatabaseRecoveryInfo {
  is_corrupted: boolean;
  corruption_details?: string[];
  recovered_tables: string[];
  partial_analysis: boolean;
  error_log: string[];
}

interface AnalysisResponse {
  file_id: string;
  tables: TableInfo[];
  indices_count: number;
  triggers_count: number;
  size_formatted: string;
  total_rows: number;
  forensic_metadata: ForensicMetadata;
  deleted_records: RecordInfo[];
  artifact_type: string;
  artifact_significance: string | null;
  issues: Array<{
    type: string;
    message: string;
    severity: string;
    table?: string;
    column?: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
  recovery_info?: DatabaseRecoveryInfo;
  error_log: string[];
}

interface OptimizationResponse {
  suggestions: Array<{
    type: string;
    description: string;
    sql?: string;
    table?: string;
    tools?: string[];
  }>;
  potential_improvements: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
}

interface ProcessResponse {
  validation: ValidationResponse;
  analysis: AnalysisResponse | null;
  optimization: OptimizationResponse | null;
}

interface HexDumpResponse {
  offset: number;
  length: number;
  hex_data: string[];
  ascii_data: string[];
  error?: string;
}

interface VisualizationData {
  histogram: Array<{
    byte: number;
    frequency: number;
    hex: string;
    ascii: string;
  }>;
  entropy: {
    overall: number;
    blocks: Array<{
      offset: number;
      entropy: number;
    }>;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatHexOffset(offset: number): string {
  return '0x' + offset.toString(16).toUpperCase().padStart(8, '0');
}

export default function Home() {
  // State for file handling
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileId, setFileId] = useState<string>('');
  
  // UI state
  const [selectedTabValue, setSelectedTabValue] = useState<string>("forensic");
  const [jumpToOffset, setJumpToOffset] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'histogram' | 'entropy'>('histogram');
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [blockSize, setBlockSize] = useState(1024); // 1KB blocks for entropy analysis
  
  // Load data from localStorage after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    const savedResults = localStorage.getItem('sqliteAnalyzerResults');
    const savedFileId = localStorage.getItem('sqliteAnalyzerFileId');
    
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Failed to parse saved results:", e);
        localStorage.removeItem('sqliteAnalyzerResults');
      }
    }
    
    if (savedFileId) {
      setFileId(savedFileId);
    }
  }, []);

  // Save results and fileId to localStorage when they change
  useEffect(() => {
    if (results && isClient) {
      localStorage.setItem('sqliteAnalyzerResults', JSON.stringify(results));
    }
  }, [results, isClient]);

  useEffect(() => {
    if (fileId && isClient) {
      localStorage.setItem('sqliteAnalyzerFileId', fileId);
    }
  }, [fileId, isClient]);

  const processDatabase = async () => {
    if (!file) {
      setError('Please select a SQLite database file');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file and process it - use the correct API endpoint
      const response = await fetch(`${API_BASE_URL}/api/analyze-database`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Extract and save the file_id
      if (data.validation && data.validation.file_id) {
        console.log("Received file ID:", data.validation.file_id);
        setFileId(data.validation.file_id);
        
        // Switch to the forensic tab by default
        setSelectedTabValue("forensic");
        
        // Show success notification
        notifications.show({
          title: 'Success',
          message: 'Database artifact successfully analyzed',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      } else {
        console.error("No file_id received from backend:", data);
      }
      
    } catch (error) {
      console.error("Error processing database:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to process database',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOffsetClick = (offset: number) => {
    setJumpToOffset(offset);
    setSelectedTabValue("hexeditor");
  };

  const fetchVisualizationData = async () => {
    if (!fileId) return;
    
    try {
      setLoading(true);
      
      // Get file content in chunks to analyze using only the fileId
      // Try to get file size first
      const sizeResponse = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: 'GET',
      }).catch(() => null);
      
      let fileSize = 100000; // Default to 100KB if we can't get the actual size
      
      if (sizeResponse && sizeResponse.ok) {
        const fileInfo = await sizeResponse.json();
        fileSize = fileInfo.file_size || 100000;
      }
      
      // Get hex dumps from various parts of the file
      const maxChunkSize = 10240; // 10KB chunks max
      const numChunks = Math.min(10, Math.ceil(fileSize / maxChunkSize)); // At most 10 chunks
      const chunkSize = Math.ceil(fileSize / numChunks);
      
      // Get hex dumps from various parts of the file
      const hexDumps = [];
      for (let i = 0; i < numChunks; i++) {
        const offset = i * chunkSize;
        const hexResponse = await fetch(`${API_BASE_URL}/api/hex_dump`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            file_id: fileId,
            offset: offset.toString(),
            length: chunkSize.toString(),
          }),
        });
        
        if (!hexResponse.ok) {
          continue; // Skip failed chunks
        }
        
        const hexData = await hexResponse.json();
        hexDumps.push(hexData);
      }
      
      // Generate histogram from hex dumps
      const byteFrequency = new Array(256).fill(0);
      let bytesProcessed = 0;
      
      hexDumps.forEach(dump => {
        if (dump.hex_data && Array.isArray(dump.hex_data)) {
          dump.hex_data.forEach((hexLine: string) => {
            // Each hex value is two characters in the string
            const hexValues = hexLine.match(/.{1,2}/g) || [];
            hexValues.forEach((hex: string) => {
              const byteValue = parseInt(hex, 16);
              if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
                byteFrequency[byteValue]++;
                bytesProcessed++;
              }
            });
          });
        }
      });
      
      // Create histogram data
      const histogramData = byteFrequency.map((frequency, byte) => {
        const ascii = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '';
        return {
          byte,
          hex: byte.toString(16).padStart(2, '0').toUpperCase(),
          ascii,
          frequency: frequency as number
        };
      });
      
      // Calculate entropy for each chunk
      const entropyBlocks = hexDumps.map((dump, index) => {
        let blockEntropy = 0;
        if (dump.hex_data && Array.isArray(dump.hex_data)) {
          // Calculate entropy of this chunk
          const chunkByteFreq = new Array(256).fill(0);
          let totalBytes = 0;
          
          dump.hex_data.forEach((hexLine: string) => {
            const hexValues = hexLine.match(/.{1,2}/g) || [];
            hexValues.forEach((hex: string) => {
              const byteValue = parseInt(hex, 16);
              if (!isNaN(byteValue) && byteValue >= 0 && byteValue <= 255) {
                chunkByteFreq[byteValue]++;
                totalBytes++;
              }
            });
          });
          
          // Shannon entropy
          blockEntropy = calculateShannonEntropy(chunkByteFreq, totalBytes);
        }
        
        return {
          offset: index * chunkSize,
          entropy: blockEntropy
        };
      });
      
      // Calculate overall entropy
      const overallEntropy = calculateShannonEntropy(byteFrequency, bytesProcessed);
      
      setVisualizationData({
        histogram: histogramData,
        entropy: {
          overall: overallEntropy,
          blocks: entropyBlocks
        }
      });
      
    } catch (error) {
      console.error("Error fetching visualization data:", error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load visualization data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate Shannon entropy
  const calculateShannonEntropy = (byteFrequency: number[], totalBytes: number): number => {
    if (totalBytes === 0) return 0;
    
    let entropy = 0;
    for (let i = 0; i < byteFrequency.length; i++) {
      if (byteFrequency[i] > 0) {
        const probability = byteFrequency[i] / totalBytes;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  };

  // Load visualization data when user switches to visualization tab
  useEffect(() => {
    if (selectedTabValue === 'visualization' && fileId && !visualizationData) {
      fetchVisualizationData();
    }
  }, [selectedTabValue, fileId, visualizationData]);

  const OffsetLink = ({ offset, label }: { offset: number | string, label?: string }) => {
    const numericOffset = typeof offset === 'string' ? 
      (offset.startsWith('0x') ? parseInt(offset.substring(2), 16) : parseInt(offset)) : 
      offset;
      
    return (
      <Button 
        variant="subtle" 
        size="compact" 
        onClick={() => handleOffsetClick(numericOffset)}
        rightSection={<IconArrowRight size={14} />}
      >
        {label || (typeof offset === 'string' ? offset : formatHexOffset(offset))}
      </Button>
    );
  };

  const clearStoredData = () => {
    localStorage.removeItem('sqliteAnalyzerResults');
    localStorage.removeItem('sqliteAnalyzerFileId');
    setResults(null);
    setFileId('');
    setFile(null);
    setError(null);
    
    notifications.show({
      title: 'Data Cleared',
      message: 'Local storage has been cleared',
      color: 'blue',
    });
  };

  const renderValidationSection = () => {
    if (!results || !results.validation) return null;
    
    const { validation } = results;
    
    return (
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Validation Results</Title>
        
        {!validation.is_valid ? (
          <Alert color="red" title="Invalid Database" mb="md">
            This file is not a valid SQLite database
          </Alert>
        ) : (
          <Alert color="green" title="Valid Database" mb="md">
            This file is a valid SQLite database
          </Alert>
        )}
        
        <Grid>
          <Grid.Col span={6}>
            <Paper p="sm" withBorder>
              <Title order={5}>File Hash (MD5)</Title>
              <Group>
                <Code>{validation.md5_hash}</Code>
                <CopyButton value={validation.md5_hash}>
                  {({ copied, copy }) => (
                    <ActionIcon color={copied ? 'green' : 'blue'} onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Paper p="sm" withBorder>
              <Title order={5}>File Hash (SHA1)</Title>
              <Group>
                <Code>{validation.sha1_hash}</Code>
                <CopyButton value={validation.sha1_hash}>
                  {({ copied, copy }) => (
                    <ActionIcon color={copied ? 'green' : 'blue'} onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Paper p="sm" withBorder mt="md">
              <Title order={5}>File Size</Title>
              <Text>{formatFileSize(validation.file_size)}</Text>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Paper p="sm" withBorder mt="md">
              <Title order={5}>SQLite Signature</Title>
              <Text>{validation.header_signature}</Text>
            </Paper>
          </Grid.Col>
          
          {validation.artifact_type && (
            <Grid.Col span={12}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Detected Artifact Type</Title>
                <Badge size="lg" color="blue" mt="xs">{validation.artifact_type}</Badge>
              </Paper>
            </Grid.Col>
          )}
          
          {validation.errors && validation.errors.length > 0 && (
            <Grid.Col span={12}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Validation Errors</Title>
                <List>
                  {validation.errors.map((error, index) => (
                    <List.Item key={index}>{error}</List.Item>
                  ))}
                </List>
              </Paper>
            </Grid.Col>
          )}
        </Grid>
      </Paper>
    );
  };

  const renderForensicSection = () => {
    if (!results || !results.analysis) return null;
    
    const { analysis } = results;
    
    return (
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Title order={3} mb="md">Forensic Metadata</Title>
          
          <Grid>
            <Grid.Col span={6}>
              <Paper p="sm" withBorder>
                <Title order={5}>Artifact Type</Title>
                <Badge size="lg" color="blue" mt="xs">{analysis.artifact_type}</Badge>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="sm" withBorder>
                <Title order={5}>SQLite Version</Title>
                <Text>{analysis.forensic_metadata.sqlite_version}</Text>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Creation Time</Title>
                <Text>{new Date(analysis.forensic_metadata.creation_time).toLocaleString()}</Text>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Last Modified</Title>
                <Text>{new Date(analysis.forensic_metadata.last_modified_time).toLocaleString()}</Text>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Page Size</Title>
                <Text>{analysis.forensic_metadata.page_size} bytes</Text>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="sm" withBorder mt="md">
                <Title order={5}>Text Encoding</Title>
                <Text>{analysis.forensic_metadata.encoding}</Text>
              </Paper>
            </Grid.Col>
            
            {analysis.forensic_metadata.application_id && (
              <Grid.Col span={12}>
                <Paper p="sm" withBorder mt="md">
                  <Title order={5}>Application ID</Title>
                  <Text>{analysis.forensic_metadata.application_id}</Text>
                </Paper>
              </Grid.Col>
            )}
            
            {analysis.artifact_significance && (
              <Grid.Col span={12}>
                <Alert color="blue" title="Forensic Significance" mt="md">
                  {analysis.artifact_significance}
                </Alert>
              </Grid.Col>
            )}
          </Grid>
        </Paper>
        
        {analysis.deleted_records && analysis.deleted_records.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={3} mb="md">Potentially Recoverable Deleted Data</Title>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Offset</Table.Th>
                  <Table.Th>Count/Size</Table.Th>
                  <Table.Th>Notes</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {analysis.deleted_records.map((record, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>{record.type}</Table.Td>
                    <Table.Td>{record.offset || 'N/A'}</Table.Td>
                    <Table.Td>{record.count || record.size || 'N/A'}</Table.Td>
                    <Table.Td>{record.note}</Table.Td>
                    <Table.Td>
                      {record.offset && record.offset !== 'various' && (
                        <OffsetLink offset={record.offset} label="View in Hex Editor" />
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
        
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={3} mb="md">Investigator Recommendations</Title>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Recommendation</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {analysis.recommendations.map((rec, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Badge 
                        color={
                          rec.priority === 'high' ? 'red' : 
                          rec.priority === 'medium' ? 'yellow' : 'blue'
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{rec.type}</Table.Td>
                    <Table.Td>{rec.message}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    );
  };

  const renderDatabaseStructure = () => {
    if (!results || !results.analysis) return null;
    
    const { analysis } = results;
    
    // Check if tables array exists
    const tables = analysis.tables || [];
    
    return (
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>Database Structure</Title>
          <Group>
            <Badge size="lg" color="blue">{tables.length} Tables</Badge>
            <Badge size="lg" color="teal">{analysis.indices_count || 0} Indices</Badge>
            <Badge size="lg" color="grape">{analysis.total_rows || 0} Total Rows</Badge>
            <Badge size="lg" color="cyan">{analysis.size_formatted || '0 B'}</Badge>
          </Group>
        </Group>
        
        <Accordion>
          {tables.map((table) => (
            <Accordion.Item key={table.name || 'unknown'} value={table.name || 'unknown'}>
              <Accordion.Control>
                <Group>
                  <IconTable size={18} />
                  <Text fw={600}>{table.name || 'Unknown'}</Text>
                  <Badge color="blue">{table.rows || 0} rows</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Title order={5} mb="xs">Columns</Title>
                <Table striped mb="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Constraints</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(table.columns || []).map((column, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>{column.name || 'Unknown'}</Table.Td>
                        <Table.Td>{column.type || 'Unknown'}</Table.Td>
                        <Table.Td>
                          {column.primary_key && <Badge mr="xs">PRIMARY KEY</Badge>}
                          {column.not_null && <Badge color="yellow">NOT NULL</Badge>}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                
                {table.sample_data && table.sample_data.length > 0 && (
                  <>
                    <Divider my="sm" label="Sample Data" labelPosition="center" />
                    <ScrollArea h={200}>
                      <JsonInput
                        value={JSON.stringify(table.sample_data, null, 2)}
                        minRows={10}
                        formatOnBlur
                        readOnly
                        w="100%"
                      />
                    </ScrollArea>
                  </>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        
        {analysis.issues && analysis.issues.length > 0 && (
          <>
            <Divider my="md" label="Schema Issues" labelPosition="center" />
            <Paper p="md" withBorder>
              <List>
                {analysis.issues.map((issue, idx) => (
                  <List.Item
                    key={idx}
                    icon={
                      <ThemeIcon 
                        color={
                          issue.severity === 'high' ? 'red' : 
                          issue.severity === 'medium' ? 'yellow' : 'blue'
                        }
                        size={24}
                        radius="xl"
                      >
                        <IconAlertCircle size={16} />
                      </ThemeIcon>
                    }
                  >
                    {issue.message}
                  </List.Item>
                ))}
              </List>
            </Paper>
          </>
        )}
      </Paper>
    );
  };

  const renderOptimizationSection = () => {
    if (!results || !results.optimization) return null;
    
    const { optimization } = results;
    
    // Make sure suggestions and potential_improvements exist and default to empty arrays if not
    const suggestions = optimization.suggestions || [];
    const improvements = optimization.potential_improvements || [];
    
    return (
      <Paper p="md" withBorder>
        <Title order={3} mb="md">Optimization Suggestions</Title>
        
        <Accordion>
          <Accordion.Item value="suggestions">
            <Accordion.Control>
              <Group>
                <IconSettings size={18} />
                <Text fw={600}>Suggested Optimizations ({suggestions.length})</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>SQL</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {suggestions.map((sugg, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{sugg?.type || 'Unknown'}</Table.Td>
                      <Table.Td>{sugg?.description || 'No description provided'}</Table.Td>
                      <Table.Td>
                        {sugg?.sql ? (
                          <Group>
                            <Code block>{sugg.sql}</Code>
                            <CopyButton value={sugg.sql}>
                              {({ copied, copy }) => (
                                <ActionIcon color={copied ? 'green' : 'blue'} onClick={copy}>
                                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                              )}
                            </CopyButton>
                          </Group>
                        ) : (
                          sugg?.tools && sugg.tools.length > 0 ? 'Suggested tools: ' + sugg.tools.join(', ') : '—'
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Accordion.Panel>
          </Accordion.Item>
          
          <Accordion.Item value="improvements">
            <Accordion.Control>
              <Group>
                <IconChartBar size={18} />
                <Text fw={600}>Potential Improvements ({improvements.length})</Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Impact</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {improvements.map((imp, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{imp?.type || 'Unknown'}</Table.Td>
                      <Table.Td>{imp?.description || 'No description provided'}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            imp?.impact === 'high' ? 'red' : 
                            imp?.impact === 'medium' ? 'yellow' : 'blue'
                          }
                        >
                          {imp?.impact || 'low'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Paper>
    );
  };

  const renderRecoveryInfo = (recoveryInfo: DatabaseRecoveryInfo) => {
    return (
      <Card withBorder radius="md" mb="md">
        <Card.Section withBorder inheritPadding py="xs">
          <Group position="apart">
            <Text weight={500}>Database Recovery Status</Text>
            <Badge color={recoveryInfo.is_corrupted ? "red" : "green"}>
              {recoveryInfo.is_corrupted ? "Corrupted" : "Valid"}
            </Badge>
          </Group>
        </Card.Section>

        <Stack spacing="xs" mt="md">
          {recoveryInfo.corruption_details && recoveryInfo.corruption_details.length > 0 && (
            <Alert title="Corruption Details" color="red">
              <List>
                {recoveryInfo.corruption_details.map((detail, index) => (
                  <List.Item key={index}>{detail}</List.Item>
                ))}
              </List>
            </Alert>
          )}

          {recoveryInfo.recovered_tables.length > 0 && (
            <Box>
              <Text size="sm" weight={500} mb="xs">Recovered Tables</Text>
              <Group spacing="xs">
                {recoveryInfo.recovered_tables.map((table) => (
                  <Badge key={table} color="blue">{table}</Badge>
                ))}
              </Group>
            </Box>
          )}

          {recoveryInfo.partial_analysis && (
            <Alert title="Partial Analysis" color="yellow">
              The database was partially analyzed due to corruption. Some data may be missing or incomplete.
            </Alert>
          )}

          {recoveryInfo.error_log.length > 0 && (
            <Box>
              <Text size="sm" weight={500} mb="xs">Error Log</Text>
              <List size="sm">
                {recoveryInfo.error_log.map((error, index) => (
                  <List.Item key={index}>{error}</List.Item>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      </Card>
    );
  };

  const renderBackupSection = () => {
    const [backups, setBackups] = useState<any[]>([]);
    const [backupsLoading, setBackupsLoading] = useState(false);

    const loadBackups = async () => {
      try {
        setBackupsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/backups`);
        if (response.ok) {
          const data = await response.json();
          setBackups(data);
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to load backups',
            color: 'red',
          });
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to load backups',
          color: 'red',
        });
      } finally {
        setBackupsLoading(false);
      }
    };

    const restoreBackup = async (filename: string) => {
      try {
        setBackupsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/backups/${filename}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          notifications.show({
            title: 'Success',
            message: `Restored backup: ${filename}`,
            color: 'green',
          });
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to restore backup',
            color: 'red',
          });
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to restore backup',
          color: 'red',
        });
      } finally {
        setBackupsLoading(false);
      }
    };

    useEffect(() => {
      if (selectedTabValue === 'backups') {
        loadBackups();
      }
    }, [selectedTabValue]);

    return (
      <Card withBorder>
        <Group justify="space-between">
          <Text fw={700}>Backup Management</Text>
          <Button
            variant="light"
            size="xs"
            onClick={loadBackups}
            loading={backupsLoading}
          >
            Refresh
          </Button>
        </Group>

        <Stack gap="md" mt="md">
          {backups.length === 0 ? (
            <Text c="dimmed">No backups available</Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Filename</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {backups.map((backup) => (
                  <Table.Tr key={backup.filename}>
                    <Table.Td>{backup.filename}</Table.Td>
                    <Table.Td>{new Date(backup.created).toLocaleString()}</Table.Td>
                    <Table.Td>{formatFileSize(backup.size)}</Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => restoreBackup(backup.filename)}
                      >
                        Restore
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>
    );
  };

  const renderAnalysisSection = () => {
    if (!results?.analysis) return null;

    return (
      <Stack>
        {results.analysis.recovery_info && renderRecoveryInfo(results.analysis.recovery_info)}
        
        <Tabs value={selectedTabValue} onChange={(value) => value && setSelectedTabValue(value)} mb="md">
          <Tabs.List>
            <Tabs.Tab value="validation">Validation</Tabs.Tab>
            <Tabs.Tab value="forensic">Forensic Analysis</Tabs.Tab>
            <Tabs.Tab value="artifact">Artifact Content</Tabs.Tab>
            <Tabs.Tab value="technical">Technical Details</Tabs.Tab>
            <Tabs.Tab value="recommendations">Recommendations</Tabs.Tab>
            <Tabs.Tab value="backups">Backups</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="validation" pt="xs">
            {renderValidationSection()}
          </Tabs.Panel>

          <Tabs.Panel value="forensic" pt="xs">
            {renderForensicSection()}
          </Tabs.Panel>

          <Tabs.Panel value="artifact" pt="xs">
            {renderDatabaseStructure()}
          </Tabs.Panel>

          <Tabs.Panel value="technical" pt="xs">
            {renderOptimizationSection()}
          </Tabs.Panel>

          <Tabs.Panel value="recommendations" pt="xs">
            {renderForensicSection()}
          </Tabs.Panel>

          <Tabs.Panel value="backups" pt="xs">
            {renderBackupSection()}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    );
  };

  const renderVisualizationSection = () => {
    return (
      <Paper p="md" withBorder>
        <Group justify="apart" mb="md">
          <Title order={3}>Data Visualization</Title>
          <SegmentedControl
            value={visualizationMode}
            onChange={(value) => setVisualizationMode(value as 'histogram' | 'entropy')}
            data={[
              { label: 'Byte Histogram', value: 'histogram' },
              { label: 'Entropy Map', value: 'entropy' },
            ]}
          />
        </Group>
        
        {visualizationMode === 'entropy' && (
          <Box mb="md">
            <Group justify="apart" align="center">
              <Text>Block Size: {formatFileSize(blockSize)}</Text>
              <Slider
                label={formatFileSize}
                min={512}
                max={8192}
                step={512}
                value={blockSize}
                onChange={setBlockSize}
                onChangeEnd={() => {
                  // Refetch entropy data with new block size
                  setVisualizationData(null);
                  fetchVisualizationData();
                }}
                style={{ flex: 1, marginLeft: 20 }}
                marks={[
                  { value: 512, label: '512B' },
                  { value: 4096, label: '4KB' },
                  { value: 8192, label: '8KB' },
                ]}
              />
            </Group>
          </Box>
        )}
        
        {!visualizationData ? (
          <Box py="xl" style={{ textAlign: 'center' }}>
            {loading ? (
              <Loader size="lg" />
            ) : (
              <Button onClick={fetchVisualizationData}>
                Load Visualization Data
              </Button>
            )}
          </Box>
        ) : visualizationMode === 'histogram' ? (
          // Histogram View
          <Box>
            <Alert color="blue" mb="md">
              <Text fw={600}>Byte Frequency Analysis</Text>
              <Text size="sm">
                This histogram shows the distribution of byte values (0-255) in the file. 
                Unusual patterns may indicate encryption, compression, or specific file types.
              </Text>
            </Alert>
            
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={visualizationData.histogram}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="byte" 
                  label={{ value: 'Byte Value (0-255)', position: 'insideBottom', offset: -15 }}
                  tickFormatter={(value: number) => value % 32 === 0 ? value.toString() : ''}
                />
                <YAxis 
                  label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [value, 'Frequency']}
                  labelFormatter={(value: number) => {
                    const item = visualizationData.histogram.find(h => h.byte === value);
                    return `Byte: ${value} (0x${value.toString(16).padStart(2, '0').toUpperCase()})${item?.ascii ? ` ASCII: ${item.ascii}` : ''}`;
                  }}
                />
                <Bar dataKey="frequency" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            
            <Box mt="md">
              <Text fw={600} mb="xs">Observations:</Text>
              <List>
                {visualizationData.histogram.length > 0 ? (
                  <>
                    <List.Item>
                      {getHistogramDistributionDescription(visualizationData.histogram)}
                    </List.Item>
                    <List.Item>
                      Most frequent byte: {getMostFrequentByte(visualizationData.histogram)}
                    </List.Item>
                  </>
                ) : (
                  <List.Item>No histogram data available</List.Item>
                )}
              </List>
            </Box>
          </Box>
        ) : (
          // Entropy View
          <Box>
            <Alert color="blue" mb="md">
              <Text fw={600}>Shannon Entropy Analysis</Text>
              <Text size="sm">
                Entropy measures randomness in data (values from 0 to 8). Higher values {'>'}7 may indicate 
                encryption or compression. Values around 4-6 are typical for text and normal data.
              </Text>
            </Alert>
            
            <Box mb="lg">
              <Text ta="center" fw={600}>
                Overall Entropy: {visualizationData.entropy.overall.toFixed(4)} 
                {getEntropyLabel(visualizationData.entropy.overall)}
              </Text>
            </Box>
            
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={visualizationData.entropy.blocks}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="offset" 
                  label={{ value: 'File Offset', position: 'insideBottom', offset: -15 }}
                  tickFormatter={(value: number) => formatHexOffset(value)}
                />
                <YAxis 
                  domain={[0, 8]}
                  label={{ value: 'Entropy (0-8)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(4), 'Entropy']}
                  labelFormatter={(value: number) => `Offset: ${formatHexOffset(value)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="entropy" 
                  stroke="#ff7300"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                {/* Add a reference line at entropy = 7.0 to highlight potential encrypted sections */}
                <CartesianGrid y={7.0} stroke="red" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            
            <Box mt="md">
              <Text fw={600} mb="xs">Entropy Insights:</Text>
              <List>
                {getEntropyInsights(visualizationData.entropy).map((insight, idx) => (
                  <List.Item key={idx}>{insight}</List.Item>
                ))}
              </List>
            </Box>
          </Box>
        )}
        
        <Button 
          mt="lg" 
          onClick={fetchVisualizationData} 
          leftSection={<IconChartHistogram size={16} />}
        >
          Refresh Data
        </Button>
      </Paper>
    );
  };

  // Helper functions for visualization
  const getHistogramDistributionDescription = (histogram: VisualizationData['histogram']) => {
    // Count how many bytes are present vs absent
    const presentBytes = histogram.filter(item => item.frequency > 0).length;
    const percentPresent = (presentBytes / 256) * 100;
    
    if (percentPresent > 95) {
      return `File uses ${presentBytes} out of 256 possible byte values (${percentPresent.toFixed(1)}%), suggesting uncompressed/unencrypted data.`;
    } else if (percentPresent < 30) {
      return `File only uses ${presentBytes} out of 256 possible byte values (${percentPresent.toFixed(1)}%), suggesting specialized or structured data.`;
    } else {
      return `File uses ${presentBytes} out of 256 possible byte values (${percentPresent.toFixed(1)}%).`;
    }
  };
  
  const getMostFrequentByte = (histogram: VisualizationData['histogram']) => {
    if (!histogram.length) return 'None';
    
    const sorted = [...histogram].sort((a, b) => b.frequency - a.frequency);
    const top = sorted[0];
    
    return `0x${top.byte.toString(16).padStart(2, '0').toUpperCase()} (${top.ascii ? `'${top.ascii}'` : 'non-printable'}) - ${top.frequency} occurrences`;
  };
  
  const getEntropyLabel = (entropy: number) => {
    if (entropy > 7.5) return ' (Very High - Likely Encrypted/Compressed)';
    if (entropy > 6.5) return ' (High - Possibly Encrypted/Compressed)';
    if (entropy > 5.5) return ' (Medium-High - Mixed Content)';
    if (entropy > 4.0) return ' (Medium - Typical for Text/Data)';
    if (entropy > 2.5) return ' (Low-Medium - Structured Data)';
    return ' (Low - Highly Structured/Repetitive)';
  };
  
  const getEntropyInsights = (entropyData: VisualizationData['entropy']) => {
    const insights = [];
    
    // Overall entropy insights
    if (entropyData.overall > 7.0) {
      insights.push('High overall entropy suggests encrypted or compressed data.');
    } else if (entropyData.overall < 3.0) {
      insights.push('Low overall entropy suggests highly structured or sparse data.');
    }
    
    // Look for sections with significantly different entropy
    const highEntropyBlocks = entropyData.blocks.filter(block => block.entropy > 7.0);
    if (highEntropyBlocks.length > 0) {
      const percentage = (highEntropyBlocks.length / entropyData.blocks.length) * 100;
      insights.push(`Found ${highEntropyBlocks.length} high-entropy blocks (${percentage.toFixed(1)}% of file) that may contain encrypted data.`);
    }
    
    // Look for entropy transitions (potential boundaries between different data types)
    let transitions = 0;
    for (let i = 1; i < entropyData.blocks.length; i++) {
      const diff = Math.abs(entropyData.blocks[i].entropy - entropyData.blocks[i-1].entropy);
      if (diff > 2.0) transitions++;
    }
    
    if (transitions > 0) {
      insights.push(`Detected ${transitions} significant entropy transitions, suggesting multiple data types or structures.`);
    }
    
    if (insights.length === 0) {
      insights.push('No significant entropy patterns detected. The file has a relatively uniform data distribution.');
    }
    
    return insights;
  };

  return (
    <Container size="xl" py="xl">
      <Notifications />
      
      <Paper p="lg" radius="md" withBorder mb="xl">
        <Title order={1} ta="center" mb="md">SQLite Forensic Artifact Analyzer</Title>
        <Text ta="center" size="lg" c="dimmed" mb="lg">
          Upload a SQLite database to validate, analyze, and optimize it for digital forensic investigations.
        </Text>
        
        <Stack gap="md">
          <Group justify="center">
            <FileInput
              placeholder="Upload SQLite database file"
              value={file}
              onChange={setFile}
              accept=".db,.sqlite,.sqlite3"
              clearable
              leftSection={<IconUpload size={16} />}
              styles={{ input: { width: '350px' } }}
              disabled={loading}
            />
            <Button
              onClick={processDatabase}
              disabled={!file || loading}
              loading={loading}
              leftSection={<IconDatabase size={16} />}
            >
              Analyze Database
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={clearStoredData}
              disabled={!results && !fileId}
            >
              Clear Data
            </Button>
          </Group>
          
          {loading && (
            <Box>
              <Text size="sm" ta="center" mb="xs">
                Uploading and analyzing database...
              </Text>
              <Progress value={uploadProgress} striped animated />
            </Box>
          )}
          
          {error && (
            <Alert color="red" title="Error" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}
        </Stack>
      </Paper>
      
      {results && (
        <Tabs value={selectedTabValue} onChange={(value) => value && setSelectedTabValue(value)} mb="md">
          <Tabs.List>
            <Tabs.Tab
              value="validation"
              leftSection={<IconShieldLock size={16} />}
            >
              Validation
            </Tabs.Tab>
            <Tabs.Tab
              value="forensic"
              leftSection={<IconFingerprint size={16} />}
            >
              Forensic Analysis
            </Tabs.Tab>
            <Tabs.Tab
              value="structure"
              leftSection={<IconTable size={16} />}
            >
              Database Structure
            </Tabs.Tab>
            <Tabs.Tab
              value="optimization"
              leftSection={<IconSettings size={16} />}
            >
              Optimization
            </Tabs.Tab>
            <Tabs.Tab
              value="hexeditor"
              leftSection={<IconHexagon size={16} />}
            >
              Hex Editor
            </Tabs.Tab>
            <Tabs.Tab
              value="visualization"
              leftSection={<IconChartHistogram size={16} />}
            >
              Visualization
            </Tabs.Tab>
          </Tabs.List>
          
          <Box mt="md">
            {selectedTabValue === 'validation' && renderValidationSection()}
            {selectedTabValue === 'forensic' && renderForensicSection()}
            {selectedTabValue === 'structure' && renderDatabaseStructure()}
            {selectedTabValue === 'optimization' && renderOptimizationSection()}
            {selectedTabValue === 'hexeditor' && fileId && (
              <HexEditor fileId={fileId} initialOffset={jumpToOffset || 0} />
            )}
            {selectedTabValue === 'visualization' && fileId && (
              renderVisualizationSection()
            )}
          </Box>
        </Tabs>
      )}
    </Container>
  );
}
