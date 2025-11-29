import { getArticles, getStates } from '@/lib/supabase'

export default async function TestPage() {
  try {
    // Test queries
    const articles = await getArticles(5)
    const states = await getStates()

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">States ({states.length})</h2>
          <ul className="list-disc pl-6">
            {states.slice(0, 5).map((state) => (
              <li key={state.id}>
                {state.name} ({state.abbreviation})
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Articles ({articles.length})</h2>
          <ul className="list-disc pl-6">
            {articles.map((article) => (
              <li key={article.id}>{article.title}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 p-4 bg-green-100 rounded">
          ✅ Supabase connection working!
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">Connection Error</h1>
        <pre className="bg-red-50 p-4 rounded">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    )
  }
}

