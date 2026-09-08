import sys

# If called with subcommands, use CLI
# If called with a direct file path, use pipeline for backward compatibility
if len(sys.argv) > 1 and sys.argv[1] in ("process", "batch", "worker", "enqueue", "--help", "-h"):
    from documorph.cli import main
else:
    from documorph.worker.pipeline import main

if __name__ == "__main__":
    main()
