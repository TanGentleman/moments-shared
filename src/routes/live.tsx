// import { convexQuery, useConvexAction } from '@convex-dev/react-query'
// import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
// import { api } from '../../convex/_generated/api'
import { formatDate } from '../utils/dashboard'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowRight, RefreshCw, Calendar } from 'lucide-react'

const TIMEZONE = import.meta.env.VITE_TIMEZONE || "UTC";
// Navigation component for previous/next entries
function NavigationControls() {
  return (
    <div className="flex items-center space-x-4">
      <button
        disabled={true} // Enable when you implement pagination
        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>
      <button
        disabled={true} // Enable when you implement pagination
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

function Live() {
  const [isSyncing, setIsSyncing] = useState(false)
  
  // TODO: Replace with actual Convex query when functions are added
  // const { data } = useSuspenseQuery(convexQuery(api.queries.getPreviewLifelog, {}))
  const data = {
    title: "Sample Lifelog Entry",
    markdown: `# Discussing a toothache and accidentally waking someone up.
## Toothache
> my teeth definitely in the pain yesterday.
> Sorry.
## Accidentally waking someone up
> Oh, I accidentally woke him.`,
    startTime: new Date().toISOString()
  }
  
  // TODO: Replace with actual Convex action when functions are added
  // const syncAction = useConvexAction(api.actions.sync)
  
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // TODO: Replace with actual sync action
      // await syncAction({ sendNotification: true })
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      console.log('Synced')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 text-white flex items-center justify-center">
        No data available
      </div>
    )
  }
  
  const removeTitle = true
  // Only strip the title if needed, do not apply Slack formatting
  const formattedMarkdown = data.markdown
    ? (removeTitle
        ? data.markdown.split('\n').slice(1).join('\n')
        : data.markdown)
    : ''
  const creationDate = new Date(data.startTime)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation and Sync Bar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl p-4 flex items-center justify-between">
            <NavigationControls />
            <DateDisplay date={creationDate} />
            <SyncButton onSync={handleSync} isSyncing={isSyncing} />
          </div>

          {/* Journal Content */}
          <LifelogContent 
            title={data.title} 
            markdown={formattedMarkdown} 
          />

          {/* Entry Counter - Will be enabled when pagination is implemented */}
          <div className="mt-4 text-center text-white/80 text-sm font-medium">
            Entry 1 of 1
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/live')({
  component: Live,
})