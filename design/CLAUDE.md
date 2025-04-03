# BPRD Project Guidelines

## Build Commands
- `npm run dev` - Start development server (localhost:4321)
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview build locally
- No explicit test/lint commands found in package.json

## Code Style Guidelines
- **Framework**: Astro with React components and Tailwind CSS
- **Component Structure**: Each component in own directory with index.jsx and supporting files
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Imports**: React first, then dependencies, then local components
- **Types**: Uses TypeScript configuration with strict mode
- **Formatting**: Consistent indentation, multiline JSX with parentheses
- **Styling**: Tailwind CSS with custom color variables and dark mode support
- **Props**: Destructure at parameter level, use JSDoc for documentation
- **Conditionals**: Ternary operators or logical && for conditional rendering
- **State Management**: React hooks with functional components
- **Error Handling**: Early validation with descriptive error messages

## Common Patterns
- Consistent composition with base/wrapper component architecture
- Template literals for dynamic className composition
- Mobile-first responsive design approach