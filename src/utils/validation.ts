import * as path from 'path';

export class Validator {
  static isValidPath(filePath: string, allowedPaths?: string[]): boolean {
    if (!allowedPaths || allowedPaths.length === 0) {
      return true;
    }

    const normalized = path.normalize(filePath);
    return allowedPaths.some((allowed) => {
      const normalizedAllowed = path.normalize(allowed);
      return normalized.startsWith(normalizedAllowed);
    });
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidGitBranch(branchName: string): boolean {
    const invalidChars = /[~^:?*[\]\\]/;
    return !invalidChars.test(branchName) && branchName.length > 0;
  }

  static isValidModelName(modelName: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(modelName);
  }

  static sanitizePath(filePath: string): string {
    return path.normalize(filePath).replace(/\.\./g, '');
  }

  static sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
  }

  static validateFileExtension(filePath: string, allowedExtensions: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
  }
}

