'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Button, Container, Paper, Text, Alert, Code, Stack } from '@mantine/core';

export default function DebugPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(API_BASE_URL);
  }, []);

  const testApiConnection = async () => {
    setTestResult(null);
    setError(null);
    
    try {
      // Test our API proxy
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.text();
      setTestResult({ 
        success: true, 
        message: "API proxy route is working",
        data
      });
    } catch (err) {
      console.error("API connection error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTestResult({ 
        success: false, 
        message: "API connection failed"
      });
    }
  };

  return (
    <Container size="md" py="xl">
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text size="xl" fw={700}>API Debug Page</Text>
          
          <div>
            <Text>Current API_BASE_URL:</Text>
            <Code block>{apiUrl}</Code>
          </div>
          
          <div>
            <Text>Browser location:</Text>
            <Code block>{typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}</Code>
          </div>
          
          <Button onClick={testApiConnection}>
            Test API Connection
          </Button>
          
          {testResult && (
            <Alert color={testResult.success ? 'green' : 'red'} title={testResult.message}>
              {testResult.data && <Code block>{testResult.data}</Code>}
            </Alert>
          )}
          
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
} 