'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface MediaItem {
  id: string
  filename: string
  original_url: string
  storage_url: string | null
  mime_type: string | null
  file_size_bytes: number | null
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
}

interface MediaLibraryProps {
  media: MediaItem[]
}

export default function MediaLibrary({ media: initialMedia }: MediaLibraryProps) {
  const supabase = createClient()
  const [media, setMedia] = useState(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `media/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // Create media record
      const { data, error: dbError } = await supabase
        .from('media' as any)
        .insert({
          filename: file.name,
          original_url: urlData.publicUrl,
          storage_url: filePath,
          mime_type: file.type,
          file_size_bytes: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setMedia([data, ...media])
      setMessage({ type: 'success', text: 'File uploaded successfully!' })
      e.target.value = '' // Reset input
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const imageMedia = media.filter((item) => item.mime_type?.startsWith('image/'))
  const otherMedia = media.filter((item) => !item.mime_type?.startsWith('image/'))

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Media</h2>
        <div className="flex items-center gap-4">
          <label className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            {uploading ? 'Uploading...' : 'Choose File'}
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/*,video/*"
            />
          </label>
          <span className="text-sm text-gray-500">
            Upload images or videos to the media library
          </span>
        </div>
      </div>

      {/* Images Grid */}
      {imageMedia.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {imageMedia.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square relative bg-gray-100">
                  {item.storage_url ? (
                    <Image
                      src={item.original_url}
                      alt={item.alt_text || item.filename}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  {item.width && item.height && (
                    <p className="text-xs text-gray-400">
                      {item.width} × {item.height}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Media */}
      {otherMedia.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Files</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {otherMedia.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.filename}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.mime_type || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.file_size_bytes
                        ? `${(item.file_size_bytes / 1024).toFixed(1)} KB`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block max-w-xs"
                      >
                        {item.original_url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No media files yet. Upload your first file above.</p>
        </div>
      )}
    </div>
  )
}

