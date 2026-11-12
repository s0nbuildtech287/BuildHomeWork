import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { AppSettings, Homework } from '../types';
import { loadSettings } from '../services/storage';
import {
  formatMcqOptionDisplay,
  isChoiceQuestion,
  isEssayQuestion,
  resolveCorrectOptionIndex,
  splitFormattedLines,
  stripOptionPrefix,
} from './grading';

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

function buildBrandBarTable(
  leftText: string,
  rightChildren: Array<TextRun>,
  fillColor: string,
  options: { bold?: boolean; size?: number; leftPercent?: number; rightPercent?: number } = {}
): Table {
  const { bold = false, size = 20, leftPercent = 60, rightPercent = 40 } = options;
  const noBorder = { style: BorderStyle.NONE, size: 0, color: fillColor };
  const cellBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };
  const cellMargins = { top: 45, bottom: 45, left: 100, right: 100 };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftPercent, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: fillColor },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: leftText,
                    font: 'Times New Roman',
                    bold,
                    italics: true,
                    size,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: rightPercent, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: cellMargins,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: fillColor },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: rightChildren,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildAlignedOptionsElements(options: string[]): Array<Paragraph | Table> {
  const formatted = options.map((opt, idx) => formatMcqOptionDisplay(opt, idx));
  const maxLen = Math.max(...formatted.map((x) => x.full.length), 0);

  // Long options (> 38 chars): 1 option per line, cleanly indented
  if (maxLen > 38) {
    return formatted.map(
      (item, idx) =>
        new Paragraph({
          spacing: { before: 0, after: idx === formatted.length - 1 ? 90 : 30 },
          indent: { left: 320 },
          children: [
            new TextRun({ text: `${item.letter}.`, bold: true, size: 21 }),
            ...(item.text ? [new TextRun({ text: ` ${item.text}`, size: 21 })] : []),
          ],
        })
    );
  }

  // Short (<= 16 chars, 4 items): 1 row x 4 equal columns (25% each)
  // Medium (17..38 chars): 2 rows x 2 equal columns (50% each)
  const cols = maxLen <= 16 && formatted.length === 4 ? 4 : 2;
  const colWidthPct = Math.floor(100 / cols);
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  const rows: TableRow[] = [];
  for (let r = 0; r < formatted.length; r += cols) {
    const rowCells: TableCell[] = [];
    for (let c = 0; c < cols; c++) {
      const item = formatted[r + c];
      rowCells.push(
        new TableCell({
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          margins: { top: 20, bottom: 30, left: c === 0 ? 320 : 80, right: 80 },
          children: item
            ? [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({ text: `${item.letter}.`, bold: true, size: 21 }),
                    ...(item.text ? [new TextRun({ text: ` ${item.text}`, size: 21 })] : []),
                  ],
                }),
              ]
            : [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
        })
      );
    }
    rows.push(new TableRow({ children: rowCells }));
  }

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: noBorder,
        bottom: noBorder,
        left: noBorder,
        right: noBorder,
        insideHorizontal: noBorder,
        insideVertical: noBorder,
      },
      rows,
    }),
    new Paragraph({ spacing: { before: 0, after: 60 }, children: [] }),
  ];
}

