import { Model, Types } from 'mongoose';
import { Resource } from '../../resources/schemas/resource.schema';

export async function buildContextFromChunks(
  chunks: any[],
  resourceModel: Model<Resource>,
) {
  const uniqueIds = [
    ...new Set(chunks.map((c) => c.resourceId.toString())),
  ] as string[];

  const resources = await resourceModel
    .find({ _id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) } })
    .exec();

  const resourceMap = new Map(resources.map((r) => [r._id.toString(), r]));
  const context = chunks.map((c) => c.chunkText).join('\n\n---\n\n');
  const resourceTitles = uniqueIds
    .map((id) => (resourceMap.has(id) ? `- ${resourceMap.get(id)?.title}` : ''))
    .filter(Boolean)
    .join('\n');

  const sourcesMap = new Map<string, any>();
  for (const chunk of chunks) {
    const rId = chunk.resourceId.toString();
    const res = resourceMap.get(rId);
    if (res && !sourcesMap.has(rId)) {
      sourcesMap.set(rId, {
        score: chunk.score,
        text: chunk.chunkText.substring(0, 200) + '...',
        resourceId: rId,
        resource: {
          id: res._id.toString(),
          type: res.type,
          title: res.title,
          url: res.url,
        },
      });
    }
  }
  return { context, resourceTitles, sourcesMap };
}

export function expandQuery(query: string): string[] {
  const queries = [query];
  const l = query.toLowerCase();
  if (l.includes('що') || l.includes('what'))
    queries.push(query.replace(/що|what|про|about/gi, '').trim());
  if (l.includes('tell me') || l.includes('розкажи'))
    queries.push(`overview ${query}`);
  return [...new Set(queries)];
}

export async function handleEmptyResults(
  chunkModel: Model<any>,
  companyId: string,
) {
  const hasChunks = await chunkModel.exists({
    companyId: new Types.ObjectId(companyId),
  });

  if (!hasChunks) {
    return {
      content:
        'Your documents are still being processed or none have been uploaded yet.',
      sources: [],
    };
  }
  return {
    content:
      "I couldn't find specific information about that in your company documents.",
    sources: [],
  };
}

export function generateGenericWelcome(data: any): string {
  return `# Welcome ${data.employeeName || ''}! 👋\n\nI'm OnboardAI. Ask me anything about the company once resources are uploaded!`;
}

export function getAiStatus() {
  return process.env.GEMINI_API_KEY
    ? { status: 'operational', message: 'Gemini ready' }
    : { status: 'misconfigured', message: 'Missing GEMINI_API_KEY' };
}
