'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, TextInput, Button, Group, Table, ScrollArea, Code, Grid, NumberInput, ActionIcon, Alert, Card, Tooltip, Divider, Modal, Paper, Center, Loader, Stack } from '@mantine/core';
import { IconRefresh, IconChevronLeft, IconChevronRight, IconEdit, IconCheck, IconX, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import DataInspector from './DataInspector';
import SearchTools from './SearchTools';
import { API_BASE_URL } from '../config';

interface HexData {
  offset: string;
  values: { value: string; offset: number }[];
}

interface HexEditorProps {
  fileId: string;
  initialOffset?: number | null;
}

export default function HexEditor({ fileId, initialOffset = null }: HexEditorProps) {
  const [offset, setOffset] = useState<number>(initialOffset || 0);
  const [length, setLength] = useState<number>(256);
  const [hexData, setHexData] = useState<HexData[]>([]);
  const [asciiRepresentation, setAsciiRepresentation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editableCell, setEditableCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editAscii, setEditAscii] = useState<boolean>(false);
  const [editAsciiIndex, setEditAsciiIndex] = useState<{ rowIndex: number; charIndex: number } | null>(null);
  const [editAsciiValue, setEditAsciiValue] = useState<string>('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [rowHexValue, setRowHexValue] = useState<string>('');
  const [editingAsciiRow, setEditingAsciiRow] = useState<number | null>(null);
  const [rowAsciiValue, setRowAsciiValue] = useState<string>('');
  const [showConfirmSave, setShowConfirmSave] = useState<boolean>(false);
  const [pendingSave, setPendingSave] = useState<{
    offset: number;
    hexValue: string;
    type: 'hex' | 'ascii' | 'row' | 'ascii-row';
  } | null>(null);

  // New states for selection and data inspector
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [selectedBytes, setSelectedBytes] = useState<Uint8Array | null>(null);
  const [selectionLength, setSelectionLength] = useState<number>(1);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionStartCell, setSelectionStartCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  useEffect(() => {
    if (fileId) {
      loadHexData();
    }
  }, [fileId, initialOffset]);

  useEffect(() => {
    if (initialOffset !== null) {
      setOffset(initialOffset);
    }
  }, [initialOffset]);

  const loadHexData = async () => {
    if (!fileId) {
      setError("No file ID provided. Please upload a database file first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading hex data with file ID:", fileId, "at offset:", offset);
      
      const response = await fetch(`${API_BASE_URL}/api/hex_dump`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offset,
          length,
          file_id: fileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load hex data');
      }

      const data = await response.json();
      
      // Transform the data into the format expected by the component
      const hexRows: HexData[] = [];
      const asciiText: string = data.ascii_data.join('');
      
      data.hex_data.forEach((hexRow: string, index: number) => {
        const rowOffset = (offset + (index * 16)).toString(16).toUpperCase().padStart(8, '0');
        const hexValues = hexRow.split(' ');
        
        const values = hexValues.map((value: string, colIndex: number) => ({
          value,
          offset: offset + (index * 16) + colIndex
        }));
        
        hexRows.push({
          offset: rowOffset,
          values
        });
      });
      
      setHexData(hexRows);
      setAsciiRepresentation(asciiText);
    } catch (err: any) {
      console.error("Error loading hex data:", err);
      setError(err.message || 'An error occurred while loading hex data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, offset - length);
    setOffset(newOffset);
    loadHexData();
  };

  const handleNextPage = () => {
    const newOffset = offset + length;
    setOffset(newOffset);
    loadHexData();
  };

  const handleCellClick = (rowIndex: number, colIndex: number, value: string) => {
    if (editMode) {
      setEditableCell({ rowIndex, colIndex });
      setEditValue(value);
      // Clear other edit modes
      setEditAsciiIndex(null);
      setEditAsciiValue('');
      setEditingRow(null);
      setRowHexValue('');
      setEditingAsciiRow(null);
      setRowAsciiValue('');
    }
  };

  const handleAsciiClick = (rowIndex: number, charIndex: number, value: string) => {
    if (editMode) {
      setEditAsciiIndex({ rowIndex, charIndex });
      setEditAsciiValue(value);
      // Clear other edit modes
      setEditableCell(null);
      setEditValue('');
      setEditingRow(null);
      setRowHexValue('');
      setEditingAsciiRow(null);
      setRowAsciiValue('');
    } else {
      // If not in edit mode, handle selection
      const rowOffset = parseInt(hexData[rowIndex].offset, 16);
      const absOffset = rowOffset + charIndex;
      
      setSelectedCell({ rowIndex, colIndex: charIndex });
      setSelectedRange({ start: absOffset, end: absOffset });
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (!editMode) return;
    
    // Format the entire row as a space-separated string of hex values
    const rowValues = hexData[rowIndex].values.map(cell => cell.value).join(' ');
    setEditingRow(rowIndex);
    setRowHexValue(rowValues);
    
    // Clear other edit modes
    setEditableCell(null);
    setEditValue('');
    setEditAsciiIndex(null);
    setEditAsciiValue('');
    setEditingAsciiRow(null);
    setRowAsciiValue('');
  };

  const handleAsciiRowClick = (rowIndex: number) => {
    if (!editMode) return;
    
    // Get the ASCII representation for this row
    const rowAscii = asciiRepresentation.substring(rowIndex * 16, rowIndex * 16 + 16);
    setEditingAsciiRow(rowIndex);
    setRowAsciiValue(rowAscii);
    
    // Clear other edit modes
    setEditableCell(null);
    setEditValue('');
    setEditAsciiIndex(null);
    setEditAsciiValue('');
    setEditingRow(null);
    setRowHexValue('');
  };

  const prepareSave = () => {
    if (editableCell) {
      // Validate hex input for single cell
      if (!/^[0-9a-fA-F]{2}$/.test(editValue)) {
        return;
      }
      
      const cellData = hexData[editableCell.rowIndex].values[editableCell.colIndex];
      setPendingSave({
        offset: cellData.offset,
        hexValue: editValue,
        type: 'hex'
      });
      setShowConfirmSave(true);
    } else if (editAsciiIndex) {
      // Handle ASCII edit
      const rowOffset = parseInt(hexData[editAsciiIndex.rowIndex].offset, 16);
      const targetOffset = rowOffset + editAsciiIndex.charIndex;
      // Convert ASCII character to hex
      const hexValue = editAsciiValue.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase();
      
      setPendingSave({
        offset: targetOffset,
        hexValue: hexValue,
        type: 'ascii'
      });
      setShowConfirmSave(true);
    } else if (editingRow !== null) {
      // Validate hex input for row
      const hexValues = rowHexValue.trim().split(/\s+/);
      const validHex = hexValues.every(hex => /^[0-9a-fA-F]{2}$/.test(hex));
      
      if (!validHex || hexValues.length > 16) {
        return;
      }
      
      const rowOffset = parseInt(hexData[editingRow].offset, 16);
      
      setPendingSave({
        offset: rowOffset,
        hexValue: hexValues.join(''),
        type: 'row'
      });
      setShowConfirmSave(true);
    } else if (editingAsciiRow !== null) {
      // Handle ASCII row edit
      // Check if the length is valid (should be 16 or less)
      if (rowAsciiValue.length > 16) {
        return;
      }
      
      const rowOffset = parseInt(hexData[editingAsciiRow].offset, 16);
      
      // Convert each ASCII character to hex
      let hexValues = '';
      for (let i = 0; i < rowAsciiValue.length; i++) {
        hexValues += rowAsciiValue.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
      }
      
      // If fewer than 16 characters were provided, pad with spaces (20 is hex for space)
      while (hexValues.length < 32) { // 16 bytes = 32 hex chars
        hexValues += '20';
      }
      
      setPendingSave({
        offset: rowOffset,
        hexValue: hexValues,
        type: 'ascii-row'
      });
      setShowConfirmSave(true);
    }
  };

  const saveEdit = async () => {
    if (!pendingSave || !fileId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/edit_hex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          offset: pendingSave.offset,
          hex_value: pendingSave.hexValue,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save edit');
      }
      
      // Reload hex data to show updated values
      await loadHexData();
      
      // Clear editing state
      setEditableCell(null);
      setEditValue('');
      setEditAsciiIndex(null);
      setEditAsciiValue('');
      setEditingRow(null);
      setRowHexValue('');
      setEditingAsciiRow(null);
      setRowAsciiValue('');
    } catch (err: any) {
      console.error("Error saving edit:", err);
      setError(err.message || 'An error occurred while saving edit');
    } finally {
      setIsLoading(false);
      setShowConfirmSave(false);
      setPendingSave(null);
    }
  };

  const cancelEdit = () => {
    setEditableCell(null);
    setEditValue('');
    setEditAsciiIndex(null);
    setEditAsciiValue('');
    setEditingRow(null);
    setRowHexValue('');
    setEditingAsciiRow(null);
    setRowAsciiValue('');
    setPendingSave(null);
    setShowConfirmSave(false);
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      prepareSave();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Move to next cell
      if (colIndex < 15) {
        const nextColIndex = colIndex + 1;
        const nextValue = hexData[rowIndex].values[nextColIndex].value;
        setEditableCell({ rowIndex, colIndex: nextColIndex });
        setEditValue(nextValue);
      } else if (rowIndex < hexData.length - 1) {
        // Move to next row
        const nextRowIndex = rowIndex + 1;
        const nextValue = hexData[nextRowIndex].values[0].value;
        setEditableCell({ rowIndex: nextRowIndex, colIndex: 0 });
        setEditValue(nextValue);
      }
    }
  };

  const handleAsciiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, charIndex: number) => {
    if (e.key === 'Enter') {
      prepareSave();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Move to next character
      if (charIndex < 15) {
        const nextCharIndex = charIndex + 1;
        const nextChar = asciiRepresentation.charAt(rowIndex * 16 + nextCharIndex);
        setEditAsciiIndex({ rowIndex, charIndex: nextCharIndex });
        setEditAsciiValue(nextChar);
      } else if (rowIndex < hexData.length - 1) {
        // Move to next row
        const nextRowIndex = rowIndex + 1;
        const nextChar = asciiRepresentation.charAt(nextRowIndex * 16);
        setEditAsciiIndex({ rowIndex: nextRowIndex, charIndex: 0 });
        setEditAsciiValue(nextChar);
      }
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (e.key === 'Enter') {
      prepareSave();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleAsciiRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (e.key === 'Enter') {
      prepareSave();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editableCell || editAsciiIndex !== null || editingRow !== null || editingAsciiRow !== null) {
      cancelEdit();
    }
  };

  // Effect to update selectedBytes when selection changes
  useEffect(() => {
    if (!selectedRange || !hexData || hexData.length === 0) {
      setSelectedBytes(null);
      return;
    }

    try {
      // Calculate the absolute start and end offsets
      const start = selectedRange.start;
      const end = selectedRange.end;
      const length = end - start + 1;
      
      // Create a new byte array from the hex data
      const bytes = new Uint8Array(length);
      let byteIndex = 0;
      
      // Loop through each row of hex data
      for (let rowIndex = 0; rowIndex < hexData.length; rowIndex++) {
        const rowOffset = parseInt(hexData[rowIndex].offset, 16);
        const rowValues = hexData[rowIndex].values;
        
        // Check if this row contains any of our selected bytes
        for (let colIndex = 0; colIndex < rowValues.length; colIndex++) {
          const byteOffset = rowOffset + colIndex;
          
          // If this byte is within our selected range
          if (byteOffset >= start && byteOffset <= end) {
            // Convert the hex value to a byte
            const hexValue = rowValues[colIndex].value;
            bytes[byteIndex++] = parseInt(hexValue, 16);
          }
        }
      }
      
      setSelectedBytes(bytes);
      setSelectionLength(length);
    } catch (err) {
      console.error('Error creating byte array:', err);
      setSelectedBytes(null);
    }
  }, [selectedRange, hexData]);

  // Create new selection handling functions
  const handleCellMouseDown = (rowIndex: number, colIndex: number) => {
    if (editMode) return; // Don't allow selection in edit mode
    
    // Get the absolute offset of this cell
    const rowOffset = parseInt(hexData[rowIndex].offset, 16);
    const absOffset = rowOffset + colIndex;
    
    setSelectionStartCell({ rowIndex, colIndex });
    setSelectedCell({ rowIndex, colIndex });
    setSelectedRange({ start: absOffset, end: absOffset });
    setIsSelecting(true);
  };

  const handleCellMouseOver = (rowIndex: number, colIndex: number) => {
    if (!isSelecting || !selectionStartCell) return;
    
    // Get the absolute offset of this cell and the start cell
    const rowOffset = parseInt(hexData[rowIndex].offset, 16);
    const currentAbsOffset = rowOffset + colIndex;
    
    const startRowOffset = parseInt(hexData[selectionStartCell.rowIndex].offset, 16);
    const startAbsOffset = startRowOffset + selectionStartCell.colIndex;
    
    // Set the selected range from the start position to the current position
    // Ensure the range is ordered correctly
    const start = Math.min(startAbsOffset, currentAbsOffset);
    const end = Math.max(startAbsOffset, currentAbsOffset);
    
    setSelectedRange({ start, end });
    setSelectedCell({ rowIndex, colIndex });
  };

  const handleCellMouseUp = () => {
    setIsSelecting(false);
  };

  // Handle document-level mouseup to end selection even if mouseup happens outside the table
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };
    
    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isSelecting]);

  // Function to determine if a cell is selected
  const isCellSelected = (rowIndex: number, colIndex: number): boolean => {
    if (!selectedRange || !hexData) return false;
    
    const rowOffset = parseInt(hexData[rowIndex].offset, 16);
    const cellOffset = rowOffset + colIndex;
    
    return cellOffset >= selectedRange.start && cellOffset <= selectedRange.end;
  };

  return (
    <Stack gap="md">
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>Hex View {fileId ? ` - ${fileId.substring(0, 8)}...` : ''}</Text>
                <Group gap="xs">
                  <Button 
                    size="compact" 
                    variant="light" 
                    onClick={loadHexData}
                    disabled={!fileId || isLoading}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="compact"
                    variant={editMode ? "filled" : "light"}
                    color={editMode ? "red" : "blue"}
                    onClick={toggleEditMode}
                    disabled={!fileId || isLoading}
                  >
                    <IconEdit size={16} />
                    {editMode ? ' Exit Edit Mode' : ' Edit Mode'}
                  </Button>
                </Group>
              </Group>

              {error && (
                <Alert color="red" title="Error" withCloseButton onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {editMode && (
                <Alert color="yellow" title="Edit Mode">
                  WARNING: Editing binary data directly can corrupt the database file. Only proceed if you know what you're doing.
                </Alert>
              )}

              {/* Hex Editor Table */}
              <ScrollArea h={400} type="auto">
                {isLoading ? (
                  <Paper p="md" withBorder style={{ height: '100%' }}>
                    <Center style={{ height: '100%' }}>
                      <Loader size="lg" />
                    </Center>
                  </Paper>
                ) : hexData.length === 0 ? (
                  <Paper p="md" withBorder style={{ height: '100%' }}>
                    <Center style={{ height: '100%' }}>
                      <Text color="dimmed">No data available</Text>
                    </Center>
                  </Paper>
                ) : (
                  <ScrollArea>
                    <Box mb="md">
                      <Table striped highlightOnHover style={{ fontFamily: 'monospace' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '120px', borderRight: '1px solid #dee2e6' }}>Offset</th>
                            {Array.from({ length: 16 }).map((_, i) => (
                              <th key={i} style={{ width: '30px', textAlign: 'center' }}>
                                {i.toString(16).padStart(2, '0').toUpperCase()}
                              </th>
                            ))}
                            <th 
                              style={{ 
                                cursor: editMode ? 'pointer' : 'default',
                                borderLeft: '1px solid #dee2e6',
                                backgroundColor: editMode ? '#f8f9fa' : undefined,
                                textAlign: 'center',
                                width: '192px',
                                position: 'relative'
                              }}
                            >
                              {editMode && (
                                <div style={{ 
                                  position: 'absolute', 
                                  top: '0', 
                                  right: '5px',
                                  fontSize: '8px',
                                  color: '#666'
                                }}>
                                   Click to edit
                                </div>
                              )}
                              ASCII
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {hexData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              <td 
                                style={{ 
                                  cursor: editMode ? 'pointer' : 'default',
                                  backgroundColor: editingRow === rowIndex ? '#ffeb3b33' : undefined,
                                  borderRight: '1px solid #dee2e6'
                                }}
                                onClick={() => handleRowClick(rowIndex)}
                              >
                                <Code>{row.offset}</Code>
                              </td>
                              
                              {editingRow === rowIndex ? (
                                <td colSpan={16} style={{ padding: 0 }}>
                                  <TextInput
                                    value={rowHexValue}
                                    onChange={(e) => setRowHexValue(e.target.value.toUpperCase())}
                                    size="xs"
                                    placeholder="Enter space-separated hex values (e.g., 53 51 4C 69 74 65)"
                                    styles={{
                                      root: { margin: 0, height: '28px' },
                                      input: { 
                                        textAlign: 'left', 
                                        padding: '2px 8px',
                                        height: '28px',
                                        minHeight: '28px',
                                        fontFamily: 'monospace'
                                      }
                                    }}
                                    onKeyDown={(e) => handleRowKeyDown(e, rowIndex)}
                                    autoFocus
                                  />
                                </td>
                              ) : (
                                row.values.map((cell, colIndex) => (
                                  <td
                                    key={colIndex}
                                    style={{
                                      cursor: editMode ? 'pointer' : 'pointer',
                                      backgroundColor:
                                        editableCell?.rowIndex === rowIndex && editableCell?.colIndex === colIndex
                                          ? '#ffeb3b33'
                                          : isCellSelected(rowIndex, colIndex) 
                                          ? '#e7f5ff' // Light blue for selection
                                          : undefined,
                                      textAlign: 'center',
                                      padding: editableCell?.rowIndex === rowIndex && editableCell?.colIndex === colIndex ? '0' : '2px',
                                      minWidth: '30px',
                                      height: '28px',
                                      borderRight: colIndex === 15 ? '1px solid #dee2e6' : undefined,
                                      userSelect: 'none', // Prevent text selection
                                    }}
                                    onClick={() => handleCellClick(rowIndex, colIndex, cell.value)}
                                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                                    onMouseOver={() => handleCellMouseOver(rowIndex, colIndex)}
                                    onMouseUp={handleCellMouseUp}
                                  >
                                    {editableCell?.rowIndex === rowIndex && editableCell?.colIndex === colIndex ? (
                                      <TextInput
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                        size="xs"
                                        maxLength={2}
                                        styles={{
                                          root: { margin: 0, height: '28px' },
                                          input: { 
                                            textAlign: 'center', 
                                            padding: '2px',
                                            height: '28px',
                                            minHeight: '28px'
                                          }
                                        }}
                                        onKeyDown={(e) => handleHexKeyDown(e, rowIndex, colIndex)}
                                        autoFocus
                                      />
                                    ) : (
                                      cell.value
                                    )}
                                  </td>
                                ))
                              )}
                              
                              {editingRow === rowIndex ? (
                                <td style={{ borderLeft: '1px solid #dee2e6' }}></td> // Empty cell when editing a row
                              ) : editingAsciiRow === rowIndex ? (
                                <td style={{ padding: 0, borderLeft: '1px solid #dee2e6' }}>
                                  <TextInput
                                    value={rowAsciiValue}
                                    onChange={(e) => setRowAsciiValue(e.target.value.substring(0, 16))}
                                    size="xs"
                                    maxLength={16}
                                    placeholder="Enter ASCII text (up to 16 chars)"
                                    styles={{
                                      root: { margin: 0, height: '28px' },
                                      input: { 
                                        textAlign: 'left', 
                                        padding: '2px 8px',
                                        height: '28px',
                                        minHeight: '28px',
                                        fontFamily: 'monospace'
                                      }
                                    }}
                                    onKeyDown={(e) => handleAsciiRowKeyDown(e, rowIndex)}
                                    autoFocus
                                  />
                                </td>
                              ) : (
                                <td 
                                  style={{ 
                                    fontFamily: 'monospace',
                                    cursor: editMode ? 'pointer' : 'default',
                                    padding: '2px',
                                    backgroundColor: editMode ? 'rgba(232, 244, 253, 0.2)' : undefined,
                                    borderLeft: '1px solid #dee2e6'
                                  }}
                                  onClick={() => handleAsciiRowClick(rowIndex)}
                                  title={editMode ? "Click to edit entire ASCII row" : undefined}
                                >
                                  {!editAsciiIndex || editAsciiIndex.rowIndex !== rowIndex ? (
                                    <div 
                                      style={{ display: 'flex' }}
                                    >
                                      {asciiRepresentation.substring(rowIndex * 16, rowIndex * 16 + 16).split('').map((char, i) => (
                                        <div 
                                          key={i} 
                                          style={{ 
                                            width: '12px', 
                                            textAlign: 'center',
                                            cursor: editMode ? 'pointer' : 'pointer',
                                            backgroundColor: isCellSelected(rowIndex, i) ? '#e7f5ff' : undefined,
                                            userSelect: 'none',
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAsciiClick(rowIndex, i, char);
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleCellMouseDown(rowIndex, i);
                                          }}
                                          onMouseOver={() => handleCellMouseOver(rowIndex, i)}
                                        >
                                          {char}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex' }}>
                                      {asciiRepresentation.substring(rowIndex * 16, rowIndex * 16 + 16).split('').map((char, i) => (
                                        <div 
                                          key={i} 
                                          style={{ 
                                            width: '12px', 
                                            textAlign: 'center',
                                            backgroundColor: editAsciiIndex?.charIndex === i ? '#ffeb3b33' : undefined,
                                            cursor: editMode ? 'pointer' : 'default'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAsciiClick(rowIndex, i, char);
                                          }}
                                        >
                                          {editAsciiIndex?.charIndex === i ? (
                                            <TextInput
                                              value={editAsciiValue}
                                              onChange={(e) => setEditAsciiValue(e.target.value.charAt(0))}
                                              size="xs"
                                              maxLength={1}
                                              styles={{
                                                root: { margin: 0, width: '12px', height: '28px' },
                                                input: { 
                                                  textAlign: 'center', 
                                                  padding: '2px',
                                                  height: '28px',
                                                  minHeight: '28px',
                                                  width: '12px'
                                                }
                                              }}
                                              onKeyDown={(e) => handleAsciiKeyDown(e, rowIndex, i)}
                                              autoFocus
                                            />
                                          ) : (
                                            char
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Box>
                  </ScrollArea>
                )}
              </ScrollArea>

              {/* Navigation Controls */}
              <Group justify="space-between">
                <Button 
                  size="compact"
                  onClick={handlePrevPage} 
                  disabled={!hexData || offset === 0 || isLoading}
                >
                  Previous Page
                </Button>
                <Text>
                  {hexData ? `Page ${offset / length + 1} of ${Math.ceil(hexData.length / length)}` : ''}
                </Text>
                <Button 
                  size="compact"
                  onClick={handleNextPage}
                  disabled={!hexData || offset + length >= hexData.length || isLoading}
                >
                  Next Page
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <SearchTools 
            fileId={fileId} 
            currentOffset={selectedRange ? selectedRange.start : 0}
            onGoToOffset={(offset) => {
              setSelectedRange({ start: offset, end: offset + 15 });
              setOffset(offset);
              loadHexData();
            }} 
          />
        </Grid.Col>
      </Grid>

      <Modal
        opened={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        title="Confirm Changes"
        size="sm"
      >
        <Text>Are you sure you want to save these changes? This will modify the binary data of your file.</Text>
        {(pendingSave?.type === 'row' || pendingSave?.type === 'ascii-row') && (
          <Alert mt="sm" color="orange">
            You are modifying multiple bytes at once. This can significantly impact the file structure.
          </Alert>
        )}
        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={cancelEdit}>
            Cancel
          </Button>
          <Button color="red" onClick={saveEdit}>
            Yes, Save Changes
          </Button>
        </Group>
      </Modal>
      
      <Divider my="sm" />
      
      <Text size="sm" color="dimmed">
        This hex editor allows you to view and modify the binary content of the SQLite database file.
        Editing the binary data directly should only be done by advanced users who understand the SQLite file format.
      </Text>

      {/* Add Data Inspector component */}
      <DataInspector 
        fileId={fileId}
        selectedOffset={selectedRange ? selectedRange.start : null}
        selectionLength={selectionLength}
        hexData={selectedBytes}
      />
    </Stack>
  );
} 