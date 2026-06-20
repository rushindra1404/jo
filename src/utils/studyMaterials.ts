export interface StudyMaterial {
  id: string; // e.g. "chapter01"
  num: number;
  title: string;
  pdfFileName: string;
  material: 'ica' | 'gpoe';
  sizeLabel: string;
}

export const ICA_MATERIALS: StudyMaterial[] = [
  { id: 'chapter01', num: 1, title: 'Global Steel Scenario & Indian Steel Industry', pdfFileName: 'Chapter 1. global steel scenario and indian steel industry.pdf', material: 'ica', sizeLabel: '1.0 MB' },
  { id: 'chapter02', num: 2, title: 'Vision, Culture & Core Values', pdfFileName: 'chapter 2. vision culture and  core values.pdf', material: 'ica', sizeLabel: '157 KB' },
  { id: 'chapter03', num: 3, title: 'SAIL: An Overview', pdfFileName: 'chapter 3. Sail an overview.pdf', material: 'ica', sizeLabel: '967 KB' },
  { id: 'chapter04', num: 4, title: 'Importance of MOU for SAIL', pdfFileName: 'chapter 4. Importance of MOU for SAIL.pdf', material: 'ica', sizeLabel: '279 KB' },
  { id: 'chapter05', num: 5, title: 'Company Strategies', pdfFileName: 'chapter 5. Company Startergies.pdf', material: 'ica', sizeLabel: '387 KB' },
  { id: 'chapter06', num: 6, title: 'Raw Materials for Steel Plants', pdfFileName: 'chapter 6. Raw materials for steel plants.pdf', material: 'ica', sizeLabel: '502 KB' },
  { id: 'chapter07', num: 7, title: 'Transportation in Steel Industry', pdfFileName: 'chapter 7. Transportation in Steel Industry.pdf', material: 'ica', sizeLabel: '187 KB' },
  { id: 'chapter08', num: 8, title: 'Relations with External Agencies', pdfFileName: 'chapter 8. Relations with external agencies.pdf', material: 'ica', sizeLabel: '79 KB' },
  { id: 'chapter09', num: 9, title: 'Environment Management in SAIL', pdfFileName: 'chapter 9. Envionment Management in SAIL.pdf', material: 'ica', sizeLabel: '548 KB' },
  { id: 'chapter10', num: 10, title: 'Major Services in Steel Plants & Their Roles', pdfFileName: 'chapter 10.  Major Services in Steel Plants and their roles.pdf', material: 'ica', sizeLabel: '94 KB' },
  { id: 'chapter11', num: 11, title: 'Major Functions in Steel Plants & Their Roles', pdfFileName: 'chapter 11. Mjor Function in Steel plants nd their roles.pdf', material: 'ica', sizeLabel: '252 KB' },
  { id: 'chapter12', num: 12, title: 'Safety & Health Management in SAIL', pdfFileName: 'chapter 12. Safety and Health Management in SAIL.pdf', material: 'ica', sizeLabel: '241 KB' },
  { id: 'chapter13', num: 13, title: 'Total Quality Process', pdfFileName: 'chapter 13. Total Quality Process.pdf', material: 'ica', sizeLabel: '161 KB' },
  { id: 'chapter14', num: 14, title: 'Suggestion Scheme & Quality Circles', pdfFileName: 'chapter 14. Suggestion Scheme QualityCircles.pdf', material: 'ica', sizeLabel: '228 KB' },
  { id: 'chapter15', num: 15, title: 'Financial Performance of SAIL', pdfFileName: 'chapter 15. Financial perfoemance of SAIL.pdf', material: 'ica', sizeLabel: '269 KB' },
  { id: 'chapter16', num: 16, title: 'Human Resource', pdfFileName: 'chapter 16. Human Resource.pdf', material: 'ica', sizeLabel: '249 KB' }
];

export const GPOE_MATERIALS: StudyMaterial[] = [
  { id: 'chapter01', num: 1, title: 'Raw Material Handling Plant', pdfFileName: '1) Raw material handling plant.pdf', material: 'gpoe', sizeLabel: '519 KB' },
  { id: 'chapter02', num: 2, title: 'Coke Ovens & Coal Chemicals', pdfFileName: '2) coke ovens and coal chemicals.pdf', material: 'gpoe', sizeLabel: '371 KB' },
  { id: 'chapter03', num: 3, title: 'Sinter Plant', pdfFileName: '3) Sinter Plant.pdf', material: 'gpoe', sizeLabel: '328 KB' },
  { id: 'chapter04', num: 4, title: 'Blast Furnace', pdfFileName: '4) Blast Furnace.pdf', material: 'gpoe', sizeLabel: '467 KB' },
  { id: 'chapter05', num: 5, title: 'Steel Making', pdfFileName: '5) Steel making.pdf', material: 'gpoe', sizeLabel: '901 KB' },
  { id: 'chapter06', num: 6, title: 'Rolling Mills', pdfFileName: '6) Rolling Mills.pdf', material: 'gpoe', sizeLabel: '691 KB' },
  { id: 'chapter08', num: 8, title: 'Hydraulics', pdfFileName: '8) Hydraulics.pdf', material: 'gpoe', sizeLabel: '742 KB' },
  { id: 'chapter11', num: 11, title: 'Computers', pdfFileName: '11) Computers.pdf', material: 'gpoe', sizeLabel: '575 KB' },
  { id: 'chapter12', num: 12, title: 'Mining', pdfFileName: '12) Mining.pdf', material: 'gpoe', sizeLabel: '218 KB' }
];

export const getStudyMaterialsByMaterial = (material: 'ica' | 'gpoe'): StudyMaterial[] => {
  return material === 'ica' ? ICA_MATERIALS : GPOE_MATERIALS;
};
