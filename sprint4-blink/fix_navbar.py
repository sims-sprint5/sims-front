import re

fpath = "src/layouts/components/Navbar.vue"
with open(fpath, "r", encoding="utf-8") as f:
    text = f.read()

replacements = {
    r'bg-white': 'bg-navbar-bg',
    r'text-gray-900': 'text-main',
    r'text-gray-800': 'text-main',
    r'text-gray-700': 'text-main',
    r'text-gray-600': 'text-muted',
    r'text-gray-500': 'text-muted',
    r'text-gray-400': 'text-muted',
    r'border-gray-200': 'border-nav',
    r'border-gray-300': 'border-default',
    r'border-gray-100': 'border-default',
    r'bg-gray-50': 'bg-base',
    r'bg-gray-100': 'bg-surface-muted',
    r'bg-gray-200': 'bg-surface-dark',
    r'bg-blue-600': 'bg-primary',
    r'bg-primary-600': 'bg-primary',
    r'hover:bg-blue-700': 'hover:bg-primary-hover',
    r'hover:bg-primary-700': 'hover:bg-primary-hover',
    r'text-white': 'text-inverse',
    r'bg-green-600': 'bg-success',
    r'hover:bg-green-700': 'hover:bg-success/90',
    r'bg-red-600': 'bg-danger',
    r'hover:bg-red-700': 'hover:bg-danger/90',
    r'bg-amber-50': 'bg-warning/10',
    r'border-amber-300': 'border-warning',
    r'text-amber-900': 'text-warning-dark',
    r'text-amber-700': 'text-warning-dark',
    r'text-amber-800': 'text-warning-dark',
    r'text-blue-600': 'text-primary',
    r'text-red-600': 'text-danger',
    r'text-green-600': 'text-success',
    r'text-yellow-600': 'text-warning',
    r'bg-blue-50': 'bg-primary/10',
    r'bg-red-50': 'bg-danger/10',
    r'focus:border-blue-500': 'focus:border-primary-500',
    r'focus:ring-blue-500': 'focus:ring-primary-500',
    r'border-purple-200': 'border-default',
    r'text-purple-700': 'text-primary',
    r'bg-purple-600': 'bg-primary',
    r'from-blue-500': 'from-primary',
    r'to-purple-600': 'to-surface-inverse',
}

for old, new in replacements.items():
    text = re.sub(r'\b' + old + r'\b', new, text)

with open(fpath, "w", encoding="utf-8") as f:
    f.write(text)

print("Applied replacements")