export async function exportHomeworkToDocx(
  homework: Homework,
  mode: DocxExportMode = 'student_with_key',
  customSettings?: AppSettings
): Promise<void> {
  const settings = customSettings || loadSettings();
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
      const isMatchingBox = section.wordBank.every((w) =>
        /^[A-Za-z][.)]\s+/.test(w.trim())
      );
      if (isMatchingBox) {
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                      left: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                      right: { style: BorderStyle.SINGLE, size: 6, color: '94A3B8' },
                    },
                    margins: { top: 100, bottom: 100, left: 160, right: 160 },
                    children: section.wordBank.map(
                      (item) =>
                        new Paragraph({
                          spacing: { after: 50 },
                          children: [new TextRun({ text: item, size: 21 })],
                        })
                    ),
                  }),
                ],
              }),
            ],
          })
        );
        children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
      } else {
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
    }

    if (section.imageUrl) {
      const secImgPara = await buildImageParagraph(section.imageUrl);
      if (secImgPara) children.push(secImgPara);
    }

    if (section.readingPassage) {
      const passageLines = splitFormattedLines(section.readingPassage);
      passageLines.forEach((line, lIdx) => {
        children.push(
          new Paragraph({
            spacing: {
              before: lIdx === 0 ? 60 : 0,
              after: lIdx === passageLines.length - 1 ? 140 : 40,
            },
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
            border: {
              left: { style: BorderStyle.SINGLE, size: 12, color: '94A3B8' },
            },
            indent: { left: 180, right: 120 },
            children: [
              new TextRun({
                text: line,
                size: 22,
                bold: /^Removed options:/i.test(line.trim()),
              }),
            ],
          })
        );
      });
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
        const promptLines = splitFormattedLines(q.prompt);
        const firstLine = promptLines[0] ?? q.prompt;
        children.push(
          new Paragraph({
            spacing: { before: 80, after: promptLines.length > 1 ? 30 : 50 },
            children: [
              new TextRun({ text: `${qNum}. `, bold: true, size: 22 }),
              new TextRun({ text: firstLine, size: 22 }),
            ],
          })
        );
        for (let lIdx = 1; lIdx < promptLines.length; lIdx++) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: lIdx === promptLines.length - 1 ? 50 : 25 },
              indent: { left: 320 },
              children: [new TextRun({ text: promptLines[lIdx], size: 22 })],
            })
          );
        }
      }

      if (q.imageUrl) {
        const qImgPara = await buildImageParagraph(q.imageUrl, 320);
        if (qImgPara) children.push(qImgPara);
      }

      if (isChoiceQuestion(q) && q.options?.length) {
        children.push(...buildAlignedOptionsElements(q.options));
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

      if (isEssayQuestion(q)) {
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

  const useBrandBar = settings.enableBrandHeaderFooter !== false;
  const barColor = (settings.headerFooterColor || '7075B8').replace(/^#/, '');
  const headerLeftText = settings.headerLeft?.trim() || 'MS. HUONG - 0327161636';
  const headerRightText = settings.headerRight?.trim() || 'T-CLASS EDUCATION - 0978386622';
  const footerLeftText =
    settings.footerLeft?.trim() ||
    'T-CLASS EDUCATION - Số nhà 9,12,14-16 Ngõ 71 Khu Dịch vụ 3, Văn Phú, Hà Đông, HN';

  const headerBar = buildBrandBarTable(
    headerLeftText,
    [
      new TextRun({
        text: headerRightText,
        font: 'Times New Roman',
        bold: true,
        italics: true,
        size: 20,
        color: 'FFFFFF',
      }),
    ],
    barColor,
    { bold: true, size: 20, leftPercent: 50, rightPercent: 50 }
  );

  const footerBar = buildBrandBarTable(
    footerLeftText,
    [
      new TextRun({
        children: ['Page | ', PageNumber.CURRENT],
        font: 'Times New Roman',
        bold: false,
        italics: true,
        size: 19,
        color: 'FFFFFF',
      }),
    ],
    barColor,
    { bold: false, size: 19, leftPercent: 82, rightPercent: 18 }
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: useBrandBar ? 1050 : 900,
              bottom: useBrandBar ? 1050 : 900,
              left: 1000,
              right: 1000,
              header: 450,
              footer: 450,
            },
          },
        },
        headers: useBrandBar ? { default: new Header({ children: [headerBar] }) } : undefined,
        footers: useBrandBar ? { default: new Footer({ children: [footerBar] }) } : undefined,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = mode === 'student' ? 'De_Bai' : mode === 'teacher' ? 'Giao_Vien' : 'De_va_Dap_An';
  saveAs(blob, `${safeFileName(homework.title)}_${suffix}.docx`);
}

