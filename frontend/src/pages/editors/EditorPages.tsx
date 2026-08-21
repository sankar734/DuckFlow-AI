import React from 'react';
import { useParams } from 'react-router-dom';
import { WordEditor } from '../../components/editors/WordEditor';
import { ExcelWorkspace } from '../../components/editors/ExcelWorkspace';
import { PowerPointBuilder } from '../../components/editors/PowerPointBuilder';

export const WordPage: React.FC = () => {
  const { id } = useParams();
  return <WordEditor initialDocName={id ? `Document_${id}.docx` : 'Strategic_Architecture_Brief.docx'} />;
};

export const ExcelPage: React.FC = () => {
  const { id } = useParams();
  return <ExcelWorkspace initialDocName={id ? `Spreadsheet_${id}.xlsx` : 'Financial_Quarterly_Model.xlsx'} />;
};

export const PowerPointPage: React.FC = () => {
  const { id } = useParams();
  return <PowerPointBuilder initialDocName={id ? `Presentation_${id}.pptx` : 'DocuFlow_Pitch_Deck.pptx'} />;
};
