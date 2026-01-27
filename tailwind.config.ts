import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      blur: {
        '3xl': '120px',
      },
      minHeight: {
        'card': '300px',
        'card-lg': '400px',
      },
      colors: {
        background: '#09090b',
        surface: {
          DEFAULT: '#18181b',
          highlight: '#27272a',
          dark: '#141416',
          darker: '#0d0d0f',
          darkest: '#0a0a0c',
        },
        primary: '#3b82f6',
        accent: '#8b5cf6',
        waveform: {
          purple: 'rgba(168, 85, 247, 0.5)',
          blue: 'rgba(59, 130, 246, 0.5)',
        },
        clip: {
          amber: 'rgba(245, 158, 11, 0.8)',
          blue: 'rgba(59, 130, 246, 0.8)',
        },
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'flame-pulse': {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.3))', opacity: '1' },
          '50%': { transform: 'scale(1.1)', filter: 'drop-shadow(0 0 30px rgba(249, 115, 22, 0.6))', opacity: '0.9' },
        },
        'slide-in-stagger': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'chat-loop': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.9)' },
          '10%, 90%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-10px) scale(0.9)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-rec': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        equalizer: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pan-vertical': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59,130,246,0.6)', opacity: '0.8' },
          '50%': { boxShadow: '0 0 20px rgba(59,130,246,1)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-25%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-25%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        bob: 'bob 2.5s ease-in-out infinite',
        flame: 'flame-pulse 2.5s ease-in-out infinite',
        'slide-in': 'slide-in-stagger 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'chat-loop': 'chat-loop 4s ease-in-out infinite',
        typing: 'typing 3s steps(40, end) infinite alternate',
        blink: 'blink-rec 1.5s step-start infinite',
        equalizer: 'equalizer 0.8s ease-in-out infinite',
        'pan-vertical': 'pan-vertical 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        marquee: 'marquee 50s linear infinite',
        'marquee-reverse': 'marquee-reverse 50s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
