from setuptools import setup, find_packages

setup(
    name="documorph",
    version="0.1.0",
    description="AI-Powered PDF Cleaning Pipeline for Indian Competitive Exam Notes",
    author="Aarish Ali",
    python_requires=">=3.9",
    packages=find_packages(),
    install_requires=[
        "pymupdf>=1.24.0",
        "google-genai>=1.0.0",
        "markdown",
        "playwright",
        "python-dotenv",
        "requests",
    ],
    entry_points={
        "console_scripts": [
            "documorph=documorph.cli:main",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Topic :: Text Processing :: General",
    ],
)
