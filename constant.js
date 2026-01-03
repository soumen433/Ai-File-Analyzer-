// ...existing code...

const AI_PROMPTS = {
    SINGLE_FILE: `You are an expert data analyst. Analyze the provided file content and answer the user's question accurately.
- Provide clear, structured responses
- If data contains numbers, provide calculations when relevant
- If you cannot find the answer, clearly state that
- Use markdown formatting for better readability`,

    TWO_FILE_COMPARISON: `You are an expert data analyst specializing in file comparison.
- Compare the two provided files and identify key differences
- Highlight additions, deletions, and modifications
- If data contains numbers, calculate variances and percentage changes
- Provide a clear summary with a comparison table
- Use markdown formatting for better readability`,

    MULTI_FILE_ANALYSIS: `You are an expert data analyst specializing in multi-file analysis and trend identification.
- Analyze all provided files together
- Identify patterns, trends, and correlations across files
- If data contains numbers, calculate variances, totals, and percentages
- Provide consolidated insights from all files
- Use markdown formatting with tables where appropriate
- Answer specific questions considering data from all files`
};

const FILE_ANALYSIS = {
    SUPPORTED_EXTENSIONS: [".pdf", ".xlsx", ".xls", ".csv", ".json", ".txt"],
    MAX_CONTENT_LENGTH_FOR_AI: 100000,
    MAX_FILES_FOR_ANALYSIS: 10,
    DEFAULT_FILES_FOLDER: process.env.FILES_FOLDER || "uploads/documents"
};

const FILE_ANALYSIS_ERRORS = {
    NO_FILES_PROVIDED: "At least one file is required for analysis",
    NO_USER_QUERY: "Please provide a question to analyze",
    FILE_NOT_FOUND: "File not found",
    UNSUPPORTED_FILE_TYPE: "File type not supported",
    AI_SERVICE_ERROR: "AI service encountered an error",
    MAX_FILES_EXCEEDED: "Maximum 10 files allowed for analysis",
    FILE_READ_ERROR: "Error reading file content",
    INVALID_FILE_INPUT: "Invalid file input. Provide array of {filepath, filename}"
};

const FILE_ANALYSIS_SUCCESS = {
    SINGLE_ANALYSIS_COMPLETE: "Single file analysis completed successfully",
    COMPARISON_COMPLETE: "File comparison completed successfully",
    MULTI_ANALYSIS_COMPLETE: "Multi-file analysis completed successfully"
};

module.exports = {
    // ...existing code...
    AI_PROMPTS,
    FILE_ANALYSIS,
    FILE_ANALYSIS_ERRORS,
    FILE_ANALYSIS_SUCCESS
};