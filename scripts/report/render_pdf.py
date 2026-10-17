"""Render an existing report PDF for manual visual review; does not modify it."""
import argparse
from pathlib import Path
from pdf2image import convert_from_path

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--poppler-bin',required=True,help='Directory containing pdfinfo and pdftoppm')
parser.add_argument('--output',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
output=args.output or root/'.local/ca3-report/render'
output.mkdir(parents=True,exist_ok=True)
pages=convert_from_path(str(root/'submission/SpendWise_AI_CA3_Report.pdf'),dpi=110,
    output_folder=str(output),fmt='png',output_file='page',paths_only=True,
    poppler_path=args.poppler_bin)
print(f'Rendered {len(pages)} pages to {output}. Inspect every page before submission.')
