'use client';

import { useState, useEffect } from 'react';
import { Box, Card, Text, Group, Table, Divider, Tooltip, Badge, Switch } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface DataInspectorProps {
  fileId: string;
  selectedOffset: number | null;
  selectionLength: number;
  hexData: Uint8Array | null;
}

export default function DataInspector({ fileId, selectedOffset, selectionLength, hexData }: DataInspectorProps) {
  const [inspectorData, setInspectorData] = useState<Record<string, any>>({});
  const [showBinary, setShowBinary] = useState<boolean>(false);

  useEffect(() => {
    if (selectedOffset === null || !hexData || hexData.length === 0 || selectionLength === 0) {
      setInspectorData({});
      return;
    }

    analyzeBytes(hexData);
  }, [selectedOffset, selectionLength, hexData]);

  const analyzeBytes = (bytes: Uint8Array) => {
    // Ensure we're not trying to analyze beyond the array bounds
    if (!bytes || bytes.length === 0) return;
    
    const result: Record<string, any> = {};
    
    // Integer types
    if (bytes.length >= 1) {
      result.uint8 = bytes[0];
      result.int8 = new Int8Array(bytes.buffer, bytes.byteOffset, 1)[0];
    }
    
    if (bytes.length >= 2) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      result.uint16_le = view.getUint16(0, true);
      result.uint16_be = view.getUint16(0, false);
      result.int16_le = view.getInt16(0, true);
      result.int16_be = view.getInt16(0, false);
    }
    
    if (bytes.length >= 4) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      result.uint32_le = view.getUint32(0, true);
      result.uint32_be = view.getUint32(0, false);
      result.int32_le = view.getInt32(0, true);
      result.int32_be = view.getInt32(0, false);
      
      // Float
      result.float_le = view.getFloat32(0, true);
      result.float_be = view.getFloat32(0, false);
    }
    
    if (bytes.length >= 8) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      
      // Do BigInt for 64-bit integers
      try {
        result.uint64_le = view.getBigUint64(0, true);
        result.uint64_be = view.getBigUint64(0, false);
        result.int64_le = view.getBigInt64(0, true);
        result.int64_be = view.getBigInt64(0, false);
      } catch (err) {
        // Some browsers might not support BigInt
        result.uint64_le = "Browser does not support BigInt";
        result.uint64_be = "Browser does not support BigInt";
        result.int64_le = "Browser does not support BigInt";
        result.int64_be = "Browser does not support BigInt";
      }
      
      // Double
      result.double_le = view.getFloat64(0, true);
      result.double_be = view.getFloat64(0, false);
    }
    
    // String types
    try {
      result.string_ascii = new TextDecoder('ascii').decode(bytes);
      result.string_utf8 = new TextDecoder('utf-8').decode(bytes);
      result.string_utf16_le = new TextDecoder('utf-16le').decode(bytes);
      result.string_utf16_be = new TextDecoder('utf-16be').decode(bytes);
    } catch (err) {
      result.string_error = "Error decoding text";
    }
    
    // Time (interpret as Unix timestamp)
    if (bytes.length >= 4) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      const timestamp32 = view.getUint32(0, true); // Little-endian 32-bit timestamp
      try {
        const date = new Date(timestamp32 * 1000); // Convert to milliseconds
        if (!isNaN(date.getTime())) {
          result.unix_timestamp_32le = date.toISOString();
        } else {
          result.unix_timestamp_32le = "Invalid timestamp";
        }
      } catch (err) {
        result.unix_timestamp_32le = "Error parsing timestamp";
      }
    }
    
    if (bytes.length >= 8) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);
      try {
        // Try to parse 64-bit timestamp - this may not work in all browsers
        const msTimestamp = Number(view.getBigUint64(0, true));
        if (!isNaN(msTimestamp) && msTimestamp > 0 && msTimestamp < 8640000000000000) {
          const date = new Date(msTimestamp);
          result.ms_timestamp_64le = date.toISOString();
        } else {
          result.ms_timestamp_64le = "Invalid timestamp";
        }
      } catch (err) {
        result.ms_timestamp_64le = "Error parsing timestamp";
      }
    }
    
    // Calculate binary representation for all bytes
    result.binary = Array.from(bytes).map(byte => 
      byte.toString(2).padStart(8, '0')
    ).join(' ');
    
    setInspectorData(result);
  };

  const formatValue = (value: any, type: string): string => {
    if (value === undefined || value === null) return 'N/A';
    
    if (typeof value === 'number') {
      if (type.includes('float') || type.includes('double')) {
        return value.toFixed(6);
      }
      if (type.includes('int') || type.includes('uint')) {
        // Show as decimal and hex
        return `${value} (0x${value.toString(16).toUpperCase().padStart(2, '0')})`;
      }
    }
    
    if (typeof value === 'bigint') {
      return `${value} (0x${value.toString(16).toUpperCase()})`;
    }
    
    return String(value);
  };

  return (
    <Card p="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500} size="lg">Data Inspector</Text>
          <Tooltip label="Toggle binary representation">
            <Switch 
              checked={showBinary}
              onChange={() => setShowBinary(!showBinary)}
              size="xs"
              label="Show Binary"
            />
          </Tooltip>
        </Group>
      </Card.Section>
      <Box mt="md">
        {selectedOffset === null ? (
          <Text color="dimmed" ta="center">Select bytes in the hex editor to inspect</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data Type</Table.Th>
                <Table.Th>Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* Integers */}
              <Table.Tr>
                <Table.Td colSpan={2} style={{ backgroundColor: '#f1f3f5' }}>
                  <Text fw={700}>Integers</Text>
                </Table.Td>
              </Table.Tr>
              {['uint8', 'int8', 'uint16_le', 'uint16_be', 'int16_le', 'int16_be', 
                'uint32_le', 'uint32_be', 'int32_le', 'int32_be',
                'uint64_le', 'uint64_be', 'int64_le', 'int64_be'].map(type => (
                <Table.Tr key={type} style={{ display: inspectorData[type] !== undefined ? 'table-row' : 'none' }}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>{type}</Text>
                      {type.includes('_le') && 
                        <Badge color="blue" variant="light" size="xs">Little Endian</Badge>}
                      {type.includes('_be') && 
                        <Badge color="orange" variant="light" size="xs">Big Endian</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {formatValue(inspectorData[type], type)}
                    </Text>
                    {showBinary && type === 'uint8' && inspectorData.binary && (
                      <Text size="xs" color="dimmed" style={{ fontFamily: 'monospace' }}>
                        {inspectorData.binary.split(' ')[0]}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Floating Point */}
              <Table.Tr>
                <Table.Td colSpan={2} style={{ backgroundColor: '#f1f3f5' }}>
                  <Text fw={700}>Floating Point</Text>
                </Table.Td>
              </Table.Tr>
              {['float_le', 'float_be', 'double_le', 'double_be'].map(type => (
                <Table.Tr key={type} style={{ display: inspectorData[type] !== undefined ? 'table-row' : 'none' }}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>{type}</Text>
                      {type.includes('_le') && 
                        <Badge color="blue" variant="light" size="xs">Little Endian</Badge>}
                      {type.includes('_be') && 
                        <Badge color="orange" variant="light" size="xs">Big Endian</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {formatValue(inspectorData[type], type)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Time */}
              <Table.Tr>
                <Table.Td colSpan={2} style={{ backgroundColor: '#f1f3f5' }}>
                  <Text fw={700}>Time</Text>
                </Table.Td>
              </Table.Tr>
              {['unix_timestamp_32le', 'ms_timestamp_64le'].map(type => (
                <Table.Tr key={type} style={{ display: inspectorData[type] !== undefined ? 'table-row' : 'none' }}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>{type}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {inspectorData[type]}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Strings */}
              <Table.Tr>
                <Table.Td colSpan={2} style={{ backgroundColor: '#f1f3f5' }}>
                  <Text fw={700}>Text</Text>
                </Table.Td>
              </Table.Tr>
              {['string_ascii', 'string_utf8', 'string_utf16_le', 'string_utf16_be'].map(type => (
                <Table.Tr key={type}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{type}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ fontFamily: 'monospace', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inspectorData[type] || 'N/A'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Binary representation */}
              {showBinary && (
                <>
                  <Table.Tr>
                    <Table.Td colSpan={2} style={{ backgroundColor: '#f1f3f5' }}>
                      <Text fw={700}>Binary</Text>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={2}>
                      <Text size="sm" style={{ fontFamily: 'monospace', maxWidth: '100%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {inspectorData.binary || 'N/A'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                </>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Box>
    </Card>
  );
} 