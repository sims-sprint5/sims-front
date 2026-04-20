/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-main)'],
      },
      borderColor: {
        default: 'rgb(var(--color-border-default) / <alpha-value>)',
        nav: 'rgb(var(--color-border-nav) / <alpha-value>)',
        divider: 'rgb(var(--color-divider))',
      },
      outlineColor: {
        default: 'rgb(var(--color-input-border))',
        focus: 'rgb(var(--color-input-focus))',
      },
      ringColor: {
        'input-focus': 'rgb(var(--color-input-focus))',
      },
      colors: {
        base: {
          DEFAULT: 'rgb(var(--color-bg-base) / <alpha-value>)',
          dark: 'rgb(var(--color-bg-base-dark) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-surface-inverse) / <alpha-value>)',
        },
        main: 'rgb(var(--color-text-main) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border-default) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        'status-pending': {
          bg: 'rgb(var(--color-status-pending-bg) / <alpha-value>)',
          text: 'rgb(var(--color-status-pending-text) / <alpha-value>)',
        },
        'status-in-progress': {
          bg: 'rgb(var(--color-status-in-progress-bg) / <alpha-value>)',
          text: 'rgb(var(--color-status-in-progress-text) / <alpha-value>)',
        },
        'status-active': {
          bg: 'rgb(var(--color-status-active-bg) / <alpha-value>)',
          text: 'rgb(var(--color-status-active-text) / <alpha-value>)',
        },
        'status-completed': {
          bg: 'rgb(var(--color-status-completed-bg) / <alpha-value>)',
          text: 'rgb(var(--color-status-completed-text) / <alpha-value>)',
        },
        'status-cancelled': {
          bg: 'rgb(var(--color-status-cancelled-bg) / <alpha-value>)',
          text: 'rgb(var(--color-status-cancelled-text) / <alpha-value>)',
        },
        'status-expired': 'rgb(var(--color-status-expired) / <alpha-value>)',
        'status-renew': 'rgb(var(--color-status-renew) / <alpha-value>)',
        'modal-danger': {
          bg: 'rgb(var(--color-modal-danger-bg) / <alpha-value>)',
          text: 'rgb(var(--color-modal-danger-text) / <alpha-value>)',
        },
        'modal-success': {
          bg: 'rgb(var(--color-modal-success-bg) / <alpha-value>)',
          text: 'rgb(var(--color-modal-success-text) / <alpha-value>)',
        },
        'modal-info': {
          bg: 'rgb(var(--color-modal-info-bg) / <alpha-value>)',
          text: 'rgb(var(--color-modal-info-text) / <alpha-value>)',
        },
        'toast-success': {
          bg: 'rgb(var(--color-toast-success-bg) / <alpha-value>)',
          text: 'rgb(var(--color-toast-success-text) / <alpha-value>)',
          border: 'rgb(var(--color-toast-success-border) / <alpha-value>)',
        },
        'toast-error': {
          bg: 'rgb(var(--color-toast-error-bg) / <alpha-value>)',
          text: 'rgb(var(--color-toast-error-text) / <alpha-value>)',
          border: 'rgb(var(--color-toast-error-border) / <alpha-value>)',
        },
        'toast-warning': {
          bg: 'rgb(var(--color-toast-warning-bg) / <alpha-value>)',
          text: 'rgb(var(--color-toast-warning-text) / <alpha-value>)',
          border: 'rgb(var(--color-toast-warning-border) / <alpha-value>)',
        },
        'vehicle-available': {
          bg: 'rgb(var(--color-vehicle-available-bg) / <alpha-value>)',
          text: 'rgb(var(--color-vehicle-available-text) / <alpha-value>)',
          ring: 'rgb(var(--color-vehicle-available-ring) / <alpha-value>)',
          bar: 'rgb(var(--color-vehicle-available-bar) / <alpha-value>)',
        },
        'vehicle-maintenance': {
          bg: 'rgb(var(--color-vehicle-maintenance-bg) / <alpha-value>)',
          text: 'rgb(var(--color-vehicle-maintenance-text) / <alpha-value>)',
          ring: 'rgb(var(--color-vehicle-maintenance-ring) / <alpha-value>)',
          bar: 'rgb(var(--color-vehicle-maintenance-bar) / <alpha-value>)',
        },
        'vehicle-reserved': {
          bg: 'rgb(var(--color-vehicle-reserved-bg) / <alpha-value>)',
          text: 'rgb(var(--color-vehicle-reserved-text) / <alpha-value>)',
          ring: 'rgb(var(--color-vehicle-reserved-ring) / <alpha-value>)',
          bar: 'rgb(var(--color-vehicle-reserved-bar) / <alpha-value>)',
        },
        input: {
          bg: 'rgb(var(--color-input-bg) / <alpha-value>)',
        }
      },
    },
  },
  plugins: [],
}