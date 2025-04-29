import { createTheme } from '@mantine/core';

// Define a high-contrast theme with improved visibility
const theme = createTheme({
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  
  headings: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.3' },
      h2: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.35' },
      h3: { fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.4' },
      h4: { fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.45' },
      h5: { fontSize: '1rem', fontWeight: '700', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.5' },
    },
  },
  
  // Make text darker and more visible
  black: '#000000',
  white: '#FFFFFF',
  
  // Enhanced color palette with more contrast
  colors: {
    blue: ['#e6f5ff', '#ccebff', '#99d6ff', '#66c2ff', '#33adff', '#0099ff', '#007acc', '#005c99', '#003d66', '#001f33'],
    red: ['#ffebeb', '#ffd6d6', '#ffadad', '#ff8585', '#ff5c5c', '#ff3333', '#cc0000', '#990000', '#660000', '#330000'],
    green: ['#ebfaeb', '#d6f5d6', '#adebad', '#85e085', '#5cd65c', '#33cc33', '#29a329', '#1f7a1f', '#145214', '#0a290a'],
    yellow: ['#fffce6', '#fff9cc', '#fff399', '#ffec66', '#ffe533', '#ffde00', '#ccb200', '#998600', '#665900', '#332d00'],
    gray: ['#f9f9f9', '#f2f2f2', '#e6e6e6', '#cccccc', '#b3b3b3', '#999999', '#666666', '#4d4d4d', '#333333', '#1a1a1a'],
  },
  
  // Component-specific styles for better visibility
  components: {
    Text: {
      defaultProps: {
        fw: 500,
        c: 'black',
      },
    },
    Title: {
      defaultProps: {
        fw: 700,
        c: 'black',
      },
    },
    Button: {
      defaultProps: {
        fw: 600,
      },
      styles: {
        root: {
          // Make buttons more visible
          borderWidth: '1px',
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        withBorder: true,
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        withBorder: true,
      },
    },
    Table: {
      styles: {
        root: {
          'th': { fontWeight: 700, color: '#000' },
          'td': { fontWeight: 500, color: '#000' },
        },
      },
    },
    Badge: {
      defaultProps: {
        fw: 600,
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 600,
        },
      },
    },
    Alert: {
      styles: {
        title: {
          fontWeight: 700,
        },
        message: {
          fontWeight: 500,
        },
      },
    },
  },
  
  // Global defaults
  defaultRadius: 'md',
  primaryColor: 'blue',
});

export default theme; 