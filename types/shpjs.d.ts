declare module 'shpjs' {
  const shp: (source: string | ArrayBuffer) => Promise<any>;
  export default shp;
}
