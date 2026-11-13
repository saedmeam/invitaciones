import { describe, expect, it } from 'vitest';
import { extractGoogleDriveFolderId } from '../infrastructure/providers/GoogleDriveStorageProvider';

describe('Google Drive Folder ID Extractor & Sanitizer', () => {
  it('extrae ID desde URL estándar con /folders/ y query string', () => {
    const url = 'https://drive.google.com/drive/folders/1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst?usp=sharing';
    expect(extractGoogleDriveFolderId(url)).toBe('1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst');
  });

  it('extrae ID desde URL con multi-cuenta /u/0/folders/', () => {
    const url = 'https://drive.google.com/drive/u/0/folders/1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst';
    expect(extractGoogleDriveFolderId(url)).toBe('1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst');
  });

  it('extrae ID desde URL legacy con query param ?id=', () => {
    const url = 'https://drive.google.com/open?id=1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst&usp=drive_fs';
    expect(extractGoogleDriveFolderId(url)).toBe('1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst');
  });

  it('extrae ID desde URL de archivo /file/d/', () => {
    const url = 'https://drive.google.com/file/d/1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst/view?usp=sharing';
    expect(extractGoogleDriveFolderId(url)).toBe('1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst');
  });

  it('sanitiza ID directo con espacios en blanco', () => {
    const rawId = '  1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst \n ';
    expect(extractGoogleDriveFolderId(rawId)).toBe('1A2b3C4D5E6F7G8H9I0J-KLMNOP_qrst');
  });

  it('retorna null para entradas vacías o nulas', () => {
    expect(extractGoogleDriveFolderId('')).toBeNull();
    expect(extractGoogleDriveFolderId('   ')).toBeNull();
    expect(extractGoogleDriveFolderId(null)).toBeNull();
    expect(extractGoogleDriveFolderId(undefined)).toBeNull();
  });
});
