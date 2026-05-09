import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thi.booktoan.com'

  // Fetch all exam papers to include in sitemap
  const { data: exams } = await supabaseAdmin
    .from('exam_papers')
    .select('slug, name, updated_at')

  const examUrls = (exams || []).map((exam) => ({
    url: `${baseUrl}/${exam.slug || encodeURIComponent(exam.name)}`,
    lastModified: exam.updated_at ? new Date(exam.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...examUrls,
  ]
}
