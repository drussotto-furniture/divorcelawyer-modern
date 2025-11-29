import Link from 'next/link'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-lg shadow">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-bold text-gray-900">Unauthorized Access</h1>
        <p className="text-gray-600">
          You don't have permission to access this area. Please contact an administrator if you believe this is an error.
        </p>
        <div className="space-y-3">
          <Link
            href="/admin/login"
            className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}

