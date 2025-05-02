import { useConvexQuery } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { formatDate } from '../utils/dashboard'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowRight, RefreshCw, Calendar } from 'lucide-react'

const TIMEZONE = import.meta.env.VITE_TIMEZONE || "UTC";

// Navigation component for previous/next entries
function NavigationControls({ 
  onPrev, 
  onNext, 
  hasPrev, 
  hasNext 
}: { 
  onPrev: () => void, 
  onNext: () => void, 
  hasPrev: boolean, 
  hasNext: boolean 
}) {
  return (
    <div className="flex items-center space-x-4">
      <button
        disabled={!hasPrev}
        onClick={onPrev}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>
      <button
        disabled={!hasNext}
        onClick={onNext}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRight className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

// Date display component
function DateDisplay({ date }: { date: Date | number | string }) {
  return (
    <div className="flex items-center space-x-2 text-white">
      <Calendar className="w-5 h-5" />
      <span className="text-sm font-medium">
        {formatDate(date, TIMEZONE)}
      </span>
    </div>
  )
}

// Sync button component
function SyncButton({ onSync, isSyncing }: { onSync: () => Promise<void>, isSyncing: boolean }) {
  return (
    <button
      onClick={onSync}
      className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
        isSyncing ? 'animate-spin' : ''
      }`}
      disabled={isSyncing}
    >
      <RefreshCw className="w-6 h-6 text-white" />
    </button>
  )
}

// Typography components for better contrast and readability
function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-3xl font-bold text-white mb-4">
      {children}
    </h1>
  )
}

function EmptyContent() {
  return <p className="text-white/80 italic">No content available</p>
}

// Content display component with improved typography
function LifelogContent({ title, markdown }: { title: string | undefined, markdown: string }) {
  // Render the entire markdown string at once for proper formatting
  if (!markdown) {
    return (
      <div className="bg-white/5 rounded-b-2xl shadow-xl">
        <div className="p-8">
          <Title>{title || 'Untitled Lifelog'}</Title>
          <EmptyContent />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-b-2xl shadow-xl">
      <div className="p-8">
        <Title>{title || 'Untitled Lifelog'}</Title>
        <div className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-white prose-li:text-white prose-strong:text-white prose-em:text-white">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function LiveContent() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  
  // Handle syncing action
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      console.log('Synced')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Use the new paginated query
  const result = useConvexQuery(api.queries.getPaginatedApprovedLifelogs, {
    cursor: cursor,
    limit: 1
  })

  // Handle navigation
  const goToNextEntry = () => {
    if (result?.continueCursor) {
      setPreviousCursors([...previousCursors, cursor as string])
      setCursor(result.continueCursor)
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevEntry = () => {
    if (previousCursors.length > 0) {
      // Get the last cursor from the previous ones
      const newCursors = [...previousCursors]
      const prevCursor = newCursors.pop()
      
      // Update state
      setPreviousCursors(newCursors)
      setCursor(prevCursor)
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle loading state
  if (result === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  // Handle empty state
  if (result === null || !result.lifelogs || result.lifelogs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 text-white flex items-center justify-center">
        No approved entries available
      </div>
    )
  }

  const currentLifelog = result.lifelogs[0]
  const totalEntries = result.totalCount || 0
  const removeTitle = true
  
  // Format markdown
  const formattedMarkdown = currentLifelog.markdown
    ? (removeTitle
        ? currentLifelog.markdown.split('\n').slice(1).join('\n')
        : currentLifelog.markdown)
    : ''
  
  const creationDate = new Date(currentLifelog.startTime)

  // Determine if we have previous or next entries
  const hasPrevious = previousCursors.length > 0
  const hasNext = !!result.continueCursor

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation and Sync Bar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl p-4 flex items-center justify-between">
            <NavigationControls 
              onPrev={goToPrevEntry} 
              onNext={goToNextEntry}
              hasPrev={hasPrevious}
              hasNext={hasNext}
            />
            <DateDisplay date={creationDate} />
            <SyncButton onSync={handleSync} isSyncing={isSyncing} />
          </div>

          {/* Journal Content */}
          <LifelogContent 
            title={currentLifelog.title} 
            markdown={formattedMarkdown} 
          />

          {/* Entry Counter */}
          <div className="mt-4 text-center text-white/80 text-sm font-medium">
            Entry {currentPage + 1} of {totalEntries}
          </div>
        </div>
      </div>
    </div>
  )
} 