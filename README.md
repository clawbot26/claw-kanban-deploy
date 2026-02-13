# Kanban Board - Task Management Application

A modern, fully-featured Kanban board application built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **React**. Perfect for tracking work tasks and managing projects with an intuitive drag-and-drop interface.

## 🎯 Features

### Core Functionality
- ✅ **4-Column Kanban Board**: Backlog → In Progress → Pending Review → Done
- ✅ **Drag & Drop**: Smooth, responsive drag-and-drop between columns using `dnd-kit`
- ✅ **Task Management**: Create, read, update, and delete tasks
- ✅ **Priority Levels**: Low, Medium, High, Urgent with visual indicators
- ✅ **Task Assignment**: Assign tasks to team members
- ✅ **Timestamps**: Track creation and update times with relative dates
- ✅ **Task Details**: Comprehensive task view with edit capabilities
- ✅ **Delete Confirmation**: Safe deletion with confirmation modal

### User Experience
- ✅ **Dark Mode**: Full dark mode support with system preference detection
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Touch Support**: Mobile-friendly drag-and-drop with touch support
- ✅ **Loading States**: Visual feedback for async operations
- ✅ **Error Handling**: User-friendly error messages with toast notifications
- ✅ **Smooth Animations**: Elegant transitions and animations throughout
- ✅ **Accessibility**: Proper ARIA labels and keyboard navigation

### Developer Experience
- ✅ **TypeScript**: Full type safety with strict mode enabled
- ✅ **Clean Architecture**: Well-organized component and API structure
- ✅ **State Management**: Zustand for efficient state management
- ✅ **API Routes**: RESTful API endpoints for all operations
- ✅ **Database Layer**: Abstracted database functions ready for database integration
- ✅ **In-Memory Storage**: Sample data and in-memory persistence (ready for DB migration)
- ✅ **2nd Brain Ready**: Structured for easy integration with memory/memo systems

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to the project directory
cd kanban-board

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
kanban-board/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts           # GET /api/tasks, POST /api/tasks
│   │   │       └── [id]/
│   │   │           └── route.ts       # GET, PUT, DELETE /api/tasks/:id
│   │   ├── layout.tsx                 # Root layout with dark mode setup
│   │   ├── globals.css                # Global styles and animations
│   │   └── page.tsx                   # Main page component
│   ├── components/
│   │   ├── KanbanBoard.tsx            # Main board container with DnD context
│   │   ├── KanbanColumn.tsx           # Column component with droppable zone
│   │   ├── TaskCard.tsx               # Individual task card (draggable)
│   │   ├── CreateTaskModal.tsx        # Modal for creating new tasks
│   │   ├── TaskDetails.tsx            # Modal for viewing/editing task details
│   │   ├── DeleteConfirmModal.tsx     # Confirmation dialog for deletion
│   │   └── ThemeToggle.tsx            # Dark mode toggle button
│   └── lib/
│       ├── db.ts                      # Database layer (CRUD operations)
│       ├── store.ts                   # Zustand state management
│       └── utils.ts                   # Utility functions and constants
├── public/                             # Static assets
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── next.config.ts                     # Next.js configuration
├── .env.example                       # Environment template
└── README.md                          # This file
```

## 🔌 API Endpoints

### Tasks

#### Get All Tasks
```
GET /api/tasks?status=backlog
```
Query parameters:
- `status` (optional): Filter by status (backlog, in-progress, pending-review, done)

Response:
```json
{
  "success": true,
  "data": [Task],
  "count": 1
}
```

#### Get Single Task
```
GET /api/tasks/:id
```

Response:
```json
{
  "success": true,
  "data": Task
}
```

#### Create Task
```
POST /api/tasks
```

Request body:
```json
{
  "title": "Task Title",
  "description": "Task description",
  "priority": "high",
  "assignee": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "data": Task
}
```

#### Update Task
```
PUT /api/tasks/:id
```

Request body (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "assignee": "Jane Doe"
}
```

Response:
```json
{
  "success": true,
  "data": Task
}
```

#### Delete Task
```
DELETE /api/tasks/:id
```

Response:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## 🗄️ Data Schema

