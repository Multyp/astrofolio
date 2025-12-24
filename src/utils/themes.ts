export interface Theme {
  id: string;
  name: string;
  icon: string;
  colors: {
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    
    // Border colors
    borderPrimary: string;
    borderSecondary: string;
    
    // Accent colors
    accentPrimary: string;
    accentSecondary: string;
    accentHover: string;
    
    // Sidebar specific
    sidebarBg: string;
    sidebarText: string;
    sidebarHover: string;
    sidebarActive: string;
    sidebarActiveBg: string;
    
    // Code blocks
    codeBg: string;
    codeText: string;
    codeInline: string;
    
    // Link colors
    linkColor: string;
    linkHover: string;
    
    // Shadow
    shadow: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    icon: '☀️',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
      
      borderPrimary: '#e5e7eb',
      borderSecondary: '#d1d5db',
      
      accentPrimary: '#6366f1',
      accentSecondary: '#818cf8',
      accentHover: '#4f46e5',
      
      sidebarBg: '#ffffff',
      sidebarText: '#374151',
      sidebarHover: '#f9fafb',
      sidebarActive: '#312e81',
      sidebarActiveBg: '#e0e7ff',
      
      codeBg: '#1f2937',
      codeText: '#f3f4f6',
      codeInline: '#f3f4f6',
      
      linkColor: '#6366f1',
      linkHover: '#4f46e5',
      
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    icon: '🌙',
    colors: {
      bgPrimary: '#1f2937',
      bgSecondary: '#111827',
      bgTertiary: '#0f172a',
      
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      textTertiary: '#9ca3af',
      
      borderPrimary: '#374151',
      borderSecondary: '#4b5563',
      
      accentPrimary: '#818cf8',
      accentSecondary: '#a5b4fc',
      accentHover: '#6366f1',
      
      sidebarBg: '#111827',
      sidebarText: '#d1d5db',
      sidebarHover: '#1f2937',
      sidebarActive: '#e0e7ff',
      sidebarActiveBg: '#312e81',
      
      codeBg: '#0f172a',
      codeText: '#e5e7eb',
      codeInline: '#374151',
      
      linkColor: '#a5b4fc',
      linkHover: '#c7d2fe',
      
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },
  // Add more themes here easily:
  // {
  //   id: 'ocean',
  //   name: 'Ocean',
  //   icon: '🌊',
  //   colors: {
  //     bgPrimary: '#0c4a6e',
  //     bgSecondary: '#075985',
  //     // ... etc
  //   },
  // },
];

export const defaultTheme = 'light';

export function getTheme(id: string): Theme | undefined {
  return themes.find(theme => theme.id === id);
}

export function getThemeOrDefault(id: string | null): Theme {
  if (!id) return themes.find(t => t.id === defaultTheme)!;
  return getTheme(id) || themes.find(t => t.id === defaultTheme)!;
}
