import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toan.lop12.com'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/de-thi-thu-tn-thpt-mon-toan-2026`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  let examUrls: MetadataRoute.Sitemap = []

  try {
    // Fetch all exam papers to include in sitemap. Use created_at since updated_at does not exist.
    const { data: exams, error } = await supabaseAdmin
      .from('exam_papers')
      .select('slug, name, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sitemap query error:', error)
    }

    if (exams) {
      examUrls = exams.map((exam) => ({
        url: `${baseUrl}/${exam.slug || encodeURIComponent(exam.name)}`,
        lastModified: exam.created_at ? new Date(exam.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (err) {
    console.error('Sitemap generation error:', err)
  }

  return [...staticPages, ...examUrls]
}
