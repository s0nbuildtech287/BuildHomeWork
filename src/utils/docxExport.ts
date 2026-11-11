import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { Homework } from '../types';
import { isChoiceQuestion, resolveCorrectOptionIndex, stripOptionPrefix } from './grading';

export type DocxExportMode = 'student' | 'student_with_key' | 'teacher';

async function buildImageParagraph(
  imageUrl: string,
  indentLeft = 0
): Promise<Paragraph | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const objectUrl = URL.createObjectURL(blob);
    let width = 320;
    let height = 200;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Invalid image'));
        el.src = objectUrl;
      });
      const maxW = 360;
      const maxH = 240;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      width = Math.max(40, Math.round(img.naturalWidth * ratio));
      height = Math.max(40, Math.round(img.naturalHeight * ratio));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    const mime = blob.type.toLowerCase();
    const imgType: 'png' | 'jpg' | 'gif' = mime.includes('png')
      ? 'png'
      : mime.includes('gif')
        ? 'gif'
        : 'jpg';

    return new Paragraph({
      spacing: { before: 60, after: 100 },
      indent: indentLeft > 0 ? { left: indentLeft } : undefined,
      children: [
        new ImageRun({
          data: arrayBuffer,
          transformation: { width, height },
          type: imgType,
        }),
      ],
    });
  } catch {
    return null;
  }
}

function safeFileName(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'English_Homework'
  );
}

