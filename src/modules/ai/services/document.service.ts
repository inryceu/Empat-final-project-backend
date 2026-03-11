import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mammoth from 'mammoth';

@Injectable()
export class DocumentService {
  async extractTextFromFile(
    filePath: string,
    fileName: string,
  ): Promise<string> {
    const fileExtension = path.extname(fileName).toLowerCase();

    if (fileExtension === '.pdf') {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      return docs.map((doc) => doc.pageContent).join('\n');
    }

    if (fileExtension === '.docx') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (error) {
        throw new Error(`Помилка парсингу DOCX: ${error.message}`);
      }
    }

    if (fileExtension === '.md' || fileExtension === '.txt') {
      const content = await fs.readFile(filePath, { encoding: 'utf-8' });
      return content;
    }

    throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  async splitIntoChunks(
    content: string,
    chunkSize = 1000,
    chunkOverlap = 150,
  ): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    return splitter.splitText(content);
  }
}
