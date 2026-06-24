declare module 'encoding-japanese' {
  type Encodings = 'UTF8' | 'UNICODE' | 'SJIS' | 'EUCJP' | 'JIS' | 'UTF16' | 'AUTO';
  interface ConvertOptions {
    to: Encodings;
    from?: Encodings;
  }
  const Encoding: {
    stringToCode(s: string): number[];
    codeToString(code: number[]): string;
    convert(
      data: number[] | Uint8Array,
      to: Encodings | ConvertOptions,
      from?: Encodings
    ): number[];
    detect(data: number[] | string): Encodings | false;
  };
  export default Encoding;
}