### Task Object
```typescript
interface Task {
  id: string;                    // Unique identifier
  title: string;                 // Task title
  description: string;           // Task description
  status: TaskStatus;            // backlog | in-progress | pending-review | done
  priority: TaskPriority;        // low | medium | high | urgent
  assignee?: string;             // Optional assignee name
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

## 🎨 Theming

### Dark Mode
The application automatically detects system preference and allows manual toggle:
- **Light Mode**: Clean white background with gray accents
- **Dark Mode**: Dark backgrounds with careful color contrast
- **Preference Detection**: Respects `prefers-color-scheme` media query
- **Persistence**: Theme preference saved to localStorage

### Colors & Styling
- **Tailwind CSS**: Complete design system with dark mode support
- **Custom Colors**: Semantic color palette for priorities and statuses
- **Animations**: Smooth transitions for all interactive elements

## 🤝 Integration with 2nd Brain

The project is structured for easy integration with a memory/memo system:

### Current Structure
- Database layer (`lib/db.ts`) is abstraction-friendly
- API endpoints are RESTful and can easily connect to external services
- Task objects include fields for integration (assignee, description for context)

### Future Integration Steps

1. **Add 2nd Brain API Integration**
```typescript
// In lib/db.ts, add:
export async function importMemoryAsTask(memoryId: string) {
  const memory = await fetch(`${process.env.BRAIN_API_URL}/memories/${memoryId}`);
  // Convert memory to task
}
```

2. **Extend Task Schema**
```typescript
interface Task {
  // ... existing fields
  brainMemoryId?: string;      // Link to 2nd Brain memory
  relatedMemories?: string[];  // Array of related memory IDs
}
```

3. **Add Task-to-Memory Sync**
```typescript
// Sync completed tasks back to memories
export async function syncCompletedTasks() {
  const doneTasks = getAllTasks("done");
  // Update related memories with completion status
}
```

### Environment Variables for 2nd Brain
```env
BRAIN_API_URL=http://localhost:3001/api
BRAIN_API_KEY=your-api-key
```

## 🛠️ Development

### Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Adding New Components
1. Create component in `src/components/`
2. Use client-side components with `"use client"` directive
3. Export types from `lib/db.ts`
4. Use Zustand store for state management

### Modifying Database Schema
1. Update types in `lib/db.ts`
2. Update CRUD functions in `lib/db.ts`
3. Update API route validators
4. Update component prop types

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🎯 Performance

- **Bundle Size**: Optimized with Next.js 15 tree-shaking
- **Images**: Optimized with Next.js Image component (configured for unoptimized for flexibility)
- **SSR**: Server-side rendering for fast initial load
- **ISR**: Incremental Static Regeneration ready
- **Caching**: Strategic caching of API responses

## 🔒 Security

- **Input Validation**: All API inputs validated
- **XSS Protection**: React's built-in XSS protection
- **CSRF Ready**: Can add CSRF tokens to API routes
- **TypeScript**: Type safety prevents runtime errors

## 📝 Environment Configuration

Create `.env.local` with:
```env
# Database (for future implementation)
DATABASE_URL="file:./dev.db"

# Optional: 2nd Brain Integration
BRAIN_API_URL="http://localhost:3001/api"
BRAIN_API_KEY="your-api-key"
```

## 🐛 Troubleshooting

### Tasks not persisting after refresh?
- This is expected with in-memory storage. For persistence, implement database in `lib/db.ts`.

### Dark mode not applying?
- Clear localStorage and refresh
- Check browser DevTools for `dark` class on `<html>` element

### Drag and drop not working on mobile?
- Ensure touch events are enabled
- Test on actual mobile device (some touchpad emulation has issues)

## 🚀 Next Steps

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL/SQLite
   - Use Prisma or another ORM

2. **Authentication**
   - Add NextAuth.js or similar
   - Implement user-based task filtering

3. **Collaboration Features**
   - Real-time updates with WebSockets
   - Comment system on tasks
   - Activity feed

4. **Advanced Filtering**
   - Search across tasks
   - Multiple filtering criteria
   - Custom views/saved filters

5. **2nd Brain Integration**
   - Sync with memory system
   - Auto-create tasks from notes
   - Task-to-memory linking

## 📄 License

MIT

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Create a Pull Request

## 📞 Support

For issues and feature requests, please open an issue in the repository.

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**
