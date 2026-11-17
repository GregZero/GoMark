import { WebPlugin } from '@capacitor/core';

export class DirectoryPickerWeb extends WebPlugin {
  async selectDirectory() {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite'
        });
        return { 
          path: dirHandle.name, 
          name: dirHandle.name,
          uri: dirHandle.name
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Directory selection cancelled');
        }
        throw error;
      }
    } else {
      throw new Error('Directory selection not supported in this browser');
    }
  }
}

const DirectoryPicker = new DirectoryPickerWeb();
export { DirectoryPicker };
