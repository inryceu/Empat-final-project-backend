import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrapeWebPage(url: string, title?: string): Promise<string> {
    let rawContent: string;

    if (url.includes('docs.google.com/document')) {
      rawContent = await this.scrapeGoogleDoc(url);
    } else if (
      url.includes('notion.so') ||
      url.includes('notion.site') ||
      url.includes('webflow.io')
    ) {
      rawContent = await this.scrapeDynamicPage(url);
    } else {
      rawContent = await this.scrapeStaticPage(url);
    }

    return this.cleanAndStructureContent(rawContent, url, title);
  }

  private async scrapeGoogleDoc(url: string): Promise<string> {
    const exportUrl = url.replace(/\/edit.*$/, '/export?format=txt');
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('Google Doc requires authentication or permission.');
      }
      throw new Error(`Failed to export Google Doc: HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.trim().length < 20)
      throw new Error('Google Doc is empty.');
    return text.trim();
  }

  private async scrapeStaticPage(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, iframe, noscript').remove();

    const selectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '[role="main"]',
      'body',
    ];
    let text = '';

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        text = element.text();
        break;
      }
    }

    return (text || $('body').text())
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private async scrapeDynamicPage(url: string): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      );
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const content = await page.evaluate(() => {
        const article = document.querySelector(
          'article, main, .notion-page-content, body',
        ) as HTMLElement;
        const text = article?.innerText || '';
        return !text || text.trim().length < 10
          ? document.body?.innerText || ''
          : text;
      });

      await browser.close();
      if (!content || content.trim().length < 20)
        throw new Error('Dynamic page is empty.');
      return content.trim();
    } catch (error) {
      if (browser) await browser.close();
      throw new Error(`Puppeteer failed: ${error.message}`);
    }
  }

  private cleanAndStructureContent(
    rawText: string,
    url: string,
    title?: string,
  ): string {
    let cleaned = rawText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();

    const uiPatterns = [
      /\([A-Z]\)\s/g,
      /Ctrl\+[A-Z]/gi,
      /Alt\+[/A-Z]/gi,
      /Shift\+[A-Z]/gi,
      /\b[A-Z]{2,}\+[A-Z]{2,}\b/g,
      /►\s*/g,
      /\(\s*[A-Z]\s*\)/g,
    ];
    uiPatterns.forEach((pattern) => (cleaned = cleaned.replace(pattern, '')));

    const lines = cleaned.split('\n');
    const uniqueLines = new Map<string, number>();
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed)
        uniqueLines.set(trimmed, (uniqueLines.get(trimmed) || 0) + 1);
    });

    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 20 || (uniqueLines.get(trimmed) || 0) <= 2;
    });

    const navWords = new Set([
      'створити',
      'create',
      'відкрити',
      'open',
      'зберегти',
      'save',
      'меню',
      'menu',
      'файл',
      'file',
      'редагувати',
      'edit',
    ]);
    const meaningfulLines = filteredLines.filter((line) => {
      const words = line.trim().toLowerCase().split(/\s+/);
      return !(words.length <= 2 && words.every((w) => navWords.has(w)));
    });

    let documentHeader = title ? `# ${title}\n\n` : '';
    documentHeader += `Document extracted from: ${url}\nExtraction date: ${new Date().toISOString()}\n\n---\n\n`;

    return (
      documentHeader +
      meaningfulLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+([.,!?])/g, '$1')
        .trim()
    );
  }
}
