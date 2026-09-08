"""
DocuMorph CLI — command-line interface for the PDF cleaning pipeline.

Usage:
    python -m documorph process input.pdf
    python -m documorph process input.pdf --lang en
    python -m documorph batch data/input/
"""
import argparse
import sys
import os


def cmd_process(args):
    """Process a single PDF file."""
    import os
    import sys
    from documorph.worker.pipeline import DocuMorphOrchestrator

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)

    # Optional logic to override lang or local_engine
    kwargs = {}
    if args.lang:
        kwargs['target_lang'] = args.lang
    if hasattr(args, 'local_engine') and args.local_engine:
        kwargs['local_engine'] = args.local_engine

    orchestrator = DocuMorphOrchestrator(**kwargs)
    result = orchestrator.process_file(args.file)
    print(f"\nDone! Output: {result}")


def cmd_batch(args):
    """Process all PDFs in a directory."""
    from documorph.worker.pipeline import DocuMorphOrchestrator

    input_dir = args.directory
    if not os.path.isdir(input_dir):
        print(f"Error: Directory not found: {input_dir}")
        sys.exit(1)

    files = [
        os.path.join(input_dir, f)
        for f in sorted(os.listdir(input_dir))
        if f.lower().endswith(".pdf")
    ]
    if not files:
        print(f"No PDFs found in {input_dir}")
        sys.exit(1)

    print(f"Found {len(files)} PDFs to process.")
    orchestrator = DocuMorphOrchestrator()
    success = 0
    for f in files:
        try:
            orchestrator.process_file(f)
            success += 1
        except Exception as e:
            print(f"FAILED: {f} — {e}")

    print(f"\nBatch complete: {success}/{len(files)} succeeded.")


def cmd_enqueue(args):
    """Add a PDF file to the background processing queue."""
    from documorph.jobs import JobQueue
    
    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)
        
    queue = JobQueue()
    job_id = queue.add_job(args.file)
    print(f"Added {args.file} to queue (Job ID: {job_id}).")
    print("Run 'python -m documorph worker' in a separate terminal to process it.")


def cmd_worker(args):
    """Start the background worker to process the queue."""
    from documorph.jobs.worker import run_worker
    run_worker()


def main():
    parser = argparse.ArgumentParser(
        prog="documorph",
        description="DocuMorph — AI-Powered PDF Cleaning Pipeline",
    )
    sub = parser.add_subparsers(dest="command")

    # documorph process <file>
    parser_process = sub.add_parser('process', help='Process a single PDF')
    parser_process.add_argument('file', help='Path to the input PDF')
    parser_process.add_argument('--lang', help='Language mode (en, hi, hi-en, auto)', default=None)
    parser_process.add_argument('--local-engine', help='Local extraction engine to use (blocks, pymupdf4llm, dict)', default=None)
    parser_process.set_defaults(func=cmd_process)

    # documorph batch <directory>
    p_batch = sub.add_parser("batch", help="Process all PDFs in a directory")
    p_batch.add_argument("directory", help="Path to directory containing PDFs")
    p_batch.set_defaults(func=cmd_batch)

    # documorph enqueue <file>
    p_enqueue = sub.add_parser("enqueue", help="Add a single PDF to the processing queue")
    p_enqueue.add_argument("file", help="Path to the input PDF")
    p_enqueue.set_defaults(func=cmd_enqueue)

    # documorph worker
    p_worker = sub.add_parser("worker", help="Start the background worker to process queued jobs")
    p_worker.set_defaults(func=cmd_worker)

    args = parser.parse_args()
    if args.command is None:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
