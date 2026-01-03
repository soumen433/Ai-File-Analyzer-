

const constants = require('./constant');
const helper = require('./helper');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Headers, Request, Response } = require('node-fetch');
const { FormData } = require('formdata-node');
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.FormData = FormData;



const AI_SYSTEM_PROMPT = `You are an expert data analyst. Analyze the provided file content and answer the user's question accurately.
- Provide clear, structured responses
- If data contains numbers, provide calculations when relevant
- If you cannot find the answer, clearly state that
- Use markdown formatting for better readability`;
const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: "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",
    fetch: fetch
});

/**
 * Call OpenAI API for file analysis
 * @param {string} fileContent - File content text
 * @param {string} userQuery - User's question
 * @param {string} filename - Name of the file
 * @returns {Promise<Object>} AI response
 */
async function analyzeWithAI(fileContent, userQuery, filename) {

    try {
        const truncatedContent = helper.truncateForAI(fileContent);

        const userMessage = `## File: ${filename}

## Content:
\`\`\`
${truncatedContent}
\`\`\`

## Question:
${userQuery}`;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-1106",
            messages: [
                { role: "system", content: AI_SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });

        const aiResponse = response.choices?.[0]?.message?.content;

        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        return {
            status: constants.STATUS.SUCCESS,
            answer: aiResponse,
            model: "gpt-3.5-turbo-1106",
            usage: response.usage
        };

    } catch (error) {
     

        throw new error;
    }
}


/**
 * Search file by name and analyze with AI based on user query
 * @param {Object} ops - Request configuration object
 * @returns {Promise<Object>} AI analysis result
 */
