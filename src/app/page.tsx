
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Database Chat Assistant
          </h1>
          <p className="text-gray-600">
            Intelligent search-powered conversations with your database
          </p>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-lg border overflow-hidden">
          <ChatInterface />
        </div>

        <div className="text-center mt-4 text-sm text-gray-500">
          Built with React + TypeScript • Ready for Next.js integration
        </div>
      </div>
    </div>
  );
}
