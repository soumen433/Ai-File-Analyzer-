const path = require('path');
const fs = require('fs');
const constants = require('./constant');
const xlsx = require('xlsx');
const pdf = require("pdf-parse-fixed");

/**
 * Search files in folder by filename
 * @param {string} folderPath - Path to search in
 * @param {string} searchTerm - Term to search for
 * @returns {Array} Matching files
 */
function searchFiles(folderPath, searchTerm) {
    const results = [];
    
    if (!fs.existsSync(folderPath)) {
        return results;
    }

    const searchLower = searchTerm.toLowerCase();

    function searchDir(dirPath) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                searchDir(fullPath);
            } else if (item.isFile()) {
                const ext = path.extname(item.name).toLowerCase();
                
                if (item.name.toLowerCase().includes(searchLower) && 
                    constants.FILE_ANALYSIS.SUPPORTED_EXTENSIONS.includes(ext)) {
                    const stats = fs.statSync(fullPath);
                    results.push({
                        filename: item.name,
                        filepath: fullPath,
                        extension: ext,
                        size: stats.size,
                        sizeFormatted: formatFileSize(stats.size),
                        modifiedDate: stats.mtime
                    });
                }
            }
        }
    }

    searchDir(folderPath);
    return results;
}

/**
 * Read and parse file content based on type
 * @param {string} filepath - Path to file
 * @returns {Promise<Object>} Parsed content with textContent
 */
async function readFileContent(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    const buffer = fs.readFileSync(filepath);

    switch (ext) {
        case '.xlsx':
        case '.xls':
            return parseExcel(buffer);
        case '.csv':
            return parseCSV(buffer);
        case '.pdf':
            return await parsePDF(buffer);
        case '.json':
            return parseJSON(buffer);
        case '.txt':
            return parseText(buffer);
        default:
            throw new Error("Unsupported file type");
    }
}

/**
 * Format file size to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parse Excel file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Object} Parsed data with textContent
 */
function parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let textContent = '';

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        textContent += `\n--- ${sheetName} ---\n`;
        textContent += data.map(row => row.join('\t')).join('\n');
    }

    return { textContent, sheetCount: workbook.SheetNames.length };
}

/**
 * Parse CSV file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Object} Parsed data with textContent
 */
function parseCSV(buffer) {
    const textContent = buffer.toString('utf-8');
    const lines = textContent.split('\n').filter(l => l.trim());
    return { textContent, rowCount: lines.length };
}

/**
 * Parse PDF file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} Parsed data with textContent
 */
 
// ...existing code...

/**
 * Parse PDF file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} Parsed data with textContent
 */

async function parsePDF(buffer) {
    const data = await pdf(buffer);
    console.log(data.text);
    return { textContent: data.text, pageCount: data.numpages };
}

// ...existing code...

/**
 * Parse JSON file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Object} Parsed data with textContent
 */
function parseJSON(buffer) {
    const data = JSON.parse(buffer.toString('utf-8'));
    return { textContent: JSON.stringify(data, null, 2), data };
}

/**
 * Parse Text file to text content
 * @param {Buffer} buffer - File buffer
 * @returns {Object} Parsed data with textContent
 */
function parseText(buffer) {
    const textContent = buffer.toString('utf-8');
    return { textContent, lineCount: textContent.split('\n').length };
}

/**
 * Truncate content for AI processing
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content
 */
function truncateForAI(content, maxLength = constants.FILE_ANALYSIS.MAX_CONTENT_LENGTH_FOR_AI) {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n\n[Content truncated...]';
}

function getAnalysisType(fileCount) {
    if (fileCount === 1) return "single";
    if (fileCount === 2) return "comparison";
    return "multi";
}

function getSystemPrompt(fileCount) {
    if (fileCount === 1) {
        return constants.AI_PROMPTS.SINGLE_FILE;
    } else if (fileCount === 2) {
        return constants.AI_PROMPTS.TWO_FILE_COMPARISON;
    } else {
        return constants.AI_PROMPTS.MULTI_FILE_ANALYSIS;
    }
}


function getSuccessMessage(analysisType) {
    switch (analysisType) {
        case "single":
            return constants.FILE_ANALYSIS_SUCCESS.SINGLE_ANALYSIS_COMPLETE;
        case "comparison":
            return constants.FILE_ANALYSIS_SUCCESS.COMPARISON_COMPLETE;
        default:
            return constants.FILE_ANALYSIS_SUCCESS.MULTI_ANALYSIS_COMPLETE;
    }
}

function buildUserMessage(files, userQuery, maxContentPerFile) {
    let fileContentSection = '';
    const fileCount = files.length;

    files.forEach((file, index) => {
        const truncatedContent = truncateForAI(file.content, maxContentPerFile);

        if (fileCount === 1) {
            fileContentSection = `## File: ${file.filename}\n\`\`\`\n${truncatedContent}\n\`\`\``;
        } else {
            fileContentSection += `## File ${index + 1}: ${file.filename}\n\`\`\`\n${truncatedContent}\n\`\`\`\n\n`;
        }
    });

    let questionLabel = "Question";
    if (fileCount === 2) {
        questionLabel = "Comparison Question";
    } else if (fileCount > 2) {
        questionLabel = "Analysis Question";
    }

    return `${fileContentSection}\n\n## ${questionLabel}:\n${userQuery}`;
}





module.exports = {
    searchFiles,
    readFileContent,
    truncateForAI,
    getAnalysisType,
    getSystemPrompt,
    getSuccessMessage,
    buildUserMessage
};