async function searchAndAnalyze(ops = {}) {
   
    try {
        const { 
            searchTerm, 
            query: userQuery, 
            folderPath = constants.DEFAULT_FILES_FOLDER 
        } = ops.data?.[0] || {};

        // Validate inputs
        if (!searchTerm?.trim()) {
            throw("searchAndAnalyze: Invalid search term");           
        }

        if (!userQuery?.trim()) {
            throw("searchAndAnalyze: Invalid user query");
        }

        const absolutePath = path.isAbsolute(folderPath) 
            ? folderPath 
            : path.join(process.cwd(), folderPath);
        // Step 1: Search for files
        const files = helper.searchFiles(absolutePath, searchTerm.trim());

        if (files.length === 0) {
            return {
                status: constants.STATUS.SUCCESS,
                message: constants.ERROR_MESSAGES.NO_FILES_FOUND,
                data: {
                    searchTerm,
                    filesFound: 0,
                    aiResponse: null
                }
            };
        }

        // Step 2: Read first matching file
        const file = files[0];
        const parsedContent = await helper.readFileContent(file.filepath);

        // Step 3: Analyze with AI
        const aiResult = await analyzeWithAI(
            parsedContent.textContent,
            userQuery,
            file.filename
        );
        return {
            status: constants.STATUS.SUCCESS,
            message: constants.SUCCESS_MESSAGES.ANALYSIS_COMPLETE,
            data: {
                searchTerm,
                userQuery,
                file: {
                    filename: file.filename,
                    filepath: file.filepath,
                    extension: file.extension,
                    size: file.size,
                    sizeFormatted: file.sizeFormatted
                },
                aiResponse: aiResult.answer,
                model: aiResult.model
            }
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Search files by filename in configured folder
 * @param {Object} ops - Request configuration object
 * @returns {Promise<Object>} List of matching files
 */
async function searchFiles(ops = {}) {
    try {
        const { searchTerm, folderPath = "C:\\Users\\SoumenMaity\\aifiles" } = ops.body || {};

        if (!searchTerm?.trim()) {
            throw("searchFiles: Invalid search term");
        }

        const absolutePath = path.isAbsolute(folderPath) 
            ? folderPath 
            : path.join(process.cwd(), folderPath);

        const files = helper.searchFiles(absolutePath, searchTerm.trim());

        return {
            status: "success",
            message: files.length > 0 ? "Files found" : "No files found",
            data: files
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Analyze a specific file by filepath with user query
 * @param {Object} ops - Request configuration object
 * @returns {Promise<Object>} AI analysis result
 */
async function analyzeFile(ops = {}) {
    try {
        const { filepath, query: userQuery } = ops.data?.[0] || {};

        if (!filepath) {
            throw("analyzeFile: File not found");
        }

        if (!userQuery?.trim()) {
            throw("analyzeFile: No user query");
        }

        if (!fs.existsSync(filepath)) {
            throw("analyzeFile: File not found");
        }

        // Read and parse file content
        const parsedContent = await helper.readFileContent(filepath);
        const filename = path.basename(filepath);
        const stats = fs.statSync(filepath);

        // Analyze with AI
        const aiResult = await analyzeWithAI(
            parsedContent.textContent,
            userQuery,
            filename
        );

        return {
            status: constants.STATUS.SUCCESS,
            message: constants.SUCCESS_MESSAGES.ANALYSIS_COMPLETE,
            data: {
                userQuery,
                file: {
                    filename: filename,
                    filepath: filepath,
                    size: stats.size,
                    sizeFormatted: helper.formatFileSize(stats.size)
                },
                aiResponse: aiResult.answer,
                model: aiResult.model
            }
        };

    } catch (error) {
    
        throw error;
    }
}

// ...existing code...


/**
 * Analyze files from local folder with AI
 * Accepts file paths and names, reads content, and processes with AI
 * Supports single file, two-file comparison, or multi-file analysis
 * @param {Object} ops - Request configuration object
 * @param {Array} ops.data[0].files - Array of {filepath, filename}
 * @param {string} ops.data[0].query - User's question
 * @returns {Promise<Object>} AI analysis result
 */
async function analyzeFiles(ops = {}) {
   

    try {
        const { files, query: userQuery } = ops.body || {};

        // Validate files input
        // if (!files || !Array.isArray(files) || files.length === 0) {
        //     throw new Errors.ValidationError(constants.FILE_ANALYSIS_ERRORS.NO_FILES_PROVIDED);
        // }

        // // Validate query
        // if (!userQuery?.trim()) {
        //     throw new Errors.ValidationError(constants.FILE_ANALYSIS_ERRORS.NO_USER_QUERY);
        // }

        // // Validate max files
        // if (files.length > constants.FILE_ANALYSIS.MAX_FILES_FOR_ANALYSIS) {
        //     throw new Errors.ValidationError(constants.FILE_ANALYSIS_ERRORS.MAX_FILES_EXCEEDED);
        // }

        // // Validate each file has filepath and filename
        // for (const file of files) {
        //     if (!file.filepath || !file.filename) {
        //         throw new Errors.ValidationError(constants.FILE_ANALYSIS_ERRORS.INVALID_FILE_INPUT);
        //     }
        // }


        // Read content from each file
        const filesWithContent = [];

        for (const file of files) {
            const { filepath, filename } = file;

            // Check if file exists
            if (!fs.existsSync(filepath)) {
               throw "analyzeFiles: File not found - " + filepath;
            }

            // Read and parse file content
            const parsedContent = await helper.readFileContent(filepath);
            // const stats = fs.statSync(filepath);

            filesWithContent.push({
                filename,
                filepath,
                content: parsedContent.textContent,
                // size: stats.size,
                // sizeFormatted: helper.formatFileSize(stats.size)
            });
        }

        // Call AI service with files
        const aiResult = await analyzeFilesWithAI(
            ops,
            filesWithContent.map(f => ({ filename: f.filename, content: f.content })),
            userQuery
        );

        return {
            status: "success",
            message: aiResult.message,
            data: {
                userQuery,
                analysisType: aiResult.analysisType,
                fileCount: filesWithContent.length,
                filesAnalyzed: filesWithContent.map(f => ({
                    filename: f.filename,
                    filepath: f.filepath,
                    // size: f.size,
                    // sizeFormatted: f.sizeFormatted
                })),
                aiResponse: aiResult.answer,
                model: aiResult.model
            }
        };

    } catch (error) {
        
        throw error;
    }
}

// ...existing code...

// const constants = require('./constants');
// const helper = require('./helper');

/**
 * Analyze files with AI - supports single, comparison, or multi-file analysis
 * Automatically selects appropriate prompt based on file count
 * @param {Object} ops - Request configuration
 * @param {Array} files - Array of file objects with {filename, content}
 * @param {string} userQuery - User's question
 * @returns {Promise<Object>} AI analysis response
 */
async function analyzeFilesWithAI(ops, files, userQuery) {
   

    try {
        const fileCount = files.length;
        const analysisType = helper.getAnalysisType(fileCount);
        const systemPrompt = helper.getSystemPrompt(fileCount);
        const maxContentPerFile = Math.floor(constants.FILE_ANALYSIS.MAX_CONTENT_LENGTH_FOR_AI / fileCount);
        const fileNames = files.map(f => f.filename);
        const userMessage = helper.buildUserMessage(files, userQuery, maxContentPerFile);

     
        const response = await openai.chat.completions.create({
             model: "gpt-4.1",
            // model:"gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });

        const aiResponse = response.choices?.[0]?.message?.content;

        if (!aiResponse) {
            throw new Error("No response from AI");
        }

        const successMessage = helper.getSuccessMessage(analysisType);

        return {
            status: "success",
            message: successMessage,
            answer: aiResponse,
            model: response.model,
            usage: response.usage,
            analysisType,
            filesAnalyzed: fileNames
        };

    } catch (error) {
      

        throw error;
    }
}



module.exports = {
    analyzeWithAI,
    searchAndAnalyze,
    searchFiles,
    analyzeFile,
    analyzeFiles,
};