import { createFileRoute } from '@tanstack/react-router'

function Live() {
  return (
    <html>
      <head>
        {/* Add your head content here */}
      </head>
      <body className="bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-4xl font-bold text-white">
            Welcome to Live Mode! (This is where lifelogs will be rendered)
          </h1>
        </div>
      </body>
    </html>
  )
}

export const Route = createFileRoute('/live')({
  component: Live,
}) 