declare module '@gomark/capacitor-directory-picker' {
  export interface DirectoryResult {
    path: string;
    name: string;
    uri: string;
  }

  export interface DirectoryPickerPlugin {
    selectDirectory(): Promise<DirectoryResult>;
  }

  export const DirectoryPicker: DirectoryPickerPlugin;
}
