import type { Chapter } from '../types';

export const GPOE_CHAPTERS: Chapter[] = [
  { id: 'chapter01', num: 1, title: 'Raw Material Handling Plant', fileName: 'chapter01.csv', material: 'gpoe' },
  { id: 'chapter02', num: 2, title: 'Coke Ovens & Coal Chemicals', fileName: 'chapter02.csv', material: 'gpoe' },
  { id: 'chapter03', num: 3, title: 'Sinter Plant', fileName: 'chapter03.csv', material: 'gpoe' },
  { id: 'chapter04', num: 4, title: 'Blast Furnace', fileName: 'chapter04.csv', material: 'gpoe' },
  { id: 'chapter05', num: 5, title: 'Steel Making', fileName: 'chapter05.csv', material: 'gpoe' },
  { id: 'chapter06', num: 6, title: 'Rolling Mills', fileName: 'chapter06.csv', material: 'gpoe' },
  { id: 'chapter08', num: 8, title: 'Hydraulics', fileName: 'chapter08.csv', material: 'gpoe' },
  { id: 'chapter11', num: 11, title: 'Computers', fileName: 'chapter11.csv', material: 'gpoe' },
  { id: 'chapter12', num: 12, title: 'Mining', fileName: 'chapter12.csv', material: 'gpoe' }
];

export const ICA_CHAPTERS: Chapter[] = [
  { id: 'chapter01', num: 1, title: 'Global Steel Scenario & Indian Steel Industry', fileName: 'chapter01.csv', material: 'ica' },
  { id: 'chapter02', num: 2, title: 'Vision, Culture & Core Values', fileName: 'chapter02.csv', material: 'ica' },
  { id: 'chapter03', num: 3, title: 'SAIL: An Overview', fileName: 'chapter03.csv', material: 'ica' },
  { id: 'chapter04', num: 4, title: 'Importance of MOU for SAIL', fileName: 'chapter04.csv', material: 'ica' },
  { id: 'chapter05', num: 5, title: 'Company Strategies', fileName: 'chapter05.csv', material: 'ica' },
  { id: 'chapter06', num: 6, title: 'Raw Materials for Steel Plants', fileName: 'chapter06.csv', material: 'ica' },
  { id: 'chapter07', num: 7, title: 'Transportation in Steel Industry', fileName: 'chapter07.csv', material: 'ica' },
  { id: 'chapter08', num: 8, title: 'Relations with External Agencies', fileName: 'chapter08.csv', material: 'ica' },
  { id: 'chapter09', num: 9, title: 'Environment Management in SAIL', fileName: 'chapter09.csv', material: 'ica' },
  { id: 'chapter10', num: 10, title: 'Major Services in Steel Plants & Their Roles', fileName: 'chapter10.csv', material: 'ica' },
  { id: 'chapter11', num: 11, title: 'Major Functions in Steel Plants & Their Roles', fileName: 'chapter11.csv', material: 'ica' },
  { id: 'chapter12', num: 12, title: 'Safety & Health Management in SAIL', fileName: 'chapter12.csv', material: 'ica' },
  { id: 'chapter13', num: 13, title: 'Total Quality Process', fileName: 'Chapter13.csv', material: 'ica' }, // Capital C as in file
  { id: 'chapter14', num: 14, title: 'Suggestion Scheme & Quality Circles', fileName: 'Chapter14.csv', material: 'ica' }, // Capital C as in file
  { id: 'chapter15', num: 15, title: 'Financial Performance of SAIL', fileName: 'Chapter15.csv', material: 'ica' }, // Capital C as in file
  { id: 'chapter16', num: 16, title: 'Human Resource', fileName: 'chapter16.csv', material: 'ica' }
];

export const getChaptersByMaterial = (material: 'ica' | 'gpoe'): Chapter[] => {
  return material === 'ica' ? ICA_CHAPTERS : GPOE_CHAPTERS;
};
