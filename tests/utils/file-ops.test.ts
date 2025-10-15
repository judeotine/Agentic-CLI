import { FileOperations } from '../../src/utils/file-ops';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('FileOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const mockContent = 'test content';
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const content = await FileOperations.readFile('test.txt');

      expect(content).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith('test.txt', 'utf-8');
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await FileOperations.writeFile('test.txt', 'content');

      expect(fs.writeFile).toHaveBeenCalledWith('test.txt', 'content', 'utf-8');
    });

    it('should create directory if needed', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await FileOperations.writeFile('dir/test.txt', 'content');

      expect(fs.mkdir).toHaveBeenCalledWith('dir', { recursive: true });
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const exists = await FileOperations.fileExists('test.txt');

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const exists = await FileOperations.fileExists('test.txt');

      expect(exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await FileOperations.deleteFile('test.txt');

      expect(fs.unlink).toHaveBeenCalledWith('test.txt');
    });
  });
});

