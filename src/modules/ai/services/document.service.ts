import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class DocumentService {
  async extractTextFromFile(
    fileData: Buffer,
    fileName: string,
  ): Promise<string> {
    const fileExtension = path.extname(fileName).toLowerCase();

    if (fileExtension === '.pdf') {
      const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.pdf`);
      try {
        fs.writeFileSync(tempFilePath, fileData);
        const loader = new PDFLoader(tempFilePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent).join('\n');
      } finally {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }
    }

    if (fileExtension === '.md' || fileExtension === '.txt') {
      return fileData.toString('utf-8');
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