export async function exportHomeworkToDocx(
  homework: Homework,
  mode: DocxExportMode = 'student_with_key'
): Promise<void> {
  const children: Array<Paragraph | Table> = [];

  // Header Banner: Center / Teacher Name
  if (homework.centerName || homework.teacherName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: [homework.centerName, homework.teacherName ? `GV: ${homework.teacherName}` : '']
              .filter(Boolean)
              .join('  •  '),
            bold: true,
            size: 20,
            color: '475569',
          }),
        ],
      })
    );
  }

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: homework.title.toUpperCase(),
          bold: true,
          size: 30,
          color: '1E293B',
        }),
      ],
    })
  );

  if (homework.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: homework.subtitle,
            italics: true,
            size: 21,
            color: '475569',
          }),
        ],
      })
    );
  }

  // Student info box
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Full Name: ', bold: true, size: 21 }),
                  new TextRun({ text: '____________________________', size: 21 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Class: ', bold: true, size: 21 }),
                  new TextRun({ text: homework.gradeOrClass || '__________', size: 21 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Score: ', bold: true, size: 21 }),
                  new TextRun({ text: '_____ / _____', size: 21 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(infoTable);
  children.push(new Paragraph({ spacing: { after: 180 }, children: [] }));

  // Sections & Questions
  let globalIndex = 1;
  const answerRows: Array<{
    num: number;
    answer: string;
    explanation: string;
  }> = [];
  const listeningScripts: Array<{ title: string; script: string }> = [];

  for (const section of homework.sections) {
    if (section.listeningScript) {
      listeningScripts.push({ title: section.title, script: section.listeningScript });
    }
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 24,
            color: '1D4ED8',
          }),
        ],
      })
    );

    if (section.instruction) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: section.instruction,
              italics: true,
              size: 21,
              color: '334155',
            }),
          ],
        })
      );
    }

    if (section.wordBank && section.wordBank.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          shading: { type: ShadingType.CLEAR, fill: 'F1F5F9', color: 'auto' },
          children: [
            new TextRun({ text: 'Word bank:  ', bold: true, size: 21 }),
            new TextRun({ text: section.wordBank.join('   •   '), size: 21 }),
          ],
        })
      );
    }

    if (section.imageUrl) {
      const secImgPara = await buildImageParagraph(section.imageUrl);
      if (secImgPara) children.push(secImgPara);
    }

    if (section.readingPassage) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 140 },
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: '94A3B8' },
          },
          indent: { left: 180, right: 120 },
          children: [
            new TextRun({
              text: section.readingPassage,
              size: 22,
            }),
          ],
        })
      );
    }

    for (const q of section.questions) {
      const qNum = globalIndex++;

      if (q.type === 'sentence_order' && q.words?.length) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({ text: `${qNum}. `, bold: true, size: 22 }),
              new TextRun({ text: q.words.join(' / '), size: 22 }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 320 },
            children: [
              new TextRun({
                text: '-> ____________________________________________________________',
                size: 21,
                color: '64748B',
              }),
            ],
          })
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 50 },
            children: [
              new TextRun({ text: `${qNum}. `, bold: true, size: 22 }),
              new TextRun({ text: q.prompt, size: 22 }),
            ],
          })
        );
      }

      if (q.imageUrl) {
        const qImgPara = await buildImageParagraph(q.imageUrl, 320);
        if (qImgPara) children.push(qImgPara);
      }

      if (isChoiceQuestion(q) && q.options?.length) {
        const optionText = q.options
          .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${stripOptionPrefix(opt)}`)
          .join('          ');
        children.push(
          new Paragraph({
            spacing: { after: 90 },
            indent: { left: 320 },
            children: [new TextRun({ text: optionText, size: 21 })],
          })
        );
      }

      if (q.type === 'rewrite' && !q.prompt.includes('____')) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 320 },
            children: [
              new TextRun({
                text: '-> ____________________________________________________________',
                size: 21,
                color: '64748B',
              }),
            ],
          })
        );
      }

      if (q.type === 'writing') {
        for (let lineIdx = 0; lineIdx < 4; lineIdx++) {
          children.push(
            new Paragraph({
              spacing: { after: lineIdx === 3 ? 110 : 70 },
              indent: { left: 320 },
              children: [
                new TextRun({
                  text: '____________________________________________________________________',
                  size: 21,
                  color: '94A3B8',
                }),
              ],
            })
          );
        }
      }

      let answerDisplay = q.correctAnswer;
      if (isChoiceQuestion(q) && q.options?.length) {
        const idx = resolveCorrectOptionIndex(q);
        if (idx >= 0) {
          answerDisplay = `${String.fromCharCode(65 + idx)}. ${stripOptionPrefix(q.options[idx])}`;
        }
      }

      answerRows.push({
        num: qNum,
        answer: answerDisplay,
        explanation: q.explanation,
      });
    }
  }

  // Answer Key Page
  if (mode !== 'student' && answerRows.length > 0) {
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text:
              mode === 'teacher'
                ? `ANSWER KEY & EXPLANATIONS — ${homework.title.toUpperCase()}`
                : `ANSWER KEY — ${homework.title.toUpperCase()}`,
            bold: true,
            size: 26,
            color: '1E293B',
          }),
        ],
      })
    );

    for (const row of answerRows) {
      const runs: TextRun[] = [
        new TextRun({ text: `Câu ${row.num}: `, bold: true, size: 21 }),
        new TextRun({ text: row.answer, bold: true, color: '0F766E', size: 21 }),
      ];
      if (mode === 'teacher' && row.explanation) {
        runs.push(
          new TextRun({
            text: `  —  ${row.explanation}`,
            size: 20,
            color: '334155',
          })
        );
      }
      children.push(
        new Paragraph({
          spacing: { after: 70 },
          children: runs,
        })
      );
    }

    if (listeningScripts.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: 'LISTENING TAPESCRIPT',
              bold: true,
              size: 23,
              color: '1E293B',
            }),
          ],
        })
      );
      for (const ls of listeningScripts) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: ls.title, bold: true, size: 21 })],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: ls.script, size: 21, color: '334155' })],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              bottom: 900,
              left: 1000,
              right: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = mode === 'student' ? 'De_Bai' : mode === 'teacher' ? 'Giao_Vien' : 'De_va_Dap_An';
  saveAs(blob, `${safeFileName(homework.title)}_${suffix}.docx`);
}

