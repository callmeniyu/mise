import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Architecture & Zero-Backend Invariant Verification', () => {
  const srcDir = path.resolve(__dirname, '..');

  const getAllFiles = (dir: string, fileList: string[] = []): string[] => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!filePath.includes('__tests__') && !filePath.includes('node_modules')) {
          getAllFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        fileList.push(filePath);
      }
    });
    return fileList;
  };

  const appFiles = getAllFiles(srcDir);

  it('contains zero axios imports or calls in application code', () => {
    appFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]axios['"]/);
      expect(content).not.toMatch(/axios\./);
    });
  });

  it('contains zero Stripe imports or SDK calls in application code', () => {
    appFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]@stripe/);
      expect(content).not.toMatch(/loadStripe\(/);
    });
  });

  it('contains zero raw fetch calls targeting /api/ or backend ports', () => {
    appFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/fetch\s*\(\s*`[^`]*\/api\//);
      expect(content).not.toMatch(/fetch\s*\(\s*['"][^'"]*\/api\//);
      expect(content).not.toMatch(/VITE_API_URL/);
    });
  });

  it('contains zero Google OAuth or backend JWT references in application code', () => {
    appFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/passport/i);
      expect(content).not.toMatch(/google\/callback/i);
    });
  });
});
