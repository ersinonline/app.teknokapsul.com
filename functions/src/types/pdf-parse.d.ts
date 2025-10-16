declare module 'pdf-parse' {
  const pdf: (dataBuffer: Buffer | Uint8Array, options?: any) => Promise<{ text: string; [k: string]: any }>;
  export default pdf;
}