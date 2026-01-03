// const fs = require('fs');
// const path = require('path');
// const xlsx = require('xlsx');
// const pdf = require('pdf-parse');
// const constants = require('./constants');
const  MAX_CONTENT_LENGTH_FOR_AI = 100000;




/**
 * Truncate content for AI processing
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content
 */
function truncateForAI(content, maxLength = MAX_CONTENT_LENGTH_FOR_AI) {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n\n[Content truncated...]';
}



module.exports = {
    
    truncateForAI,
 
};